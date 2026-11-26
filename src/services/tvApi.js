import { isMoviePageEnvelope } from '../catalogue/moviePages.js'
import { isMovieSummary, isTvSummary, isMediaId } from '../catalogue/mediaIdentity.js'
import { TV_FEEDS } from '../catalogue/tvFilters.js'
import { isTrailerEnvelope } from '../catalogue/trailerSelection.js'
import { fetchMoviePage, MovieApiError, requestMedia } from './moviesApi.js'

function requestTv(operation, parameters, field, validate, signal) {
  return requestMedia('/api/tv?', operation, parameters, field, validate, { signal, throwOnError: true })
}

const isMixedItem = item => item?.media_type === 'movie' ? isMovieSummary(item)
  : item?.media_type === 'tv' && isTvSummary(item)

export async function fetchTvPage(operation, parameters, signal) {
  if (operation !== 'search' && operation !== 'multi-search' && !Object.hasOwn(TV_FEEDS, operation)) {
    throw new MovieApiError('invalid')
  }
  return requestTv(operation, parameters, null,
    data => isMoviePageEnvelope(data) && data.results.every(isMixedItem), signal)
}

export function fetchGlobalPage(query, type, page, signal) {
  const parameters = page ? { query, page } : { query }
  if (type === 'movie') return fetchMoviePage('search', parameters, { signal })
  return fetchTvPage(type === 'tv' ? 'search' : 'multi-search', parameters, signal)
}

export function fetchTvGenres(signal) {
  return requestTv('genres', {}, 'genres', item => isMediaId(item?.id) && typeof item.name === 'string', signal)
}

export function fetchTvVideos(id, signal) {
  return requestTv('videos', { id }, null, isTrailerEnvelope, signal)
}

const cache = new Map()
const CACHE_LIMIT = 8
const CACHE_TTL = 3 * 60 * 1000

export async function fetchTvResource(operation, parameters, signal) {
  const key = JSON.stringify([operation, parameters])
  signal?.throwIfAborted()
  const entry = cache.get(key)
  if (entry && entry.expires > Date.now()) return entry.data
  if (entry) cache.delete(key)

  const data = await requestTv(operation, parameters, null,
    item => isMediaId(item?.id) && typeof item.name === 'string', signal)
  if (operation !== 'episode') {
    if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value)
    cache.set(key, { data, expires: Date.now() + CACHE_TTL })
  }
  return data
}
