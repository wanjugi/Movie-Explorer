import { DISCOVER_FIELDS, hasInvertedRange } from '../src/catalogue/movieFilters.js'
import { createTmdbHandler, isId, isIdParameter } from './tmdb.js'
import { isMoviePageEnvelope } from '../src/catalogue/moviePages.js'
import { videoOperation } from './videos.js'

const LANGUAGE = { language: 'en-US' }

const hasName = item => isId(item?.id) && typeof item.name === 'string'
const isMovie = item => isId(item?.id) && typeof item.title === 'string'
  && (item.poster_path === null || typeof item.poster_path === 'string')

const isMovieList = data => isMoviePageEnvelope(data) && data.results.every(isMovie)

function officialList(path) {
  return {
    parameters: ['page'],
    upstream: (params, page) => [path, { ...LANGUAGE, page }],
    validate: isMovieList,
    requireAdultFlag: true,
  }
}

const operations = new Map([
  ['videos', videoOperation('movie')],
  ['discover', {
    parameters: ['page', ...Object.keys(DISCOVER_FIELDS)],
    upstream(params, page) {
      const { year, from, to, runtimeMin, runtimeMax } = Object.fromEntries(params)
      if ((year && (from || to)) || hasInvertedRange(from, to) || hasInvertedRange(runtimeMin, runtimeMax)) return null

      const query = { ...LANGUAGE, page, sort_by: 'popularity.desc', include_adult: 'false' }
      for (const [key, [valid, upstreamKey, serialize]] of Object.entries(DISCOVER_FIELDS)) {
        if (!params.has(key)) continue
        const value = params.get(key)
        if (!valid(value)) return null
        query[upstreamKey] = serialize ? serialize(value) : value
      }
      return ['/discover/movie', query]
    },
    validate: isMovieList,
  }],
  ['search', {
    parameters: ['query', 'page'],
    upstream(params, page) {
      const rawQuery = params.get('query')
      const query = rawQuery?.trim()
      if (!query || [...query].length > 160 || /[\p{Cc}]/u.test(rawQuery)) return null
      return ['/search/movie', { ...LANGUAGE, page, query, include_adult: 'false' }]
    },
    validate: isMovieList,
  }],
  ['genres', {
    parameters: [],
    upstream: () => ['/genre/movie/list', { language: 'en' }],
    validate: data => Array.isArray(data?.genres) && data.genres.every(hasName),
  }],
  ['popular', officialList('/movie/popular')],
  ['top-rated', officialList('/movie/top_rated')],
  ['now-playing', officialList('/movie/now_playing')],
  ['upcoming', officialList('/movie/upcoming')],
  ['trending', {
    parameters: ['period'],
    upstream(params) {
      const period = params.get('period') ?? 'week'
      if (period !== 'week' && period !== 'day') return null
      return [period === 'day' ? '/trending/movie/day' : '/trending/movie/week', LANGUAGE]
    },
    validate: isMovieList,
    requireAdultFlag: true,
  }],
  ['details', {
    notFound: ['MOVIE_NOT_FOUND', 'Movie not found.'],
    parameters: ['id'],
    upstream(params) {
      const id = params.get('id')
      if (!isIdParameter(id)) return null
      return [`/movie/${id}`, { language: 'en-US', append_to_response: 'credits' }]
    },
    validate: (data, params) => isMovie(data) && data.id === Number(params.get('id'))
      && Number.isFinite(data.vote_average)
      && Array.isArray(data.credits?.cast) && data.credits.cast.every(hasName),
  }],
])

export const handleMovieRequest = createTmdbHandler(operations, {
  transform(data, operation) {
    if (operation.validate !== isMovieList) return data
    return {
      ...data,
      results: data.results.filter(movie =>
        operation.requireAdultFlag ? movie.adult === false : movie.adult !== true),
    }
  },
})
