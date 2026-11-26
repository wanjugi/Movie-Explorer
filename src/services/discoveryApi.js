import { requestMedia } from './moviesApi.js'
import { isMoviePageEnvelope } from '../catalogue/moviePages.js'

const object = data => data !== null && typeof data === 'object' && !Array.isArray(data)
const recommendations = new Map()
export function fetchDiscovery(type, operation, params, signal) {
  const validate = ['person-search', 'recommendations', 'similar', 'calendar'].includes(operation)
    ? isMoviePageEnvelope : operation === 'providers' ? data => object(data?.results)
      : data => data?.id === Number(params.id) && typeof data.name === 'string'
  return requestMedia(type === 'tv' ? '/api/tv?' : '/api/movies?', operation, params, null, validate, { signal, throwOnError: true })
}

export async function fetchLibraryRecommendations(type, id, signal) {
  const key = type + ':' + id
  const cached = recommendations.get(key)
  signal.throwIfAborted()
  if (cached?.expires > Date.now()) return cached.data
  const data = await fetchDiscovery(type, 'recommendations', { id }, signal)
  signal.throwIfAborted()
  recommendations.delete(key)
  if (recommendations.size >= 24) recommendations.delete(recommendations.keys().next().value)
  recommendations.set(key, { data, expires: Date.now() + 120_000 })
  return data
}
