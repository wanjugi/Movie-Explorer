import { findStation, fixedLiveSources, playbackChannels } from '../src/catalogue/liveTvStations.js'

const idPattern = /^[\w-]{11}$/
const channelPattern = /^UC[\w-]{22}$/
const API = 'https://www.googleapis.com/youtube/v3/'
const minute = 60_000
const day = 24 * 60 * minute
const part = 'snippet,status,liveStreamingDetails,contentDetails'

function json(body, status = 200, headers = {}) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers } })
}

function permittedIn(item, source, country) {
  const rule = item.contentDetails?.regionRestriction
  if (Array.isArray(rule?.allowed) && !rule.allowed.length) return false
  // With no trusted viewer country, YouTube enforces the region at playback.
  if (!country) return true
  const allowed = rule?.allowed ?? (rule ? undefined : source?.regions)
  return (!Array.isArray(allowed) || allowed.includes(country))
    && (!Array.isArray(rule?.blocked) || !rule.blocked.includes(country))
}

function mainBroadcast(item, station) {
  return item.id === station.videoId ||
    (station.simulcastTitles ?? []).some(title => item.snippet.title.trim().toLowerCase() === title.toLowerCase())
}

function rejection(item, station, country, now, expectedChannels, source) {
  if (!item) return 'missing'
  if (!expectedChannels.includes(item.snippet?.channelId)) return 'publisher'
  if (item.liveStreamingDetails?.actualEndTime) return 'ended'
  if (item.status?.embeddable === false) return 'non_embeddable'
  if (item.snippet?.liveBroadcastContent !== 'live' || item.status?.privacyStatus !== 'public' ||
    item.status.embeddable !== true || item.status.uploadStatus === 'failed' ||
    item.contentDetails?.contentRating?.ytRating === 'ytAgeRestricted' ||
    typeof item.snippet.title !== 'string' || !Number.isFinite(Date.parse(item.liveStreamingDetails?.actualStartTime)) ||
    Date.parse(item.liveStreamingDetails.actualStartTime) > now ||
    (station.rollingFeedOnly && !mainBroadcast(item, station))) return 'ineligible'
  if (!permittedIn(item, source, country)) return 'region'
}

export function selectLiveVideo(items, station, country, now, expectedChannels = playbackChannels(station)) {
  const fixed = fixedLiveSources(station)
  const eligible = []
  let restricted = false
  for (const item of items) {
    if (typeof item?.id !== 'string' || !idPattern.test(item.id)) continue
    const source = fixed.find(candidate => candidate.id === item.id)
    const reason = rejection(item, station, country, now, expectedChannels, source)
    if (reason === 'region') restricted = true
    if (!reason && (!source || item.snippet.channelId === source.channelId)) eligible.push(item)
  }
  const video = fixed.map(source => eligible.find(item => item.id === source.id)).find(Boolean) ??
    eligible.find(item => mainBroadcast(item, station)) ?? eligible[0]
  if (!video) return { status: restricted ? 'restricted' : 'unavailable' }
  const thumbnail = video.snippet.thumbnails?.high?.url ?? video.snippet.thumbnails?.medium?.url
  return {
    status: 'live',
    videoId: video.id,
    title: video.snippet.title.slice(0, 180),
    kind: mainBroadcast(video, station) ? 'simulcast' : 'event',
    ...(typeof thumbnail === 'string' && thumbnail.startsWith('https://i.ytimg.com/vi/' + video.id + '/')
      && /^https:\/\/i\.ytimg\.com\/vi\/[\w-]{11}\/[\w-]+\.jpg$/.test(thumbnail) ? { thumbnail } : {}),
  }
}

async function youtube(path, query, fetchUpstream, key, signal) {
  const url = new URL(path, API)
  url.search = new URLSearchParams(query)
  let response
  try {
    response = await fetchUpstream(url, { signal, redirect: 'error', headers: { 'X-Goog-Api-Key': key } })
  } catch {
    throw new Error(signal.aborted ? 'timeout' : 'network')
  }
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const reasons = [data?.error?.status, ...(Array.isArray(data?.error?.errors) ? data.error.errors.map(item => item?.reason) : []),
      ...(Array.isArray(data?.error?.details) ? data.error.details.map(item => item?.reason) : [])]
    if (response.status === 429 || reasons.some(reason => ['quotaExceeded', 'dailyLimitExceeded', 'rateLimitExceeded', 'userRateLimitExceeded'].includes(reason))) {
      throw new Error('quota')
    }
    if (reasons.some(reason => ['keyInvalid', 'API_KEY_INVALID'].includes(reason))) throw new Error('key-rejected')
    if (reasons.some(reason => ['accessNotConfigured', 'SERVICE_DISABLED'].includes(reason))) throw new Error('api-disabled')
    if (reasons.some(reason => /^API_KEY_.*_BLOCKED$/.test(reason ?? ''))) throw new Error('key-restricted')
    throw new Error('upstream')
  }
  if (!Array.isArray(data?.items) || data.items.length > 6) throw new Error('schema')
  return data.items
}

function withRejections(value, rejected) {
  if (value.status === 'live') delete rejected[value.videoId]
  return Object.keys(rejected).length ? { ...value, rejected: { ...rejected } } : value
}

export function createLiveTvHandler({ now = Date.now, stationFor = findStation } = {}) {
  const cache = new Map()
  const lastSearch = new Map()
  const lastRecovery = new Map()
  const searchAttempts = []
  let quotaUntil = 0
  let activeRequests = 0

  function searchBudget(time) {
    while (searchAttempts.length && searchAttempts[0] <= time - day) searchAttempts.shift()
    return searchAttempts.length >= 40 ? Math.ceil((searchAttempts[0] + day - time) / 1000) : 0
  }

  async function discover(station, country, old, failed, key, fetchUpstream, record) {
    const sourceList = fixedLiveSources(station)
    const channels = playbackChannels(station)
    const signal = AbortSignal.timeout(7500)
    const videos = ids => youtube('videos', { part, id: ids.join(',') }, fetchUpstream, key, signal)
    const known = [...new Set([...sourceList.map(source => source.id), old?.videoId])]
      .filter(id => id && id !== failed && idPattern.test(id))
    let restricted = false
    if (known.length) {
      const rows = await videos(known)
      if (!record()) return
      for (const id of known) {
        const source = sourceList.find(candidate => candidate.id === id)
        const row = rows.find(item => item?.id === id)
        const reason = rejection(row, station, country, now(), source ? [source.channelId] : channels, source)
        if (!record(id, reason)) return
        if (reason === 'region') restricted = true
      }
      const checked = selectLiveVideo(rows.filter(item => known.includes(item?.id)), station, country, now())
      if (checked.status === 'live') return checked
    }

    const time = now()
    const recovering = failed && time - (lastRecovery.get(station.slug) ?? -Infinity) >= 5 * minute
    const retry = searchBudget(time) ||
      (!recovering ? Math.ceil(((lastSearch.get(station.slug) ?? -Infinity) + minute - time) / 1000) : 0)
    if (retry > 0) return { status: 'cooldown', retryAfter: retry }
    lastSearch.set(station.slug, time)
    if (recovering) lastRecovery.set(station.slug, time)
    for (const channelId of channels) {
      if (!record()) return
      if (quotaUntil > now()) throw new Error('quota-cooldown')
      const remaining = searchBudget(now())
      if (remaining) return { status: 'cooldown', retryAfter: remaining }
      searchAttempts.push(now())
      const hits = await youtube('search', {
        part: 'snippet', channelId, type: 'video', eventType: 'live',
        videoEmbeddable: 'true', ...(country ? { regionCode: country } : {}), maxResults: '6',
      }, fetchUpstream, key, signal)
      if (!record()) return
      const ids = [...new Set(hits.filter(item => item?.snippet?.channelId === channelId &&
        item.id?.kind === 'youtube#video' && idPattern.test(item.id.videoId ?? '') && item.id.videoId !== failed)
        .map(item => item.id.videoId))]
      if (!ids.length) continue
      const rows = await videos(ids)
      if (!record()) return
      for (const source of sourceList.filter(candidate => ids.includes(candidate.id) && candidate.channelId === channelId)) {
        const row = rows.find(item => item?.id === source.id)
        record(source.id, rejection(row, station, country, now(), [channelId], source))
      }
      const checked = selectLiveVideo(rows.filter(item => ids.includes(item?.id)), station, country, now(), [channelId])
      if (checked.status === 'live') return checked
      if (checked.status === 'restricted') restricted = true
    }
    return { status: restricted ? 'restricted' : 'unavailable' }
  }

  return async function handle(request, {
    key = process.env.YOUTUBE_DATA_API_KEY, fetchUpstream = globalThis.fetch,
  } = {}) {
    if (request.method !== 'GET') return json({ status: 'invalid' }, 405, { Allow: 'GET' })
    let params
    try {
      if (typeof request.url !== 'string' || request.url.length > 512) throw new Error()
      const url = new URL(request.url, 'http://localhost')
      decodeURIComponent(url.search)
      params = url.searchParams
    } catch { return json({ status: 'invalid' }, 400) }
    const keys = [...params.keys()]
    const failed = params.get('failed')
    const station = stationFor(params.get('station'))
    if (new Set(keys).size !== keys.length || keys.some(name => !['operation', 'station', 'failed'].includes(name))
      || params.get('operation') !== 'resolve' || !station || (failed !== null && !idPattern.test(failed))) {
      return json({ status: 'invalid' }, 400)
    }
    const channels = playbackChannels(station)
    if (station.discovery === false || !channels.length || channels.length > 2 ||
      !channels.every(id => channelPattern.test(id ?? ''))) return json({ status: 'unsupported' })
    const header = request.headers?.get?.('x-vercel-ip-country') ?? request.headers?.['x-vercel-ip-country']
    const country = /^[A-Z]{2}$/.test(header ?? '') ? header : (station.rollingFeedOnly ? '' : 'KE')
    const cacheKey = station.slug + ':' + country
    const fixed = fixedLiveSources(station)
    const regionalRejections = Object.fromEntries(fixed.filter(source => country && source.regions && !source.regions.includes(country))
      .map(source => [source.id, 'region']))
    const state = cache.get(cacheKey) ?? { rejected: {}, expires: 0 }
    const rejected = () => ({ ...regionalRejections, ...state.rejected })
    const send = (value, status = 200) => json(withRejections(value, rejected()), status,
      value.retryAfter ? { 'Retry-After': String(value.retryAfter) } : {})
    const staleId = failed && (fixed.some(source => source.id === failed) || failed === state.value?.videoId ||
      failed === state.job?.failed) ? failed : null
    if (staleId) {
      if (fixed.some(source => source.id === staleId)) state.rejected[staleId] = 'player'
      if (state.value?.videoId === staleId) state.expires = 0
    }
    if (!key?.trim()) return send({ status: Object.keys(regionalRejections).length ? 'restricted' : 'unconfigured' })
    if (state.expires > now() && !state.job) return send(state.value)

    if (!state.job || (staleId && state.job.failed !== staleId)) {
      if (quotaUntil > now() || activeRequests >= 8) {
        const value = quotaUntil > now()
          ? { status: 'quota', retryAfter: Math.ceil((quotaUntil - now()) / 1000) }
          : { status: 'cooldown', retryAfter: 15 }
        if (state.job) {
          state.job = null
          state.lastResult = value
        }
        return send(value, 429)
      }
      if (!cache.has(cacheKey) && cache.size >= 48) {
        const evict = [...cache].find(([, entry]) => !entry.job)
        if (!evict) return send({ status: 'cooldown', retryAfter: 15 }, 429)
        cache.delete(evict[0])
      }
      cache.set(cacheKey, state)
      const job = { failed: staleId }
      state.job = job
      const record = (id, reason) => {
        if (state.job !== job) return false
        if (fixed.some(source => source.id === id)) {
          if (reason) state.rejected[id] = reason
          else delete state.rejected[id]
        }
        return true
      }
      activeRequests++
      job.promise = discover(station, country, state.value, staleId, key, fetchUpstream, record)
        .then(value => {
          if (!value) return
          if (value.status === 'live' && JSON.stringify(value).includes(key)) throw new Error('schema')
          if (state.job === job && value.status !== 'cooldown') {
            state.value = value
            state.expires = now() + (value.status === 'live' ? minute : 90_000)
          }
          return value
        }).catch(error => {
          if (error.message === 'quota') quotaUntil = Math.max(quotaUntil, now() + 15 * minute)
          if (error.message === 'quota' || error.message === 'quota-cooldown') {
            return { status: 'quota', retryAfter: Math.max(1, Math.ceil((quotaUntil - now()) / 1000)) }
          }
          return { status: 'upstream', retryAfter: 15 }
        }).finally(() => { activeRequests-- })
    }
    let job = state.job
    let value = await job.promise
    while (state.job && state.job !== job) {
      job = state.job
      value = await job.promise
    }
    if (state.job === job) {
      state.job = null
      state.lastResult = value
    } else {
      value = state.lastResult
    }
    if (!value) return send({ status: 'upstream', retryAfter: 15 }, 502)
    return send(value, value.status === 'upstream' ? 502 : ['quota', 'cooldown'].includes(value.status) ? 429 : 200)
  }
}

export const handleLiveTvRequest = createLiveTvHandler()

