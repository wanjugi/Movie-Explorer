import test from 'node:test'
import assert from 'node:assert/strict'
import { createLiveTvHandler, selectLiveVideo } from '../server/live-tv.js'

const channelId = 'UC' + 'a'.repeat(22)
const oldId = '12345678901'
const newId = 'abcdefghijk'
const station = { slug: 'fixture', channelId, videoId: oldId, simulcastTitles: ['Fixture Live'] }
const now = Date.parse('2026-11-26T19:00:00Z')
const request = (query = 'operation=resolve&station=fixture', method = 'GET') => new Request('https://example.test/api/live-tv?' + query, { method })
const options = fetchUpstream => ({ key: 'synthetic-key', fetchUpstream })
const row = (id, title = 'Fixture Live') => ({
  id, snippet: { channelId, title, liveBroadcastContent: 'live' },
  status: { privacyStatus: 'public', embeddable: true },
  liveStreamingDetails: { actualStartTime: new Date(now - 60000).toISOString() },
  contentDetails: {},
})
const search = id => ({ id: { kind: 'youtube#video', videoId: id }, snippet: { channelId } })
const response = items => Response.json({ items })
const handler = time => createLiveTvHandler({ now: time ?? (() => now), stationFor: slug => slug === station.slug ? station : null })

test('only currently live, public, embeddable videos of the exact official channel qualify', () => {
  const valid = row(newId, 'Election interviews')
  const ended = row(oldId)
  ended.liveStreamingDetails.actualEndTime = new Date(now - 5000).toISOString()
  const upcoming = row(oldId)
  upcoming.snippet.liveBroadcastContent = 'upcoming'
  const mismatched = row(oldId)
  mismatched.snippet.channelId = 'UC' + 'b'.repeat(22)
  const blockedEmbed = row(oldId)
  blockedEmbed.status.embeddable = false
  const privateEvent = row(oldId)
  privateEvent.status.privacyStatus = 'private'
  assert.deepEqual(selectLiveVideo([ended, upcoming, mismatched, blockedEmbed, privateEvent], station, 'KE', now), { status: 'unavailable' })
  assert.equal(selectLiveVideo([valid], station, 'KE', now).kind, 'event')
  assert.equal(selectLiveVideo([valid, row(oldId)], station, 'KE', now).videoId, oldId)
  valid.contentDetails.regionRestriction = { allowed: ['US'] }
  assert.equal(selectLiveVideo([valid], station, 'KE', now).status, 'restricted')
})

test('invalid requests and missing credentials make no upstream requests', async () => {
  const handle = handler()
  const noop = () => assert.fail('unexpected upstream request')
  for (const query of ['operation=resolve&station=wrong', 'operation=resolve&station=fixture&station=fixture',
    'operation=resolve&station=fixture&channelId=x', 'operation=resolve&station=fixture&failed=%G1']) {
    assert.equal((await handle(request(query), options(noop))).status, 400)
  }
  assert.equal((await handle(request(undefined, 'POST'), options(noop))).status, 405)
  assert.deepEqual(await (await handle(request(), { key: '', fetchUpstream: noop })).json(), { status: 'unconfigured' })
})

test('known ID is revalidated, shared and cached without exposing the Google key', async () => {
  let time = now
  const handle = handler(() => time)
  let calls = 0
  async function fetchUpstream(url, init) {
    calls++
    assert.equal(url.href.includes('synthetic-key'), false)
    assert.equal(url.origin, 'https://www.googleapis.com')
    assert.equal(url.pathname, '/youtube/v3/videos')
    assert.equal(init.headers['X-Goog-Api-Key'], 'synthetic-key')
    assert.equal(init.redirect, 'error')
    return response([row(oldId)])
  }
  const [a, b] = await Promise.all([handle(request(), options(fetchUpstream)), handle(request(), options(fetchUpstream))])
  assert.equal((await a.json()).videoId, oldId)
  assert.equal((await b.json()).videoId, oldId)
  await handle(request(), options(fetchUpstream))
  assert.equal(calls, 1)
  time += 61_000
  await handle(request(), options(fetchUpstream))
  assert.equal(calls, 2)
})

test('player failure excludes the failed known ID and validates a bounded replacement search', async () => {
  const handle = handler()
  const calls = []
  const result = await handle(request('operation=resolve&station=fixture&failed=' + oldId), options(async url => {
    calls.push(url.pathname)
    if (url.pathname.endsWith('/search')) {
      assert.equal(url.searchParams.get('actualStartTime'), null)
      assert.equal(url.searchParams.get('type'), 'video')
      assert.equal(url.searchParams.get('eventType'), 'live')
      assert.equal(url.searchParams.get('channelId'), channelId)
      return response([search(oldId), search(newId)])
    }
    assert.equal(url.searchParams.get('id'), newId)
    return response([row(newId)])
  }))
  assert.equal((await result.json()).videoId, newId)
  assert.deepEqual(calls, ['/youtube/v3/search', '/youtube/v3/videos'])
})

test('quota errors impose a cooldown and never reveal upstream details', async () => {
  const handle = handler()
  let calls = 0
  const upstream = async () => {
    calls++
    return Response.json({ error: { message: 'internal synthetic-key', errors: [{ reason: 'quotaExceeded' }] } }, { status: 403 })
  }
  for (let i = 0; i < 2; i++) {
    const result = await handle(request(), options(upstream))
    assert.equal(result.status, 429)
    assert.deepEqual(await result.json(), { status: 'quota', retryAfter: 900 })
  }
  assert.equal(calls, 1)
})

test('temporary fallback uses current time and excludes positive rejections and player failures', async () => {
  const { liveFallback } = await import('../src/services/liveTvApi.js')
  const expiring = { ...station, expires: new Date(now + 1000).toISOString() }
  for (const status of ['quota', 'cooldown', 'upstream', 'unconfigured']) {
    assert.equal(liveFallback(expiring, { status }, [], now)?.id, oldId)
    assert.equal(liveFallback(expiring, { status }, [], now + 1000), undefined)
    assert.equal(liveFallback(expiring, { status }, [oldId], now), undefined)
    assert.equal(liveFallback(expiring, { status, rejected: { [oldId]: 'ended' } }, [], now), undefined)
  }
  for (const status of ['unavailable', 'restricted', 'unsupported']) {
    assert.equal(liveFallback(expiring, { status }, [], now), undefined)
  }
  let resolve
  let time = now
  const response = new Promise(done => { resolve = done })
  const selection = response.then(result => liveFallback(expiring, result, [], time))
  time += 1000
  resolve({ status: 'upstream' })
  assert.equal(await selection, undefined)
})

test('confirmed fixed-source rejection survives replacement quota and network errors', async () => {
  const ended = row(oldId)
  ended.liveStreamingDetails.actualEndTime = new Date(now).toISOString()
  const restricted = row(oldId)
  restricted.contentDetails.regionRestriction = { allowed: ['US'] }
  const nonEmbeddable = row(oldId)
  nonEmbeddable.status.embeddable = false
  for (const [items, reason] of [[[ended], 'ended'], [[restricted], 'region'], [[nonEmbeddable], 'non_embeddable'], [[], 'missing']]) {
    for (const quota of [true, false]) {
      const handle = handler()
      const kenyanRequest = new Request(request().url, { headers: { 'x-vercel-ip-country': 'KE' } })
      const result = await handle(kenyanRequest, options(async url => {
        if (url.pathname.endsWith('/videos')) return response(items)
        if (quota) return Response.json({ error: { errors: [{ reason: 'quotaExceeded' }] } }, { status: 403 })
        throw new Error('network')
      }))
      assert.equal(result.status, quota ? 429 : 502)
      assert.deepEqual((await result.json()).rejected, { [oldId]: reason })
    }
  }
})

const secondChannel = 'UC' + 'b'.repeat(22)
const secondId = '22222222222'
const twoChannels = { ...station, playbackChannels: [channelId, secondChannel],
  secondarySources: [{ id: secondId, channelId: secondChannel }] }
const secondRow = () => {
  const item = row(secondId, 'The afternoon programme')
  item.snippet.channelId = secondChannel
  return item
}

test('known KBC-style sources share a batch, prefer primary, and enforce each publisher', async () => {
  const wrong = row(oldId)
  wrong.snippet.channelId = secondChannel
  for (const [primary, expected] of [[row(oldId), oldId], [wrong, secondId]]) {
    const handle = createLiveTvHandler({ now: () => now, stationFor: () => twoChannels })
    let calls = 0
    const result = await handle(request(), options(async url => {
      calls++
      assert.equal(url.pathname, '/youtube/v3/videos')
      assert.equal(url.searchParams.get('id'), oldId + ',' + secondId)
      return response([secondRow(), primary])
    }))
    const body = await result.json()
    assert.equal(body.videoId, expected)
    assert.equal(calls, 1)
    if (primary === wrong) assert.deepEqual(body.rejected, { [oldId]: 'publisher' })
  }
})

test('bounded primary/secondary discovery counts each search and reports the true rolling cooldown', async () => {
  let time = now
  let searches = 0
  const handle = createLiveTvHandler({ now: () => time, stationFor: () => twoChannels })
  const upstream = async url => {
    if (url.pathname.endsWith('/videos')) return response([])
    assert.equal(url.searchParams.get('channelId'), searches % 2 === 0 ? channelId : secondChannel)
    searches++
    return response([])
  }
  for (let attempt = 0; attempt < 20; attempt++) {
    assert.equal((await (await handle(request(), options(upstream))).json()).status, 'unavailable')
    time += 91_000
  }
  const limited = await handle(request(), options(upstream))
  assert.equal(searches, 40)
  assert.equal(limited.status, 429)
  assert.equal(limited.headers.get('Retry-After'), String(86_400 - 20 * 91))
  assert.equal((await limited.json()).retryAfter, 86_400 - 20 * 91)
})

test('primary discovery success skips secondary, and secondary accepts only its publisher', async () => {
  for (const primaryWins of [true, false]) {
    const handle = createLiveTvHandler({ now: () => now, stationFor: () => twoChannels })
    const searched = []
    const result = await handle(request(), options(async url => {
      const channel = url.searchParams.get('channelId')
      const id = url.searchParams.get('id')
      if (id === oldId + ',' + secondId) return response([])
      if (channel) {
        searched.push(channel)
        if (channel === channelId && !primaryWins) return response([])
        const hit = search(newId)
        hit.snippet.channelId = channel
        return response([hit])
      }
      const item = row(newId)
      item.snippet.channelId = primaryWins ? channelId : secondChannel
      return response([item, row('33333333333')])
    }))
    assert.equal((await result.json()).videoId, newId)
    assert.deepEqual(searched, primaryWins ? [channelId] : [channelId, secondChannel])
  }
})

test('a slow normal request cannot republish an asset superseded by recovery', async () => {
  const handle = handler()
  let finish
  const normal = handle(request(), options(() => new Promise(resolve => { finish = resolve })))
  const recoveryRequest = request('operation=resolve&station=fixture&failed=' + oldId)
  const recover = async url => url.pathname.endsWith('/search') ? response([search(newId)]) : response([row(newId)])
  const replacement = await (await handle(recoveryRequest, options(recover))).json()
  assert.equal(replacement.videoId, newId)
  finish(response([row(oldId)]))
  assert.equal((await (await normal).json()).videoId, newId)
  const cached = await handle(request(), options(() => assert.fail('cache miss')))
  assert.equal((await cached.json()).videoId, newId)
})

test('actual station identities, BBC video-specific region and rolling feed, and CGTN event eligibility', async () => {
  const { findStation, playbackChannels } = await import('../src/catalogue/liveTvStations.js')
  const ktn = findStation('ktn-home')
  const kbc = findStation('kbc-channel-1')
  const bbc = findStation('bbc-news')
  const cgtn = findStation('cgtn-africa')
  assert.equal(ktn.id, 'channel:ktn-home')
  assert.deepEqual(playbackChannels(ktn), ['UCKVsdeoHExltrWMuK0hOWmg'])
  assert.deepEqual(playbackChannels(kbc), ['UCypNjM5hP1qcUqQZe57jNfg', 'UCegApUZsuaWaXYf5g9W8Mzw'])
  assert.equal(findStation('cnn-international').youtube, undefined)
  const ktnLive = row(newId, 'KTN Kenya Live – Breaking News, Politics and Current Affairs, 24/7')
  ktnLive.snippet.channelId = playbackChannels(ktn)[0]
  assert.equal(selectLiveVideo([ktnLive], ktn, 'KE', now).kind, 'simulcast')
  const bbcVideo = row(bbc.videoId, 'Watch BBC News LIVE')
  bbcVideo.snippet.channelId = playbackChannels(bbc)[0]
  assert.equal(selectLiveVideo([bbcVideo], bbc, 'KE', now).status, 'live')
  assert.equal(selectLiveVideo([bbcVideo], bbc, 'US', now).status, 'restricted')
  assert.equal(selectLiveVideo([{ ...bbcVideo, id: newId, snippet: { ...bbcVideo.snippet, title: 'BBC Election Debate' } }], bbc, 'KE', now).status, 'unavailable')
  const noKey = createLiveTvHandler({ now: () => now })
  const bbcRequest = new Request(request('operation=resolve&station=bbc-news').url, { headers: { 'x-vercel-ip-country': 'US' } })
  assert.deepEqual(await (await noKey(bbcRequest, { key: '' })).json(), { status: 'restricted', rejected: { [bbc.videoId]: 'region' } })
  const event = row(newId, 'Africa Live with Richard Nta')
  event.snippet.channelId = playbackChannels(cgtn)[0]
  delete event.contentDetails
  assert.equal(selectLiveVideo([event], cgtn, 'KE', now).kind, 'event')
  event.snippet.liveBroadcastContent = 'upcoming'
  assert.equal(selectLiveVideo([event], cgtn, 'KE', now).status, 'unavailable')
  event.snippet.liveBroadcastContent = 'live'
  event.liveStreamingDetails.actualEndTime = new Date(now).toISOString()
  assert.equal(selectLiveVideo([event], cgtn, 'KE', now).status, 'unavailable')
})

