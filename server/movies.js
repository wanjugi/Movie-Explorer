const BASE_URL = 'https://api.themoviedb.org/3'
const MAX_ID = 2_147_483_647
const FIRST_PAGE = { language: 'en-US', page: '1' }

const isId = value => Number.isInteger(value) && value > 0 && value <= MAX_ID
const isIdParameter = value => /^[1-9]\d{0,9}$/.test(value) && isId(Number(value))
const hasName = item => isId(item?.id) && typeof item.name === 'string'
const isMovie = item => isId(item?.id) && typeof item.title === 'string'
  && (item.poster_path === null || typeof item.poster_path === 'string')

const isMovieList = data => Array.isArray(data?.results) && data.results.every(isMovie)

const operations = new Map([
  ['discover', {
    parameters: ['genre', 'year'],
    upstream(params) {
      const genre = params.get('genre')
      const year = params.get('year')
      if ((genre !== null && !isIdParameter(genre)) || (year !== null && !/^[1-9]\d{3}$/.test(year))) return null

      const query = { ...FIRST_PAGE, sort_by: 'popularity.desc', include_adult: 'false' }
      if (genre !== null) query.with_genres = genre
      if (year !== null) query.primary_release_year = year
      return ['/discover/movie', query]
    },
    validate: isMovieList,
  }],
  ['search', {
    parameters: ['query'],
    upstream(params) {
      const rawQuery = params.get('query')
      const query = rawQuery?.trim()
      if (!query || [...query].length > 160 || /[\p{Cc}]/u.test(rawQuery)) return null
      return ['/search/movie', { ...FIRST_PAGE, query, include_adult: 'false' }]
    },
    validate: isMovieList,
  }],
  ['genres', {
    parameters: [],
    upstream: () => ['/genre/movie/list', { language: 'en' }],
    validate: data => Array.isArray(data?.genres) && data.genres.every(hasName),
  }],
  ['popular', {
    parameters: [],
    upstream: () => ['/movie/popular', FIRST_PAGE],
    validate: isMovieList,
  }],
  ['details', {
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

function upstreamError(response, operation) {
  if (response.status === 429) {
    return error(429, 'RATE_LIMITED', 'Movie data is temporarily rate limited.', retryAfter(response.headers))
  }
  if (response.status === 503) {
    return error(503, 'UPSTREAM_UNAVAILABLE', 'Movie data is temporarily unavailable.', retryAfter(response.headers))
  }
  if (response.status === 401 || response.status === 403) {
    return error(502, 'UPSTREAM_AUTH', 'Movie data is temporarily unavailable.')
  }
  if (response.status === 404 && operation === 'details') {
    return error(404, 'MOVIE_NOT_FOUND', 'Movie not found.')
  }
  return error(502, 'UPSTREAM_FAILURE', 'Movie data is temporarily unavailable.')
}

const invalidParameters = () => error(400, 'INVALID_PARAMETERS', 'Invalid movie API parameters.')
const invalidPayload = () => error(502, 'UPSTREAM_PAYLOAD', 'Movie data could not be read.')

export async function handleMovieRequest(
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
    if (!operation) return error(404, 'UNKNOWN_OPERATION', 'Unknown movie API operation.')
    for (const key of seen) {
      if (key !== 'operation' && !operation.parameters.includes(key)) return invalidParameters()
    }

    const target = operation.upstream(params)
    if (!target) return invalidParameters()

    const key = apiKey?.trim()
    if (!key) return error(503, 'API_UNAVAILABLE', 'Movie data is temporarily unavailable.')

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
      if (signal.aborted) return error(504, 'UPSTREAM_TIMEOUT', 'The movie data request timed out.')
      return error(502, 'UPSTREAM_NETWORK', 'Movie data could not be reached.')
    }
    if (!response.ok) return upstreamError(response, name)

    let data
    try {
      data = await response.json()
    } catch {
      if (signal.aborted) return error(504, 'UPSTREAM_TIMEOUT', 'The movie data request timed out.')
      return invalidPayload()
    }
    if (!operation.validate(data, params)) return invalidPayload()

    const body = JSON.stringify(data)
    // The API preserves upstream objects for existing consumers. Reject reflected credentials.
    if (body.includes(key)) return invalidPayload()
    return json(body)
  } catch {
    return error(500, 'INTERNAL_ERROR', 'Movie data is temporarily unavailable.')
  }
}
