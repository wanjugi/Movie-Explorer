import { isTrailerEnvelope } from '../catalogue/trailerSelection.js'

const isId = value => Number.isInteger(value) && value > 0 && value <= 2_147_483_647
const hasName = item => isId(item?.id) && typeof item.name === 'string'
const isMovie = item => isId(item?.id) && typeof item.title === 'string'
  && (item.poster_path === null || typeof item.poster_path === 'string')
const isDetails = item => isMovie(item) && Number.isFinite(item.vote_average)
  && Array.isArray(item.credits?.cast) && item.credits.cast.every(hasName)

const messages = {
  network: 'Could not connect. Check your connection and try again.',
  unavailable: 'Title data is temporarily unavailable. Please try again.',
  timeout: 'The request timed out. Please try again.',
  'rate-limit': 'Too many requests. Please wait before trying again.',
  invalid: 'The request was not accepted. Change your search or filters and try again.',
  missing: 'This title could not be found.',
  malformed: 'The service returned an unreadable response. Please try again.',
}

export class MovieApiError extends Error {
  constructor(kind, status = null, retryAt = null) {
    super(messages[kind])
    this.name = 'MovieApiError'
    this.kind = kind
    this.status = status
    this.retryAt = retryAt
    this.retryable = kind !== 'invalid' && kind !== 'missing'
  }
}

function readRetryAfter(value) {
  if (!value) return null
  if (/^\d{1,9}$/.test(value)) return Date.now() + Number(value) * 1000
  const date = new Date(value)
  return Number.isFinite(date.getTime()) && date.toUTCString() === value ? date.getTime() : null
}

function errorForResponse(response) {
  const { status, headers } = response
  if (status === 429 || status === 503) {
    return new MovieApiError(status === 429 ? 'rate-limit' : 'unavailable', status,
      readRetryAfter(headers.get('retry-after')))
  }
  if (status === 504 || status === 408) return new MovieApiError('timeout', status)
  if (status === 404) return new MovieApiError('missing', status)
  return new MovieApiError(status >= 400 && status < 500 ? 'invalid' : 'unavailable', status)
}

export async function requestMedia(endpoint, operation, parameters, field, validate, { signal, throwOnError = false } = {}) {
  const query = new URLSearchParams({ operation, ...parameters })
  query.set('operation', operation)
  const fallback = field ? [] : null

  try {
    signal?.throwIfAborted()
    let response
    try {
      response = await fetch(endpoint + query, { signal })
    } catch (error) {
      if (signal?.aborted || error?.name === 'AbortError') throw error
      throw new MovieApiError('network')
    }
    if (!response.ok) throw errorForResponse(response)

    let data
    try {
      data = await response.json()
    } catch (error) {
      if (signal?.aborted || error?.name === 'AbortError') throw error
      throw new MovieApiError('malformed', response.status)
    }
    signal?.throwIfAborted()
    const value = field ? data?.[field] : data
    const valid = field ? Array.isArray(value) && value.every(validate) : validate(value)
    if (!valid) throw new MovieApiError('malformed', response.status)
    return value
  } catch (error) {
    if (throwOnError || signal?.aborted || error?.name === 'AbortError') throw error
    return fallback
  }
}

const requestMovies = (...args) => requestMedia('/api/movies?', ...args)

export function fetchMovieVideos(id, signal) {
  return requestMovies('videos', { id }, null, isTrailerEnvelope, { signal, throwOnError: true })
}

export function fetchPopularMovies(options) {
  return requestMovies('popular', {}, 'results', isMovie, options)
}

export function fetchMovieById(movieId, options) {
  return requestMovies('details', { id: movieId }, null, isDetails, options)
}

export function searchMovies(query, options) {
  return requestMovies('search', { query }, 'results', isMovie, options)
}

export function discoverMovies(filters, options) {
  const parameters = {}
  if (filters.genre) parameters.genre = filters.genre
  if (filters.year) parameters.year = filters.year
  return requestMovies('discover', parameters, 'results', isMovie, options)
}

export function fetchGenres(options) {
  return requestMovies('genres', {}, 'genres', hasName, options)
}
import { MOVIE_FEEDS } from '../catalogue/movieFilters.js'
import { isMoviePageEnvelope } from '../catalogue/moviePages.js'


export async function fetchMoviePage(operation, parameters, { signal } = {}) {
  if (operation !== 'search' && !Object.hasOwn(MOVIE_FEEDS, operation)) throw new MovieApiError('invalid')
  return requestMovies(operation, parameters, null,
    page => isMoviePageEnvelope(page) && page.results.every(isMovie), { signal, throwOnError: true })
}
