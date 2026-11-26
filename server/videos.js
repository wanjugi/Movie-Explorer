import { isIdParameter } from './tmdb.js'
import { selectTrailerChoices, TRAILER_LOCALE } from '../src/catalogue/trailerSelection.js'

export function videoOperation(type) {
  return {
    parameters: ['id'],
    notFound: ['TITLE_NOT_FOUND', 'The title could not be found.'],
    upstream(params) {
      const id = params.get('id')
      return isIdParameter(id) ? ['/' + type + '/' + id + '/videos', { language: TRAILER_LOCALE }] : null
    },
    validate: (data, params) => data?.id === Number(params.get('id')) && Array.isArray(data.results),
    project: data => ({ results: selectTrailerChoices(data.results) }),
  }
}
