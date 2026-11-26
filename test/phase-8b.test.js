import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { handleMovieRequest } from '../server/movies.js'
import { handleTvRequest } from '../server/tv.js'
import { createTrailerLookup } from '../src/services/trailerLookup.js'
import { createTrailerSession } from '../src/composables/trailerSession.js'

const upstreamKey = 'synthetic-test-marker'
const clip = (key, options) => ({ key, site: 'YouTube', type: 'Trailer', ...options })
const first = { key: 'abcdefghijk', type: 'Trailer' }
const upstream = [
  clip('not/allowed'), clip('unsupported', { site: 'Vimeo' }), clip('unofficial1', { type: 'Teaser' }),
  clip('otherlocale', { official: true, iso_639_1: 'fr' }),
  clip(first.key, { official: true, iso_639_1: 'en', iso_3166_1: 'US', unexpected: upstreamKey }),
  clip(first.key), clip('teaservideo', { official: true, type: 'Teaser' }),
]

for (const [type, handler] of [['movie', handleMovieRequest], ['tv', handleTvRequest]]) {
  test(type + ' videos use the fixed provider path and project only validated public choices', async () => {
    let called = false
    const response = await handler({ method: 'GET', url: '/api?operation=videos&id=550' }, {
      apiKey: upstreamKey,
      fetchUpstream: async (url, options) => {
        called = true
        assert.equal(url.origin, 'https://api.themoviedb.org')
        assert.equal(url.pathname, '/3/' + type + '/550/videos')
        assert.deepEqual(Object.fromEntries(url.searchParams), { language: 'en-US', api_key: upstreamKey })
        assert.equal(options.redirect, 'error')
        return Response.json({ id: 550, results: upstream })
      },
    })
    assert.equal(response.status, 200)
    assert.equal(called, true)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.deepEqual(await response.json(), { results: [
      first, { key: 'otherlocale', type: 'Trailer' }, { key: 'teaservideo', type: 'Teaser' },
    ] })
  })
}

test('videos reject unexpected requests and distinguish valid absence from upstream failures', async () => {
  for (const [method, query, status] of [
    ['POST', 'id=550', 405], ['GET', 'id=550&id=551', 400], ['GET', 'id=2147483648', 400],
    ['GET', 'id=0', 400], ['GET', 'id=550&locale=fr', 400], ['GET', 'id=550&url=http://example.test', 400],
  ]) {
    let called = false
    const response = await handleMovieRequest({ method, url: '/api/movies?operation=videos&' + query }, {
      apiKey: upstreamKey, fetchUpstream: async () => { called = true },
    })
    assert.equal(response.status, status)
    assert.equal(called, false)
  }
  const request = { method: 'GET', url: '/api/tv?operation=videos&id=550' }
  const empty = await handleTvRequest(request, {
    apiKey: upstreamKey, fetchUpstream: async () => Response.json({ id: 550, results: [clip('unsupported', { site: 'Vimeo' })] }),
  })
  assert.deepEqual(await empty.json(), { results: [] })
  const error = await handleTvRequest(request, {
    apiKey: upstreamKey, fetchUpstream: async () => new Response(upstreamKey, { status: 429, headers: { 'Retry-After': '9' } }),
  })
  assert.equal(error.status, 429)
  assert.equal(error.headers.get('retry-after'), '9')
  assert.doesNotMatch(await error.text(), /synthetic-test-marker/)
})

test('coalesced trailer lookup cancels callers independently and rejects obsolete responses', async () => {
  const runs = []
  const lookup = createTrailerLookup({ load: (type, id, signal) => new Promise(resolve => runs.push({ signal, resolve })) })
  const a = new AbortController()
  const b = new AbortController()
  const one = lookup('movie', 550, a.signal)
  const two = lookup('movie', 550, b.signal)
  await Promise.resolve()
  assert.equal(runs.length, 1)
  a.abort()
  await assert.rejects(one, { name: 'AbortError' })
  assert.equal(runs[0].signal.aborted, false)
  b.abort()
  await assert.rejects(two, { name: 'AbortError' })
  assert.equal(runs[0].signal.aborted, true)
  runs[0].resolve({ results: [] })
  const fresh = lookup('movie', 550)
  await Promise.resolve()
  assert.equal(runs.length, 2)
  runs[1].resolve({ results: [first] })
  assert.deepEqual(await fresh, [first])
  assert.deepEqual(await lookup('movie', 550), [first])
})

test('trailer cache keeps confirmed absence briefly and never treats errors as absence', async () => {
  let clock = 0
  let calls = 0
  const lookup = createTrailerLookup({ now: () => clock, load: async () => {
    if (++calls === 1) throw new Error('temporary outage')
    return { results: [] }
  } })
  await assert.rejects(lookup('tv', 1), /temporary outage/)
  assert.deepEqual(await lookup('tv', 1), [])
  await lookup('tv', 1)
  assert.equal(calls, 2)
  clock = 60_000
  await lookup('tv', 1)
  assert.equal(calls, 3)
})

test('only one trailer owns playback and stale dismissal cannot close a replacement', () => {
  const session = createTrailerSession()
  const first = { preview: true }
  const second = { preview: false }
  assert.equal(session.open(first), true)
  assert.equal(session.open({ preview: true }), false)
  assert.equal(session.open(second), true)
  session.close(first, false)
  assert.equal(session.active.value, second)
  session.close(second, false)
  assert.equal(session.active.value, null)
})

test('pre-paint theme restores explicit preference and handles storage failures', async () => {
  const source = await readFile(new URL('../public/theme-preference.js', import.meta.url), 'utf8')
  for (const input of [null, 'dark', 'light', 'garbage', 'throw']) {
    let stored = input
    const window = { localStorage: {
      getItem(key) {
        assert.equal(key, 'movieExplorer.theme')
        if (input === 'throw') throw new Error('blocked')
        return stored
      },
      setItem(key, value) {
        assert.equal(key, 'movieExplorer.theme')
        if (input === 'throw') throw new Error('blocked')
        stored = value
      },
    } }
    const root = { dataset: {} }
    runInNewContext(source, { window, document: { documentElement: root } })
    assert.equal(root.dataset.theme, input === 'light' ? 'light' : 'dark')
    window.movieExplorerTheme.set('light')
    assert.equal(root.dataset.theme, 'light')
    if (input !== 'throw') assert.equal(stored, 'light')
    assert.equal(window.movieExplorerTheme.set('invalid'), 'dark')
  }
})
