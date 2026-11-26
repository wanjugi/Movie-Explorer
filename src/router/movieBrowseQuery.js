import { DISCOVER_FIELDS, MOVIE_FEEDS, hasInvertedRange } from '../catalogue/movieFilters.js'
import { parseMoviePage } from '../catalogue/moviePages.js'

export const SEARCH_LIMIT = 160
export const isMovieBrowseRoute = name => name === 'home' || name === 'movies'

export function normalizeMovieSearch(value) {
  if (typeof value !== 'string') return null
  const query = value.trim()
  if (!query) return ''
  if ([...query].length > SEARCH_LIMIT || /[\p{Cc}]/u.test(value)) return null
  return query
}

export function normalizeGenre(value) {
  return DISCOVER_FIELDS.genre[0](value) ? value : ''
}

export function normalizeYear(value) {
  return DISCOVER_FIELDS.year[0](value) ? value : ''
}

export function readMovieBrowseQuery(query = {}) {
  const state = {
    q: normalizeMovieSearch(query.q) ?? '',
    genre: normalizeGenre(query.genre),
    year: normalizeYear(query.year),
  }
  for (const [key, [valid]] of Object.entries(DISCOVER_FIELDS)) {
    if (key !== 'genre' && key !== 'year' && valid(query[key])) state[key] = query[key]
  }
  if (state.sort === 'popular') delete state.sort
  if (state.rating) state.rating = String(Number(state.rating))
  if (state.year || hasInvertedRange(state.from, state.to)) {
    delete state.from
    delete state.to
  }
  if (hasInvertedRange(state.runtimeMin, state.runtimeMax)) {
    delete state.runtimeMin
    delete state.runtimeMax
  }
  if (typeof query.category === 'string' && Object.hasOwn(MOVIE_FEEDS, query.category)
      && query.category !== 'discover') state.category = query.category
  if (state.category === 'trending' && query.period === 'day') state.period = 'day'
  const page = parseMoviePage(query.page)
  if (page > 1 && (state.q || state.category !== 'trending')) state.page = String(page)
  return state
}

export function movieBrowseRequest(state) {
  const page = state.page ? { page: state.page } : {}
  if (state.q) return { operation: 'search', parameters: { query: state.q, ...page } }
  const operation = state.category ?? 'discover'
  if (operation === 'trending') return { operation, parameters: state.period ? { period: state.period } : {} }
  if (operation !== 'discover') return { operation, parameters: page }
  const filters = Object.keys(DISCOVER_FIELDS).filter(key => state[key]).map(key => [key, state[key]])
  return { operation, parameters: { ...Object.fromEntries(filters), ...page } }
}

export function movieBrowseCriteria(state) {
  return JSON.stringify(movieBrowseRequest({ ...state, page: undefined }))
}

export function movieBrowseLocation(state, name = 'home') {
  const query = Object.fromEntries(Object.entries(readMovieBrowseQuery(state)).filter(([, value]) => value))
  return { name, query }
}

export function navigateMovieBrowse(router, values, replace = false) {
  const next = readMovieBrowseQuery(values)
  const current = router.currentRoute.value
  const active = readMovieBrowseQuery(current.query)
  if (isMovieBrowseRoute(current.name)) {
    if (movieBrowseCriteria(next) !== movieBrowseCriteria(active)) delete next.page
    if (JSON.stringify(next) === JSON.stringify(active)) return
  }

  const location = movieBrowseLocation(next, current.name === 'movies' ? 'movies' : 'home')
  return replace ? router.replace(location) : router.push(location)
}
