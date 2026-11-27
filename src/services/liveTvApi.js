import { fixedLiveSource } from '../catalogue/liveTvStations.js'

const states = new Set(['live', 'unavailable', 'restricted', 'unsupported', 'unconfigured', 'cooldown', 'quota', 'upstream'])
const temporary = new Set(['unconfigured', 'cooldown', 'quota', 'upstream'])
const rejections = new Set(['missing', 'publisher', 'ended', 'non_embeddable', 'ineligible', 'region', 'player'])

export function liveFallback(station, result, excluded, now = Date.now()) {
  if (!temporary.has(result.status)) return
  return fixedLiveSource(station, [...excluded, ...Object.keys(result.rejected ?? {})], now)
}

export async function resolveLiveStation(slug, signal, failed) {
  const params = new URLSearchParams({ operation: 'resolve', station: slug })
  if (failed) params.set('failed', failed)
  const response = await fetch('/api/live-tv?' + params, { signal, cache: 'no-store' })
  if (![200, 429, 502].includes(response.status)) throw new Error('Availability check failed')
  const result = await response.json()
  if (!states.has(result?.status) || (result.status === 'live' &&
    (!/^[\w-]{11}$/.test(result.videoId ?? '') || typeof result.title !== 'string' || !['event', 'simulcast'].includes(result.kind))) ||
    (result.retryAfter !== undefined && (!Number.isInteger(result.retryAfter) || result.retryAfter < 1 || result.retryAfter > 86_400)) ||
    (result.rejected !== undefined && (!result.rejected || typeof result.rejected !== 'object' ||
      Array.isArray(result.rejected) || Object.keys(result.rejected).length > 2 ||
      Object.entries(result.rejected).some(([id, reason]) => !/^[\w-]{11}$/.test(id) || !rejections.has(reason))))) {
    throw new Error('Invalid live broadcast response')
  }
  return result
}
