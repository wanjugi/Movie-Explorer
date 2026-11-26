import { normalizeMovieSearch } from '../src/router/movieBrowseQuery.js'
import { isMoviePageEnvelope } from '../src/catalogue/moviePages.js'
import { hasInvertedRange } from '../src/catalogue/movieFilters.js'
import { TV_FIELDS } from '../src/catalogue/tvFilters.js'
import { isMovieSummary, isTvSummary, readTvRouteParams } from '../src/catalogue/mediaIdentity.js'
import { createTmdbHandler, isId } from './tmdb.js'
import { videoOperation } from './videos.js'
import { connectedOperations } from './discovery.js'

const LANGUAGE = { language: 'en-US' }
const isTvList = data => isMoviePageEnvelope(data) && data.results.every(isTvSummary)

function officialList(path) {
  return {
    parameters: ['page'],
    upstream: (_, page) => [path, { ...LANGUAGE, page }],
    validate: isTvList,
  }
}

function search(path, validate) {
  return {
    parameters: ['query', 'page'],
    upstream(params, page) {
      const query = normalizeMovieSearch(params.get('query'))
      if (!query) return null
      return [path, { ...LANGUAGE, page, query, include_adult: 'false' }]
    },
    validate,
  }
}

function resource(kind) {
  const season = kind !== 'details'
  const episode = kind === 'episode'
  return {
    parameters: ['id', ...(season ? ['season'] : []), ...(episode ? ['episode'] : [])],
    notFound: ['TV_NOT_FOUND', 'The requested television resource was not found.'],
    upstream(params) {
      const parts = readTvRouteParams({
        id: params.get('id'), seasonNumber: params.get('season'), episodeNumber: params.get('episode'),
      })
      if (!parts.id || (season && parts.season === null) || (episode && parts.episode === null)) return null
      let path = '/tv/' + parts.id
      if (season) path += '/season/' + parts.season
      if (episode) path += '/episode/' + parts.episode
      return [path, season ? LANGUAGE : { ...LANGUAGE, append_to_response: 'credits' }]
    },
    validate(data, params) {
      if (!isId(data?.id) || typeof data.name !== 'string' || data.adult === true) return false
      if (!season) return data.id === Number(params.get('id'))
      if (data.season_number !== Number(params.get('season'))) return false
      return episode ? data.episode_number === Number(params.get('episode')) : Array.isArray(data.episodes)
    },
  }
}

const operations = new Map([
  ...connectedOperations('tv'),
  ['videos', videoOperation('tv')],
  ['discover', {
    parameters: ['page', ...Object.keys(TV_FIELDS)],
    upstream(params, page) {
      const { year, from, to } = Object.fromEntries(params)
      if ((year && (from || to)) || hasInvertedRange(from, to)) return null
      const query = { ...LANGUAGE, page, include_adult: 'false', sort_by: 'popularity.desc' }
      for (const [key, [valid, upstreamKey, serialize]] of Object.entries(TV_FIELDS)) {
        if (!params.has(key)) continue
        const value = params.get(key)
        if (!valid(value)) return null
        query[upstreamKey] = serialize ? serialize(value) : value
      }
      return ['/discover/tv', query]
    },
    validate: isTvList,
  }],
  ['search', search('/search/tv', isTvList)],
  ['multi-search', {
    ...search('/search/multi', isMoviePageEnvelope),
    mixed: true,
  }],
  ['popular', officialList('/tv/popular')],
  ['top-rated', officialList('/tv/top_rated')],
  ['airing-today', officialList('/tv/airing_today')],
  ['on-the-air', officialList('/tv/on_the_air')],
  ['trending', {
    parameters: ['period'],
    upstream(params) {
      const period = params.get('period') ?? 'week'
      if (period !== 'week' && period !== 'day') return null
      return [period === 'day' ? '/trending/tv/day' : '/trending/tv/week', LANGUAGE]
    },
    validate: isTvList,
    requireAdultFlag: true,
  }],
  ['genres', {
    parameters: [],
    upstream: () => ['/genre/tv/list', { language: 'en' }],
    validate: data => Array.isArray(data?.genres) && data.genres.every(item => isId(item?.id) && typeof item.name === 'string'),
  }],
  ['details', resource('details')],
  ['season', resource('season')],
  ['episode', resource('episode')],
])

export const handleTvRequest = createTmdbHandler(operations, {
  label: 'Television',
  transform(data, operation) {
    if (operation.mixed) {
      return {
        ...data,
        results: data.results.filter(item => item?.adult === false && (
          (item.media_type === 'movie' && isMovieSummary(item)) || (item.media_type === 'tv' && isTvSummary(item))
        )),
      }
    }
    if (operation.validate !== isTvList) return data
    return {
      ...data,
      results: data.results
        .filter(item => operation.requireAdultFlag ? item.adult === false : item.adult !== true)
        .map(item => ({ ...item, media_type: 'tv' })),
    }
  },
})
