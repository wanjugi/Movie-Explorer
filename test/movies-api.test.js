import assert from 'node:assert/strict'
import { test } from 'node:test'
import route from '../api/movies.js'
import { handleMovieRequest } from '../server/movies.js'

const fixtureKey = ['mock', 'upstream', 'key'].join('-')
const movie = { id: 550, title: 'Example movie', release_date: '1999-10-15', poster_path: '/example.jpg' }
const page = { page: 1, results: [movie], total_pages: 20, total_results: 400 }
const details = { ...movie, vote_average: 7, credits: { cast: [{ id: 4, name: 'Example actor' }], crew: [] } }

async function request(query, options = {}) {
  const calls = []
  const response = await handleMovieRequest(
    { method: options.method ?? 'GET', url: '/api/movies?' + query },
    {
      apiKey: options.apiKey ?? fixtureKey,
      timeoutMs: options.timeoutMs ?? 1000,
      fetchUpstream(url, init) {
        calls.push({ url, init })
        return options.upstream ? options.upstream(url, init) : Response.json(page)
      },
    },
  )
  const body = await response.json()
  return { response, body, calls }
}

function assertError(result, status, code) {
  assert.equal(result.response.status, status)
  assert.equal(result.response.headers.get('cache-control'), 'no-store')
  assert.equal(result.body.error.code, code)
  assert.equal(JSON.stringify(result.body).includes(fixtureKey), false)
}

test('discovery keeps the existing ranking and returns the paged envelope', async () => {
  const { response, body, calls } = await request('operation=discover')
  assert.equal(response.status, 200)
  assert.deepEqual(body, page)
  assert.equal(calls.length, 1)
  const [{ url, init }] = calls
  assert.equal(url.origin, 'https://api.themoviedb.org')
  assert.equal(url.pathname, '/3/discover/movie')
  assert.deepEqual(Object.fromEntries(url.searchParams), {
    language: 'en-US', page: '1', sort_by: 'popularity.desc', include_adult: 'false', api_key: fixtureKey,
  })
  assert.equal(init.method, 'GET')
  assert.equal(init.redirect, 'error')
  assert.deepEqual(init.headers, { Accept: 'application/json' })
})

test('discovery forwards genre and primary release year independently or together', async () => {
  for (const params of ['&genre=28', '&year=1999', '&genre=28&year=1999']) {
    const { calls } = await request('operation=discover' + params)
    const query = calls[0].url.searchParams
    assert.equal(query.get('with_genres'), params.includes('genre') ? '28' : null)
    assert.equal(query.get('primary_release_year'), params.includes('year') ? '1999' : null)
  }
})

test('search safely forwards Unicode, apostrophes, plus signs and URL delimiters', async () => {
  const title = "L’été + 雨 & query=wrong # 'Moon?'"
  const { response, calls } = await request(new URLSearchParams({ operation: 'search', query: title }))
  assert.equal(response.status, 200)
  const { url } = calls[0]
  assert.equal(url.pathname, '/3/search/movie')
  assert.equal(url.searchParams.get('query'), title)
  assert.equal(url.searchParams.get('include_adult'), 'false')
  assert.equal(url.searchParams.get('page'), '1')
  assert.equal(url.hash, '')
  assert.equal(url.searchParams.getAll('query').length, 1)
  assert.match(url.search, /%2B/)
  assert.match(url.search, /%26/)
})

test('genres keep the current language and array envelope', async () => {
  const genres = [{ id: 28, name: 'Action' }]
  const { response, body, calls } = await request('operation=genres', { upstream: () => Response.json({ genres }) })
  assert.equal(response.status, 200)
  assert.deepEqual(body, { genres })
  assert.equal(calls[0].url.pathname, '/3/genre/movie/list')
  assert.equal(calls[0].url.searchParams.get('language'), 'en')
})

test('the retained unused Popular operation keeps page one', async () => {
  const { response, calls } = await request('operation=popular')
  assert.equal(response.status, 200)
  assert.equal(calls[0].url.pathname, '/3/movie/popular')
  assert.equal(calls[0].url.searchParams.get('page'), '1')
})

test('valid movie details preserve credits and pin the single allowed append', async () => {
  const { response, body, calls } = await request('operation=details&id=550', {
    upstream: () => Response.json(details),
  })
  assert.equal(response.status, 200)
  assert.deepEqual(body, details)
  assert.equal(calls[0].url.pathname, '/3/movie/550')
  assert.equal(calls[0].url.searchParams.get('append_to_response'), 'credits')
})

test('invalid, overflow and path-like movie IDs never reach the upstream', async () => {
  for (const id of ['', '0', '-1', '1.5', '1e2', '2147483648', '001', '1%2Fcredits', 'abc']) {
    const result = await request('operation=details&id=' + id)
    assertError(result, 400, 'INVALID_PARAMETERS')
    assert.equal(result.calls.length, 0)
  }
})

test('invalid genre IDs and incomplete or invalid years are rejected', async () => {
  for (const params of ['genre=0', 'genre=28%2C12', 'genre=2147483648', 'year=20', 'year=2024.5', 'year=0000', 'year=10000']) {
    const result = await request('operation=discover&' + params)
    assertError(result, 400, 'INVALID_PARAMETERS')
    assert.equal(result.calls.length, 0)
  }
})

test('missing, blank, oversized, malformed and control character searches are rejected', async () => {
  for (const suffix of ['', '&query=+++', '&query=' + 'x'.repeat(161), '&query=%00a',
    '&query=%ZZ', '&query=%C0%AF', '&query=' + 'x'.repeat(4100)]) {
    const result = await request('operation=search' + suffix)
    assertError(result, 400, 'INVALID_PARAMETERS')
    assert.equal(result.calls.length, 0)
  }
})

test('unexpected and duplicated parameters are rejected before calling TMDB', async () => {
  for (const query of [
    'operation=discover&page=2', 'operation=discover&include_adult=true',
    'operation=discover&operation=search', 'operation=discover&genre=28&%67enre=12',
    'operation=search&query=one&query=two', 'operation=genres&language=fr',
    'operation=details&id=550&append_to_response=reviews',
  ]) {
    const result = await request(query)
    assertError(result, 400, 'INVALID_PARAMETERS')
    assert.equal(result.calls.length, 0)
  }
})

test('unsupported operations are not dispatched, including object property names', async () => {
  for (const name of ['trending', 'constructor', '__proto__', '%2Fmovie%2F550']) {
    const result = await request('operation=' + name)
    assertError(result, 404, 'UNKNOWN_OPERATION')
    assert.equal(result.calls.length, 0)
  }
  assertError(await request('query=example'), 400, 'INVALID_PARAMETERS')
})

test('only GET is accepted by both the shared handler and Vercel entry point', async () => {
  const result = await request('operation=discover', { method: 'POST' })
  assertError(result, 405, 'METHOD_NOT_ALLOWED')
  assert.equal(result.response.headers.get('allow'), 'GET')
  assert.equal(result.calls.length, 0)
  const response = await route.fetch(new Request('https://example.test/api/movies?operation=genres', { method: 'HEAD' }))
  assert.equal(response.status, 405)
})

test('callers cannot change the upstream destination, headers or authorization', async () => {
  for (const parameter of ['url', 'host', 'headers', 'api_key', 'method', 'target', 'path']) {
    const result = await request('operation=discover&' + parameter + '=https%3A%2F%2Fexample.test')
    assertError(result, 400, 'INVALID_PARAMETERS')
    assert.equal(result.calls.length, 0)
  }
})

test('a missing server key fails closed without dialing the upstream', async () => {
  const result = await request('operation=genres', { apiKey: '' })
  assertError(result, 503, 'API_UNAVAILABLE')
  assert.equal(result.calls.length, 0)
})

test('upstream authentication errors never forward the body or private headers', async () => {
  for (const status of [401, 403]) {
    const result = await request('operation=discover', {
      upstream: () => new Response(fixtureKey, { status, headers: { 'X-Private': fixtureKey } }),
    })
    assertError(result, 502, 'UPSTREAM_AUTH')
    assert.equal(result.response.headers.has('x-private'), false)
  }
})

test('upstream rate limits are returned once with safe Retry-After information', async () => {
  for (const value of ['30', 'Thu, 26 Nov 2026 12:00:00 GMT', fixtureKey]) {
    const result = await request('operation=discover', {
      upstream: () => new Response(fixtureKey, { status: 429, headers: { 'Retry-After': value } }),
    })
    assertError(result, 429, 'RATE_LIMITED')
    assert.equal(result.calls.length, 1)
    assert.equal(result.response.headers.get('retry-after'), value === fixtureKey ? null : value)
  }
})

test('missing movies and other upstream statuses are mapped to safe errors', async () => {
  const upstreamStatus = status => () => new Response(fixtureKey, { status })
  assertError(await request('operation=details&id=550', { upstream: upstreamStatus(404) }), 404, 'MOVIE_NOT_FOUND')
  assertError(await request('operation=discover', { upstream: upstreamStatus(404) }), 502, 'UPSTREAM_FAILURE')
  assertError(await request('operation=discover', { upstream: upstreamStatus(500) }), 502, 'UPSTREAM_FAILURE')
  assertError(await request('operation=discover', { upstream: upstreamStatus(503) }), 503, 'UPSTREAM_UNAVAILABLE')
})

test('upstream network errors do not leak the thrown error', async () => {
  const result = await request('operation=discover', { upstream() { throw new Error(fixtureKey) } })
  assertError(result, 502, 'UPSTREAM_NETWORK')
  assert.equal(result.calls.length, 1)
})

test('the upstream timeout covers both the initial fetch and reading the body', async () => {
  function waitForAbort(signal) {
    return new Promise((resolve, reject) => {
      // Keep the event loop alive for AbortSignal.timeout's unref'ed timer.
      const timer = setTimeout(resolve, 500)
      signal.addEventListener('abort', () => {
        clearTimeout(timer)
        reject(signal.reason)
      }, { once: true })
    })
  }
  for (const upstream of [
    (url, { signal }) => waitForAbort(signal),
    (url, { signal }) => ({ ok: true, json: () => waitForAbort(signal) }),
  ]) {
    const result = await request('operation=discover', { upstream, timeoutMs: 10 })
    assertError(result, 504, 'UPSTREAM_TIMEOUT')
    assert.equal(result.calls.length, 1)
  }
})

test('malformed response JSON and unexpected list, genre and detail shapes are rejected', async () => {
  for (const [query, payload] of [
    ['operation=discover', null],
    ['operation=search&query=Example', { results: [null] }],
    ['operation=genres', { genres: [{ id: 28 }] }],
    ['operation=details&id=550', { ...details, credits: {} }],
    ['operation=details&id=550', { ...details, id: 551 }],
  ]) {
    assertError(await request(query, { upstream: () => Response.json(payload) }), 502, 'UPSTREAM_PAYLOAD')
  }
  assertError(await request('operation=discover', { upstream: () => new Response('unparseable') }), 502, 'UPSTREAM_PAYLOAD')
})

test('an unexpected server error returns no internal information', async () => {
  const result = await request('operation=discover', { upstream: () => undefined })
  assertError(result, 500, 'INTERNAL_ERROR')
})

test('potential credential echoes in a successful payload are rejected', async () => {
  const result = await request('operation=discover', {
    upstream: () => Response.json({ ...page, unexpected: { value: fixtureKey } }),
  })
  assertError(result, 502, 'UPSTREAM_PAYLOAD')
})

test('successful responses disable storage for each operation and error responses do too', async () => {
  for (const [query, payload] of [
    ['operation=discover', page], ['operation=discover&year=1999', page],
    ['operation=popular', page], ['operation=genres', { genres: [] }],
    ['operation=details&id=550', details], ['operation=search&query=Example', { ...page, results: [] }],
  ]) {
    const { response } = await request(query, { upstream: () => Response.json(payload) })
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
  }
  assertError(await request('operation=discover&page=20'), 400, 'INVALID_PARAMETERS')
})
