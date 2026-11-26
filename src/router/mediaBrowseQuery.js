import { TV_FEEDS, TV_FIELDS } from '../catalogue/tvFilters.js'
import { hasInvertedRange } from '../catalogue/movieFilters.js'
import { parseMoviePage } from '../catalogue/moviePages.js'
import { normalizeMovieSearch } from './movieBrowseQuery.js'

export function readTvBrowseQuery(query = {}) {
  const state = {}
  for (const [key, [valid]] of Object.entries(TV_FIELDS)) {
    if (valid(query[key])) state[key] = query[key]
  }
  if (state.rating) state.rating = String(Number(state.rating))
  if (state.sort === 'popular') delete state.sort
  if (state.year || hasInvertedRange(state.from, state.to)) {
    delete state.from
    delete state.to
  }
  if (typeof query.category === 'string' && Object.hasOwn(TV_FEEDS, query.category) && query.category !== 'discover') {
    state.category = query.category
  }
  if (state.category === 'trending' && query.period === 'day') state.period = 'day'
  if (state.category !== 'trending' && parseMoviePage(query.page) > 1) state.page = query.page
  return state
}

export function tvBrowseRequest(state) {
  const operation = state.category ?? 'discover'
  if (operation === 'trending') return [operation, state.period ? { period: state.period } : {}]
  const filters = operation === 'discover'
    ? Object.fromEntries(Object.keys(TV_FIELDS).filter(key => state[key]).map(key => [key, state[key]])) : {}
  return [operation, state.page ? { ...filters, page: state.page } : filters]
}

export const tvLocation = state => ({ name: 'tv', query: readTvBrowseQuery(state) })

export function readGlobalSearchQuery(query = {}) {
  const q = normalizeMovieSearch(query.q)
  const state = {}
  if (q) state.q = q
  if (['movie', 'tv', 'people'].includes(query.type)) state.type = query.type
  if (q && parseMoviePage(query.page) > 1) state.page = query.page
  return state
}

export const searchLocation = state => ({ name: 'search', query: readGlobalSearchQuery(state) })
