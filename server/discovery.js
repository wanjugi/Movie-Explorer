import { isId, isIdParameter } from './tmdb.js'
import { isMoviePageEnvelope } from '../src/catalogue/moviePages.js'
import { normalizeMovieSearch } from '../src/router/movieBrowseQuery.js'

const language = 'en-US'
const missing = ['NOT_FOUND', 'This resource could not be found.']
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value

function resource(build, validate, extra = [], project) {
  return {
    parameters: ['id', ...extra],
    notFound: missing,
    upstream(params, page) {
      const id = params.get('id')
      return isIdParameter(id) ? build(id, params, page) : null
    },
    validate,
    project: project ?? (data => data),
  }
}

const matchId = (data, params) => data?.id === Number(params.get('id'))

export const peopleOperations = [
  ['person-search', {
    parameters: ['query', 'page'],
    upstream(params, page) {
      const query = normalizeMovieSearch(params.get('query'))
      return query ? ['/search/person', { query, page, language, include_adult: 'false' }] : null
    },
    validate: isMoviePageEnvelope,
    project: data => ({ ...data, results: data.results.filter(item => item?.adult === false && isId(item.id) && typeof item.name === 'string') }),
  }],
  ['person', resource(id => ['/person/' + id, { language, append_to_response: 'combined_credits,images' }],
    (data, params) => matchId(data, params) && typeof data.name === 'string' && data.adult !== true,
    [], data => ({
      ...data,
      combined_credits: Object.fromEntries(['cast', 'crew'].map(kind => [
        kind, (Array.isArray(data.combined_credits?.[kind]) ? data.combined_credits[kind] : [])
          .filter(item => isId(item?.id) && item.adult !== true && ['movie', 'tv'].includes(item.media_type)),
      ])),
    }))],
  ['collection', resource(id => ['/collection/' + id, { language }],
    (data, params) => matchId(data, params) && typeof data.name === 'string' && Array.isArray(data.parts),
    [], data => ({ ...data, parts: data.parts.filter(item => item?.adult !== true && isId(item?.id) && typeof item.title === 'string') }))],
]

export function connectedOperations(type) {
  const name = type === 'movie' ? 'title' : 'name'
  const sanitize = data => ({ ...data, results: data.results
    .filter(item => item?.adult !== true && isId(item?.id) && typeof item[name] === 'string')
    .map(item => ({ ...item, media_type: type })) })
  return [
    ...['recommendations', 'similar'].map(operation => [operation, resource(
      (id, _, page) => ['/' + type + '/' + id + '/' + operation, { language, page }],
      isMoviePageEnvelope, ['page'], sanitize,
    )]),
    ['providers', resource(id => ['/' + type + '/' + id + '/watch/providers', {}],
      (data, params) => matchId(data, params) && data.results && typeof data.results === 'object' && !Array.isArray(data.results))],
    ['calendar', {
      parameters: ['from', 'to', 'page'],
      upstream(params, page) {
        const from = params.get('from')
        const to = params.get('to')
        if (!validDate(from) || !validDate(to) || from > to || Date.parse(to) - Date.parse(from) > 62 * 86400000) return null
        const date = type === 'movie' ? 'primary_release_date' : 'first_air_date'
        return ['/discover/' + type, {
          language, page, include_adult: 'false', sort_by: date + '.asc',
          [date + '.gte']: from, [date + '.lte']: to,
        }]
      },
      validate: isMoviePageEnvelope,
      project: sanitize,
    }],
  ]
}
