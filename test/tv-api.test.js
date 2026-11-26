import assert from 'node:assert/strict'
import { test } from 'node:test'
import { handleTvRequest } from '../server/tv.js'
import { readGlobalSearchQuery, readTvBrowseQuery, tvBrowseRequest } from '../src/router/mediaBrowseQuery.js'

const secret = 'synthetic-server-secret'
const empty = { page: 1, results: [], total_pages: 0, total_results: 0 }
const request = (query, fetchUpstream, method = 'GET') =>
  handleTvRequest({ method, url: '/api/tv?' + query }, { apiKey: secret, fetchUpstream })

test('TV catalogue operations match documented upstream paths and supported pagination', async () => {
  for (const [query, path, page] of [
    ['operation=discover&page=2&from=2000&to=2005&sort=oldest&genre=18&rating=8&votes=9&language=ko', '/discover/tv', '2'],
    ['operation=search&query=A%2BB%26%F0%9F%8C%8D', '/search/tv', '1'],
    ['operation=popular&page=500', '/tv/popular', '500'],
    ['operation=top-rated', '/tv/top_rated', '1'],
    ['operation=airing-today', '/tv/airing_today', '1'],
    ['operation=on-the-air', '/tv/on_the_air', '1'],
    ['operation=trending', '/trending/tv/week', null],
    ['operation=trending&period=day', '/trending/tv/day', null],
    ['operation=genres', '/genre/tv/list', null],
  ]) {
    const response = await request(query, async (url, options) => {
      assert.equal(url.origin, 'https://api.themoviedb.org')
      assert.equal(url.pathname, '/3' + path)
      assert.equal(url.searchParams.get('page'), page)
      assert.equal(options.redirect, 'error')
      if (path === '/discover/tv') {
        const params = url.searchParams
        for (const [key, value] of Object.entries({
          'first_air_date.gte': '2000-01-01', 'first_air_date.lte': '2005-12-31',
          sort_by: 'first_air_date.asc', include_adult: 'false', with_genres: '18',
          'vote_average.gte': '8', 'vote_count.gte': '9', with_original_language: 'ko',
        })) assert.equal(params.get(key), value)
      }
      if (path === '/search/tv') assert.equal(url.searchParams.get('query'), 'A+B&🌍')
      return Response.json(path === '/genre/tv/list' ? { genres: [] } : empty)
    })
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('Cache-Control'), 'no-store')
  }
})

test('rejects invalid TV filters, identifiers, operation names and forwarding attempts before Fetch', async () => {
  const noFetch = () => assert.fail('Validation must precede Fetch')
  for (const query of [
    'operation=popular&page=501', 'operation=search&query=%FC', 'operation=search&query=A&query=B',
    'operation=popular&language=ko', 'operation=trending&page=2', 'operation=trending&period=year',
    'operation=discover&genre=0', 'operation=discover&year=2020&from=2000', 'operation=discover&from=2020&to=2000',
    'operation=discover&rating=11', 'operation=discover&votes=-1', 'operation=discover&sort=revenue',
    'operation=discover&language=zzz', 'operation=details&id=0', 'operation=details&id=2147483648',
    'operation=details&id=1&append_to_response=external_ids', 'operation=details&id=1&url=https://example.test',
    'operation=season&id=1&season=-1', 'operation=episode&id=1&season=0&episode=1.5',
    'operation=episode&id=1&season=0&episode=2147483648', 'operation=episode&id=1&season=0&episode=1&episode=2',
  ]) assert.equal((await request(query, noFetch)).status, 400, query)
  assert.equal((await request('operation=external', noFetch)).status, 404)
  assert.equal((await request('operation=discover', noFetch, 'POST')).status, 405)
})

test('series credits, Specials and episode numbers work and resource failures stay private', async () => {
  for (const [query, finalPath, data] of [
    ['details&id=22', '/tv/22', { id: 22, name: 'Title', seasons: [], credits: { cast: [] } }],
    ['season&id=22&season=0', '/tv/22/season/0', { id: 66, name: 'Specials', season_number: 0, episodes: [] }],
    ['episode&id=22&season=0&episode=0', '/tv/22/season/0/episode/0', { id: 52, name: 'Pilot', season_number: 0, episode_number: 0 }],
  ]) {
    const response = await request('operation=' + query, async url => {
      assert.equal(url.pathname, '/3' + finalPath)
      assert.equal(url.searchParams.get('append_to_response'), query.startsWith('details') ? 'credits' : null)
      return Response.json(data)
    })
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), data)
  }
  const missing = await request('operation=details&id=22', async () => new Response(secret, { status: 404 }))
  assert.equal(missing.status, 404)
  assert.equal((await missing.json()).error.code, 'TV_NOT_FOUND')
  const denied = await request('operation=details&id=22', async () => new Response(secret, { status: 401 }))
  assert.equal(denied.status, 502)
  assert.ok(!(await denied.text()).includes(secret))
  const reflected = await request('operation=details&id=22', async () => Response.json({ id: 22, name: secret }))
  assert.equal(reflected.status, 502)
  assert.ok(!(await reflected.text()).includes(secret))
})

test('combined search retains provider counts and excludes people and adult records', async () => {
  const results = [
    { id: 1, media_type: 'movie', title: 'Movie', adult: false },
    { id: 1, media_type: 'tv', name: 'Series', adult: false },
    { id: 2, media_type: 'person', name: 'Person', adult: false },
    { id: 3, media_type: 'tv', name: 'Adult series', adult: true },
  ]
  const response = await request('operation=multi-search&query=Example&page=2', async url => {
    assert.equal(url.pathname, '/3/search/multi')
    assert.equal(url.searchParams.get('include_adult'), 'false')
    return Response.json({ page: 2, results, total_pages: 9, total_results: 170 })
  })
  assert.deepEqual(await response.json(), { page: 2, results: results.slice(0, 2), total_pages: 9, total_results: 170 })
})

test('URL browsing keeps filters paused outside Discover and rejects ambiguous query values', () => {
  const state = readTvBrowseQuery({ year: '2008', from: '1999', rating: '8', category: 'airing-today', page: '2', genre: ['18', '16'] })
  assert.deepEqual(tvBrowseRequest(state), ['airing-today', { page: '2' }])
  assert.deepEqual(tvBrowseRequest({ ...state, category: undefined }), ['discover', { year: '2008', rating: '8', page: '2' }])
  assert.deepEqual(readGlobalSearchQuery({ q: ' A+B & 映画 ', type: 'tv', page: '500' }), { q: 'A+B & 映画', type: 'tv', page: '500' })
  assert.deepEqual(readGlobalSearchQuery({ q: ['a', 'b'], type: 'person', page: '2' }), {})
})
