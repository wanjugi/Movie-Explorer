import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import {
  discoverMovies, fetchGenres, fetchMovieById, fetchPopularMovies, MovieApiError, searchMovies,
} from '../src/services/moviesApi.js'

const movie = { id: 550, title: 'Example movie', poster_path: null }

test('frontend keeps the array/object contracts and uses only the same-origin endpoint', async t => {
  const calls = []
  t.mock.method(globalThis, 'fetch', async path => {
    calls.push(path)
    return Response.json({
      results: [movie],
      genres: [{ id: 28, name: 'Action' }],
      ...movie,
      vote_average: 7,
      credits: { cast: [] },
    })
  })

  const query = "A & B + L’été"
  assert.deepEqual(await discoverMovies({ genre: 28, year: 1999 }), [movie])
  assert.deepEqual(await searchMovies(query), [movie])
  assert.deepEqual(await fetchGenres(), [{ id: 28, name: 'Action' }])
  assert.deepEqual(await fetchPopularMovies(), [movie])
  const details = await fetchMovieById('550')
  assert.equal(details.id, 550)
  assert.deepEqual(details.credits.cast, [])
  const urls = calls.map(call => {
    assert.ok(call.startsWith('/api/movies?'))
    return new URL(call, 'https://example.test')
  })
  assert.deepEqual(urls.map(url => Object.fromEntries(url.searchParams)), [
    { operation: 'discover', genre: '28', year: '1999' },
    { operation: 'search', query },
    { operation: 'genres' },
    { operation: 'popular' },
    { operation: 'details', id: '550' },
  ])
})

test('frontend keeps existing empty/null fallback contracts on failed requests', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('Unavailable', { status: 503 }))
  assert.deepEqual(await discoverMovies({ genre: '', year: '' }), [])
  assert.deepEqual(await searchMovies('Example'), [])
  assert.deepEqual(await fetchPopularMovies(), [])
  assert.deepEqual(await fetchGenres(), [])
  assert.equal(await fetchMovieById('550'), null)
})

test('error-aware API calls distinguish successful empty responses from malformed payloads', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json({ results: [] }))
  const options = { throwOnError: true }
  assert.deepEqual(await searchMovies('Absent', options), [])
  fetch.mock.mockImplementation(async () => Response.json({ results: [null] }))
  await assert.rejects(searchMovies('Example', options), { name: 'MovieApiError', kind: 'malformed' })
  fetch.mock.mockImplementation(async () => new Response('invalid JSON'))
  await assert.rejects(discoverMovies({}, options), { name: 'MovieApiError', kind: 'malformed' })
})

test('error-aware API classifies safe failures and respects Retry-After headers', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('private upstream detail') })
  const options = { throwOnError: true }
  await assert.rejects(fetchGenres(options), error =>
    error instanceof MovieApiError && error.kind === 'network' && !error.message.includes('private upstream detail'))
  for (const [status, kind, retryable] of [
    [400, 'invalid', false], [404, 'missing', false], [500, 'unavailable', true],
    [503, 'unavailable', true], [504, 'timeout', true], [429, 'rate-limit', true],
  ]) {
    fetch.mock.mockImplementation(async () => new Response('private upstream detail', {
      status, headers: { 'Retry-After': status === 429 ? '3' : 'invalid hint' },
    }))
    await assert.rejects(searchMovies('Example', options), error => {
      assert.equal(error.status, status)
      assert.equal(error.kind, kind)
      assert.equal(error.retryable, retryable)
      assert.equal(error.message.includes('private upstream detail'), false)
      assert.equal(status === 429 ? error.retryAt > Date.now() : error.retryAt === null, true)
      return true
    })
  }
})

test('the service passes AbortSignal and preserves cancellation in legacy and error-aware calls', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', (url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true })
  }))
  for (const throwOnError of [false, true]) {
    const controller = new AbortController()
    const pending = searchMovies('Example', { signal: controller.signal, throwOnError })
    assert.equal(fetch.mock.calls.at(-1).arguments[1].signal, controller.signal)
    controller.abort()
    await assert.rejects(pending, { name: 'AbortError' })
  }
})

test('versioned hosting rules target only known deep links and leave API/assets outside SPA fallback', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'))
  assert.deepEqual(config.rewrites, [
    { source: '/favorites', destination: '/index.html' },
    { source: '/movie/:id', destination: '/index.html' },
    { source: '/movies', destination: '/index.html' },
    { source: '/tv', destination: '/index.html' },
    { source: '/search', destination: '/index.html' },
    { source: '/tv/:id', destination: '/index.html' },
    { source: '/tv/:id/season/:seasonNumber', destination: '/index.html' },
    { source: '/tv/:id/season/:seasonNumber/episode/:episodeNumber', destination: '/index.html' },
    { source: '/person/:id', destination: '/index.html' },
    { source: '/collection/:id', destination: '/index.html' },
    { source: '/library', destination: '/index.html' },
    { source: '/calendar', destination: '/index.html' },
    { source: '/live-tv', destination: '/index.html' },
    { source: '/live-tv/:channelSlug', destination: '/index.html' },
    { source: '/live-tv/:channelSlug/about', destination: '/index.html' },
    { source: '/watch/movie/:id', destination: '/index.html' },
    { source: '/watch/tv/:id/season/:seasonNumber/episode/:episodeNumber', destination: '/index.html' },
  ])
  for (const { source } of config.rewrites) {
    const matcher = new RegExp('^' + source.replace(/:[A-Za-z]+/g, '[^/]+') + '/?$')
    for (const path of ['/api/movies', '/api/tv', '/api/unknown', '/assets/example.js', '/assets/example.css', '/favicon.ico']) {
      assert.equal(matcher.test(path), false)
    }
  }
})
