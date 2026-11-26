import { TRAILER_LOCALE } from '../catalogue/trailerSelection.js'
import { isMediaId } from '../catalogue/mediaIdentity.js'
import { fetchMovieVideos } from './moviesApi.js'
import { fetchTvVideos } from './tvApi.js'

export function createTrailerLookup({
  load = (type, id, signal) => type === 'movie' ? fetchMovieVideos(id, signal) : fetchTvVideos(id, signal),
  now = Date.now,
} = {}) {
  const cache = new Map()
  const pending = new Map()

  return async function lookup(type, id, signal) {
    signal?.throwIfAborted()
    if ((type !== 'movie' && type !== 'tv') || !isMediaId(id)) throw new TypeError('Invalid trailer title')
    const key = [type, id, TRAILER_LOCALE].join(':')
    const entry = cache.get(key)
    cache.delete(key)
    if (entry && entry.expires > now()) {
      cache.set(key, entry)
      return entry.results
    }
    let request = pending.get(key)
    if (!request) {
      const controller = new AbortController()
      request = { controller, users: 0 }
      request.promise = Promise.resolve().then(() => load(type, id, controller.signal)).then(({ results }) => {
        controller.signal.throwIfAborted()
        cache.set(key, { results, expires: now() + (results.length ? 600_000 : 60_000) })
        if (cache.size > 24) cache.delete(cache.keys().next().value)
        return results
      }).finally(() => {
        if (pending.get(key) === request) pending.delete(key)
      })
      pending.set(key, request)
    }
    request.users++
    let abort
    try {
      if (!signal) return await request.promise
      const cancelled = new Promise((_, reject) => {
        abort = () => reject(signal.reason)
        signal.addEventListener('abort', abort, { once: true })
      })
      return await Promise.race([request.promise, cancelled])
    } finally {
      if (abort) signal.removeEventListener('abort', abort)
      if (--request.users === 0 && pending.get(key) === request) {
        pending.delete(key)
        request.controller.abort()
      }
    }
  }
}

export const lookupTrailers = createTrailerLookup()
