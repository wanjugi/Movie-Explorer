import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createPinia } from 'pinia'
import { handleMovieRequest } from '../server/movies.js'
import { handleTvRequest } from '../server/tv.js'
import { contentKey, createLibraryStorage, resumePosition, snapshot } from '../src/catalogue/libraryData.js'
import { filmography } from '../src/catalogue/filmography.js'
import { sourceFor, watchIdentity, youtubeEmbed } from '../src/catalogue/playbackSources.js'
import { useLibraryStore } from '../src/stores/libraryStore.js'

const movie = { media_type: 'movie', id: 10378, title: 'Big Buck Bunny' }
const episode = { media_type: 'tv', id: 33050, season: 1, episode: 1, name: 'Earthfall' }
const page = results => ({ page: 1, results, total_pages: 1, total_results: results.length })
const request = (path, query, fetchUpstream, method = 'GET') =>
  (path === 'tv' ? handleTvRequest : handleMovieRequest)(
    { method, url: '/api/' + path + '?operation=' + query }, { apiKey: 'synthetic-test-key', fetchUpstream })

test('movie details accept absent optional cast and rating while rejecting malformed values', async () => {
  for (const [body, expected] of [
    [{ ...movie, poster_path: null }, 200],
    [{ ...movie, poster_path: null, vote_average: null, credits: null }, 200],
    [{ ...movie, poster_path: null, vote_average: '8' }, 502],
    [{ ...movie, poster_path: null, credits: { cast: {} } }, 502],
  ]) {
    const response = await request('movies', 'details&id=' + movie.id, () => Response.json(body))
    assert.equal(response.status, expected)
  }
})

test('duplicate library entries are deduplicated in memory without rewriting storage on load', () => {
  const series = { media_type: 'tv', id: movie.id, name: 'Same number' }
  const raw = JSON.stringify({ version: 1, items: [movie, movie, series] })
  const storage = { getItem: () => raw, setItem: () => assert.fail('Initialization must not write') }
  const result = createLibraryStorage(storage, 'watchlist', snapshot, 2)
  assert.deepEqual(result.initial.map(contentKey), ['movie:10378', 'tv:10378'])
})

test('person search, profile and collection use only the documented upstream paths', async () => {
  for (const [query, path, body] of [
    ['person-search&query=Jane', '/search/person', page([{ id: 1, adult: false, name: 'Jane' }, { id: 2, adult: true, name: 'Hidden' }])],
    ['person&id=1', '/person/1', { id: 1, name: 'Jane', combined_credits: {
      cast: [movie, { id: 8, title: 'Hidden', adult: true, media_type: 'movie' }],
    } }],
    ['collection&id=1', '/collection/1', { id: 1, name: 'Series', parts: [movie, { id: 8, title: 'Hidden', adult: true }] }],
  ]) {
    const response = await request('movies', query, async (url, options) => {
      assert.equal(url.origin, 'https://api.themoviedb.org')
      assert.equal(url.pathname, '/3' + path)
      assert.equal(options.redirect, 'error')
      if (path === '/person/1') assert.equal(url.searchParams.get('append_to_response'), 'combined_credits,images')
      if (path === '/search/person') assert.equal(url.searchParams.get('include_adult'), 'false')
      return Response.json(body)
    })
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('Cache-Control'), 'no-store')
    assert.doesNotMatch(JSON.stringify(await response.json()), /Hidden|synthetic-test-key/)
  }
})

test('connected and availability operations retain media identity and use approved endpoints', async () => {
  for (const [api, type] of [['movies', 'movie'], ['tv', 'tv']]) {
    for (const operation of ['recommendations', 'similar', 'providers', 'calendar']) {
      const item = type === 'movie' ? movie : { id: 10378, name: 'TV title' }
      const query = operation === 'calendar' ? 'from=2026-10-01&to=2026-10-30' : 'id=10378'
      const response = await request(api, operation + '&' + query, async url => {
        const expected = operation === 'calendar' ? '/discover/' + type
          : '/' + type + '/10378/' + (operation === 'providers' ? 'watch/providers' : operation)
        assert.equal(url.pathname, '/3' + expected)
        return Response.json(operation === 'providers' ? { id: 10378, results: { KE: {} } } : page([item]))
      })
      assert.equal(response.status, 200)
      const data = await response.json()
      if (operation === 'providers') assert.deepEqual(data.results, { KE: {} })
      else assert.equal(data.results[0].media_type, type)
    }
  }
})

test('invalid IDs, paging, dates and URL parameters fail before upstream fetch', async () => {
  const noFetch = () => assert.fail('No upstream requests for invalid queries')
  for (const query of ['person&id=0', 'person&id=1&id=2', 'collection&id=2147483648',
    'person-search&query=Jane&page=501', 'providers&id=1&region=KE',
    'recommendations&id=1&url=https://example.com', 'similar&id=1&page=-1',
    'calendar&from=2026-02-30&to=2026-03-01', 'calendar&from=2026-01-01&to=2026-12-31']) {
    assert.equal((await request('movies', query, noFetch)).status, 400, query)
  }
  assert.equal((await request('tv', 'providers&id=1', noFetch, 'POST')).status, 405)
})

test('filmography groups media separately and retains distinct roles', () => {
  const tv = { media_type: 'tv', id: movie.id, name: 'A series' }
  const credits = { cast: [{ ...movie, character: 'A' }, { ...movie, character: 'B' }, tv],
    crew: [{ ...movie, department: 'Writing', job: 'Writer' }] }
  const results = filmography(credits)
  assert.equal(results.length, 2)
  assert.deepEqual([...results[0].roles], ['Acting: A', 'Acting: B', 'Writer'])
  assert.equal(filmography(credits, 'movie', 'Writing').length, 1)
})

test('playback registry validates route identity and permits only exact curated sources', () => {
  const identity = watchIdentity({ name: 'watch-episode', params: { id: '33050', seasonNumber: '1', episodeNumber: '1' } })
  assert.equal(contentKey(identity), 'tv:33050:1:1')
  assert.equal(sourceFor({ ...episode, episode: 2 }), null)
  assert.equal(sourceFor({ ...movie, media_type: 'tv' }), null)
  assert.equal(watchIdentity({ name: 'watch-movie', params: { id: '1e3' } }), null)
  assert.match(youtubeEmbed(sourceFor(movie), 'https://example.com'), /^https:\/\/www\.youtube-nocookie\.com\/embed\/YE7VzlLtp-4\?/)
  assert.equal(youtubeEmbed({ ...sourceFor(movie), asset: 'https://example.com' }, 'https://example.com'), null)
})

test('library persistence guards malformed and conflicting storage and matches resume by source and duration', () => {
  const values = new Map()
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
  const store = createLibraryStorage(storage, 'watchlist', snapshot, 2)
  assert.ok(store.write([movie, { ...movie, media_type: 'tv', name: 'TV title' }]))
  assert.equal(createLibraryStorage(storage, 'watchlist', snapshot, 2).initial.length, 2)
  values.set('watchlist', '{invalid')
  assert.equal(store.write([]), false)
  assert.equal(createLibraryStorage(storage, 'watchlist', snapshot, 2).write([]), false)
  assert.equal(values.get('watchlist'), '{invalid')
  assert.equal(createLibraryStorage(undefined, 'watchlist', snapshot, 2).write([]), false)
  assert.equal(snapshot({ ...episode, season: -1 }), null)
  const row = { item: episode, source: sourceFor(episode).asset, position: 250, duration: 1897, lastPlayed: 1, completed: false }
  assert.equal(resumePosition(row, row.source, 1897), 250)
  assert.equal(resumePosition(row, 'alternate', 1897), 0)
  assert.equal(resumePosition(row, row.source, 1800), 0)
  assert.equal(resumePosition({ ...row, completed: true }, row.source, 1897), 0)
})

test('library store tracks independent media and episodes without writing either Favorites key', () => {
  const data = new Map([['favoritesList', 'legacy fixture'], ['favoritesList:v2', 'current fixture']])
  const restore = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value),
  } })
  try {
    const store = useLibraryStore(createPinia())
    const series = { media_type: 'tv', id: movie.id, name: 'Same ID' }
    store.toggle('watchlist', movie)
    store.toggle('watchlist', series)
    store.visit(movie)
    store.visit(series)
    store.visit(movie)
    assert.deepEqual(store.recent.map(contentKey), ['movie:10378', 'tv:10378'])
    assert.equal(store.watched.length, 0)
    store.record(episode, sourceFor(episode).asset, 40, 600)
    assert.equal(store.contains('watched', episode), false)
    store.record(episode, sourceFor(episode).asset, 600, 600, true)
    assert.equal(store.contains('watched', episode), true)
    assert.equal(store.contains('watched', { ...episode, episode: 2 }), false)
    const restored = useLibraryStore(createPinia())
    assert.equal(restored.watchlist.length, 2)
    assert.equal(restored.progress[0].duration, 600)
    restored.resetProgress(episode)
    assert.equal(restored.watched.length, 0)
    assert.equal(restored.progress.length, 0)
    assert.equal(data.get('favoritesList'), 'legacy fixture')
    assert.equal(data.get('favoritesList:v2'), 'current fixture')
  } finally {
    if (restore) Object.defineProperty(globalThis, 'localStorage', restore)
    else delete globalThis.localStorage
  }
})
