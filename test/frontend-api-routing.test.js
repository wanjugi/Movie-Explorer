import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import {
  discoverMovies, fetchGenres, fetchMovieById, fetchPopularMovies, searchMovies,
} from '../src/services/moviesApi.js'

test('frontend keeps the array/object contracts and uses only the same-origin endpoint', async t => {
  const calls = []
  t.mock.method(globalThis, 'fetch', async path => {
    calls.push(path)
    return Response.json({ results: [1], genres: [2], id: 550, credits: { cast: [] } })
  })

  const query = "A & B + L’été"
  assert.deepEqual(await discoverMovies({ genre: 28, year: 1999 }), [1])
  assert.deepEqual(await searchMovies(query), [1])
  assert.deepEqual(await fetchGenres(), [2])
  assert.deepEqual(await fetchPopularMovies(), [1])
  assert.equal((await fetchMovieById('550')).id, 550)
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

test('versioned hosting rules target only known deep links and leave API/assets outside SPA fallback', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'))
  assert.deepEqual(config.rewrites, [
    { source: '/favorites', destination: '/index.html' },
    { source: '/movie/:id', destination: '/index.html' },
  ])
  for (const { source } of config.rewrites) {
    const matcher = new RegExp('^' + source.replace(':id', '[^/]+') + '/?$')
    for (const path of ['/api/movies', '/api/unknown', '/assets/example.js', '/assets/example.css', '/favicon.ico']) {
      assert.equal(matcher.test(path), false)
    }
  }
})
