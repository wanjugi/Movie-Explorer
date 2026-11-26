import { parseMoviePage } from '../src/catalogue/moviePages.js'

const BASE_URL = 'https://api.themoviedb.org/3'
export const isId = value => Number.isInteger(value) && value > 0 && value <= 2_147_483_647
export const isIdParameter = value => typeof value === 'string' && /^[1-9]\d{0,9}$/.test(value) && isId(Number(value))

function json(body, status = 200, headers = {}) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  })
}

function error(status, code, message, headers) {
  return json(JSON.stringify({ error: { code, message } }), status, headers)
}

function retryAfter(headers) {
  const value = headers.get('retry-after')
  if (value === null) return {}
  if (/^\d{1,9}$/.test(value)) return { 'Retry-After': value }

  // Forward only canonical HTTP dates, never arbitrary upstream header text.
  const date = new Date(value)
  if (!Number.isNaN(date.getTime()) && date.toUTCString() === value) return { 'Retry-After': value }
  return {}
}

function upstreamError(response, operation, label) {
  if (response.status === 429) {
    return error(429, 'RATE_LIMITED', label + ' data is temporarily rate limited.', retryAfter(response.headers))
  }
  if (response.status === 503) {
    return error(503, 'UPSTREAM_UNAVAILABLE', label + ' data is temporarily unavailable.', retryAfter(response.headers))
  }
  if (response.status === 401 || response.status === 403) {
    return error(502, 'UPSTREAM_AUTH', label + ' data is temporarily unavailable.')
  }
  if (response.status === 404 && operation.notFound) {
    return error(404, ...operation.notFound)
  }
  return error(502, 'UPSTREAM_FAILURE', label + ' data is temporarily unavailable.')
}

export function createTmdbHandler(operations, { label = 'Movie', transform = data => data } = {}) {
  const invalidParameters = () => error(400, 'INVALID_PARAMETERS', 'Invalid ' + label.toLowerCase() + ' API parameters.')
  const invalidPayload = () => error(502, 'UPSTREAM_PAYLOAD', label + ' data could not be read.')

  return async function handleRequest(
    { method, url },
    { apiKey = process.env.TMDB_API_KEY, fetchUpstream = globalThis.fetch, timeoutMs = 8000 } = {},
  ) {
    try {
      if (method !== 'GET') {
        return error(405, 'METHOD_NOT_ALLOWED', 'Only GET is supported.', { Allow: 'GET' })
      }
      if (typeof url !== 'string' || url.length > 4096) return invalidParameters()

      let requestUrl
      try {
        requestUrl = new URL(url, 'http://localhost')
        decodeURIComponent(requestUrl.search)
      } catch {
        return invalidParameters()
      }

      const params = requestUrl.searchParams
      const name = params.get('operation')
      const seen = new Set()
      for (const key of params.keys()) {
        if (seen.has(key)) return invalidParameters()
        seen.add(key)
      }
      if (!name) return invalidParameters()

      const operation = operations.get(name)
      if (!operation) return error(404, 'UNKNOWN_OPERATION', 'Unknown ' + label.toLowerCase() + ' API operation.')
      for (const key of seen) {
        if (key !== 'operation' && !operation.parameters.includes(key)) return invalidParameters()
      }

      const page = params.get('page') ?? '1'
      if (parseMoviePage(page) === null) return invalidParameters()
      const target = operation.upstream(params, page)
      if (!target) return invalidParameters()

      const key = apiKey?.trim()
      if (!key) return error(503, 'API_UNAVAILABLE', label + ' data is temporarily unavailable.')

      const [upstreamPath, upstreamParams] = target
      const upstreamUrl = new URL(BASE_URL + upstreamPath)
      upstreamUrl.search = new URLSearchParams({ ...upstreamParams, api_key: key }).toString()

      const signal = AbortSignal.timeout(timeoutMs)
      let response
      try {
        response = await fetchUpstream(upstreamUrl, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          redirect: 'error',
          signal,
        })
      } catch {
        if (signal.aborted) return error(504, 'UPSTREAM_TIMEOUT', 'The ' + label.toLowerCase() + ' data request timed out.')
        return error(502, 'UPSTREAM_NETWORK', label + ' data could not be reached.')
      }
      if (!response.ok) return upstreamError(response, operation, label)

      let data
      try {
        data = await response.json()
      } catch {
        if (signal.aborted) return error(504, 'UPSTREAM_TIMEOUT', 'The ' + label.toLowerCase() + ' data request timed out.')
        return invalidPayload()
      }
      if (!operation.validate(data, params)) return invalidPayload()

      const body = JSON.stringify(operation.project ? operation.project(data) : transform(data, operation))
      // The API preserves upstream objects for existing consumers. Reject reflected credentials.
      if (body.includes(key)) return invalidPayload()
      return json(body)
    } catch {
      return error(500, 'INTERNAL_ERROR', label + ' data is temporarily unavailable.')
    }
  }
}
