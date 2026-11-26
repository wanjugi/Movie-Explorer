import assert from 'node:assert/strict'
import { test } from 'node:test'
import { setImmediate } from 'node:timers/promises'
import { effectScope, computed } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { BROWSE_DEBOUNCE_MS, useGlobalSearch, useMovieFilters, useMovieSearch } from '../src/composables/useMovieBrowseControls.js'
import { useMovieBrowseResults } from '../src/composables/useMovieBrowseResults.js'
import { movieBrowseLocation, movieBrowseRequest, navigateMovieBrowse, normalizeMovieSearch, readMovieBrowseQuery } from '../src/router/movieBrowseQuery.js'
import { pageItems } from '../src/catalogue/moviePages.js'

const envelope = results => ({ page: 1, results, total_pages: Number(results.length > 0), total_results: results.length })

const component = { render: () => null }

async function start(t, path) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component },
      { path: '/favorites', name: 'favorites', component },
      { path: '/movie/:id', name: 'movie-details', component },
      { path: '/search', name: 'search', component },
      { path: '/tv/:id', name: 'tv-details', component },
    ],
  })
  await router.push(path)
  const route = {
    get name() { return router.currentRoute.value.name },
    get query() { return router.currentRoute.value.query },
    get fullPath() { return router.currentRoute.value.fullPath },
  }
  const scope = effectScope()
  t.after(() => scope.stop())
  return { router, route, scope }
}

function useClock(t) {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  return async (ms = BROWSE_DEBOUNCE_MS) => {
    t.mock.timers.tick(ms)
    await setImmediate()
  }
}

test('global search debounces from TV details, preserves type, and clears a legacy movie query in place', async t => {
  const tick = useClock(t)
  const { route, router, scope } = await start(t, '/tv/550')
  const search = scope.run(() => useGlobalSearch(route, router))
  search.draft.value = 'Av'
  await tick(100)
  search.draft.value = 'Avatar + 雨'
  await tick(349)
  assert.equal(route.name, 'tv-details')
  await tick(1)
  assert.equal(route.name, 'search')
  assert.deepEqual(route.query, { q: 'Avatar + 雨' })
  await router.push('/search?q=Avatar&type=tv&page=3')
  search.draft.value = 'Other title'
  await search.submit()
  assert.deepEqual(route.query, { q: 'Other title', type: 'tv' })
  await router.push('/?q=Interstellar&genre=28&page=2')
  search.clear()
  await setImmediate()
  assert.equal(route.name, 'home')
  assert.deepEqual(route.query, { genre: '28' })
})

test('route query accepts single valid values, trims title text, and ignores malformed filters', () => {
  const title = "L’été + 雨 & A"
  assert.equal(normalizeMovieSearch('  ' + title + '  '), title)
  assert.equal(normalizeMovieSearch(' \t '), '')
  assert.equal(normalizeMovieSearch('a\u0000b'), null)
  assert.equal(normalizeMovieSearch('😀'.repeat(160)), '😀'.repeat(160))
  assert.equal(normalizeMovieSearch('😀'.repeat(161)), null)
  assert.deepEqual(readMovieBrowseQuery({ q: ['one', 'two'], genre: '2147483648', year: '202', unknown: 'x' }),
    { q: '', genre: '', year: '' })
  for (const genre of ['0', '-1', '01', '1.4', '1e3', '28,12', null, ['28']]) {
    assert.equal(readMovieBrowseQuery({ genre }).genre, '')
  }
  for (const year of ['0', '20', '0200', '10000', '2025.0', '', null, ['2025']]) {
    assert.equal(readMovieBrowseQuery({ year }).year, '')
  }
})

test('typing from Favorites creates one committed search and one request with encoded punctuation', async t => {
  const tick = useClock(t)
  const { route, router, scope } = await start(t, '/favorites')
  const requests = []
  t.mock.method(globalThis, 'fetch', async input => {
    requests.push(new URL(input, 'https://example.test').searchParams)
    return Response.json(envelope([]))
  })
  const search = scope.run(() => useMovieSearch(route, router))
  const { results } = scope.run(() => useMovieBrowseResults(route))
  for (const text of ['L', 'L’été', '  L’été + 雨 & A  ']) {
    search.draft.value = text
    await tick(100)
  }
  await tick(249)
  assert.equal(route.name, 'favorites')
  assert.equal(requests.length, 0)
  await tick(1)
  assert.equal(route.name, 'home')
  assert.equal(search.draft.value, 'L’été + 雨 & A')
  assert.match(route.fullPath, /%2B/)
  assert.match(route.fullPath, /%26/)
  assert.deepEqual(requests.map(params => Object.fromEntries(params)), [{ operation: 'search', query: 'L’été + 雨 & A' }])
  assert.equal(results.state.value.status, 'empty')
  await search.submit()
  await tick()
  assert.equal(requests.length, 1)
  router.back()
  await setImmediate()
  assert.equal(route.name, 'favorites')
  assert.equal(search.draft.value, '')
  router.forward()
  await setImmediate()
  assert.equal(search.draft.value, 'L’été + 雨 & A')
})

test('Enter searches immediately from Details and cancels the pending debounce', async t => {
  const tick = useClock(t)
  const { route, router, scope } = await start(t, '/movie/550')
  const search = scope.run(() => useMovieSearch(route, router))
  const arrivals = []
  router.afterEach((to, from, failure) => { if (!failure) arrivals.push(to.fullPath) })
  search.draft.value = '  Interstellar  '
  await search.submit()
  await tick()
  assert.deepEqual(arrivals, ['/?q=Interstellar'])
  assert.equal(search.draft.value, 'Interstellar')
  router.back()
  await setImmediate()
  assert.equal(route.fullPath, '/movie/550')
})

test('direct URL initializes search, an edit replaces its history entry, and clear restores URL filters', async t => {
  const tick = useClock(t)
  const { route, router, scope } = await start(t, '/?genre=28&year=2025')
  const search = scope.run(() => useMovieSearch(route, router))
  search.draft.value = 'First'
  await tick()
  assert.deepEqual(readMovieBrowseQuery(route.query), { q: 'First', genre: '28', year: '2025' })
  search.draft.value = 'Second'
  await tick()
  assert.equal(route.query.q, 'Second')

  const refreshed = await start(t, route.fullPath)
  const refreshedSearch = refreshed.scope.run(() => useMovieSearch(refreshed.route, refreshed.router))
  assert.equal(refreshedSearch.draft.value, 'Second')
  refreshedSearch.clear()
  await setImmediate()
  assert.deepEqual(refreshed.route.query, { genre: '28', year: '2025' })

  search.clear()
  await setImmediate()
  assert.deepEqual(route.query, { genre: '28', year: '2025' })
  router.back()
  await setImmediate()
  assert.equal(search.draft.value, 'Second')
  router.back()
  await setImmediate()
  assert.deepEqual(route.query, { genre: '28', year: '2025' })
  router.forward()
  await setImmediate()
  assert.equal(search.draft.value, 'Second')
})

test('empty, invalid, cleared, navigated-away and disposed drafts cannot fire delayed searches', async t => {
  const tick = useClock(t)
  const { route, router, scope } = await start(t, '/favorites')
  const search = scope.run(() => useMovieSearch(route, router))
  search.draft.value = '   '
  await search.submit()
  search.draft.value = 'x'.repeat(161)
  assert.equal(search.invalid.value, true)
  await search.submit()
  await tick()
  assert.equal(route.name, 'favorites')

  search.draft.value = 'Abandoned'
  search.clear()
  await tick()
  assert.equal(route.name, 'favorites')

  search.draft.value = 'Superseded by navigation'
  await router.push('/movie/550')
  await tick()
  assert.equal(route.fullPath, '/movie/550')
  assert.equal(search.draft.value, '')

  search.draft.value = 'Disposed'
  scope.stop()
  await tick()
  assert.equal(route.fullPath, '/movie/550')
})

test('only valid years commit, genre combines with a valid pending year, and filters clear in one navigation', async t => {
  const tick = useClock(t)
  const { route, router, scope } = await start(t, '/')
  const active = computed(() => readMovieBrowseQuery(route.query))
  const filters = scope.run(() => useMovieFilters(route, router, active))
  const arrivals = []
  router.afterEach((to, from, failure) => { if (!failure) arrivals.push(to.fullPath) })
  for (const year of ['2', '20', '202', '0202', '10000', '2025.5']) {
    filters.yearDraft.value = year
    assert.equal(filters.invalidYear.value, true)
    await filters.commitYear()
    await tick()
  }
  assert.equal(arrivals.length, 0)
  filters.yearDraft.value = '2025'
  await filters.selectGenre('28')
  await tick()
  assert.deepEqual(route.query, { genre: '28', year: '2025' })
  assert.equal(arrivals.length, 1)
  filters.yearDraft.value = '1999'
  await filters.commitYear()
  await tick()
  assert.equal(route.query.year, '1999')
  filters.yearDraft.value = ''
  await setImmediate()
  assert.deepEqual(route.query, { genre: '28' })
  filters.yearDraft.value = '1998'
  await tick()
  assert.deepEqual(route.query, { genre: '28', year: '1998' })
  const count = arrivals.length
  await filters.clearFilters()
  await tick()
  assert.deepEqual(route.query, {})
  assert.equal(arrivals.length, count + 1)
  assert.equal(filters.yearDraft.value, '')
})

const movie = { id: 550, title: 'Movie', poster_path: null }

test('results follow semantic route state, cancel obsolete loads, and keep genre failures independent', async t => {
  const { route, router, scope } = await start(t, '/?q=  Moon  &genre=28&year=2025&anything=x')
  const requests = []
  t.mock.method(globalThis, 'fetch', (input, { signal }) => {
    const params = Object.fromEntries(new URL(input, 'http://localhost').searchParams)
    return new Promise(resolve => {
      requests.push({ params, signal, resolve })
    })
  })
  const { results, genres } = scope.run(() => useMovieBrowseResults(route))
  assert.equal(results.state.value.status, 'loading')
  assert.deepEqual(requests.map(r => r.params), [{ operation: 'search', query: 'Moon' }])
  await router.push('/?q=Moon&genre=99&year=2025&extra=ignored')
  assert.equal(requests.length, 1)
  await router.push('/?genre=28&year=2025')
  assert.equal(requests[0].signal.aborted, true)
  assert.deepEqual(requests.map(r => r.params), [
    { operation: 'search', query: 'Moon' },
    { operation: 'discover', genre: '28', year: '2025' },
    { operation: 'genres' },
  ])
  requests[0].resolve(Response.json(envelope([])))
  requests[2].resolve(new Response(null, { status: 503 }))
  await setImmediate()
  assert.equal(results.state.value.status, 'loading')
  assert.equal(genres.state.value.status, 'error')
  requests[1].resolve(Response.json(envelope([movie])))
  await setImmediate()
  assert.deepEqual(results.state.value, { status: 'success', data: envelope([movie]), error: null })

  await router.push('/?genre=2147483648&year=202&unknown=1&q=a&q=b')
  const defaultRequest = requests.at(-1)
  assert.deepEqual(defaultRequest.params, { operation: 'discover' })
  defaultRequest.resolve(new Response(null, { status: 500 }))
  await setImmediate()
  assert.equal(results.state.value.status, 'error')
  const retry = results.retry()
  const retryRequest = requests.at(-1)
  assert.deepEqual(retryRequest.params, defaultRequest.params)
  await router.push('/?q=Next')
  assert.equal(retryRequest.signal.aborted, true)
  const searchRequest = requests.at(-1)
  assert.deepEqual(searchRequest.params, { operation: 'search', query: 'Next' })
  await router.push('/movie/550')
  assert.equal(searchRequest.signal.aborted, true)
  retryRequest.resolve(Response.json(envelope([movie])))
  searchRequest.resolve(Response.json(envelope([movie])))
  await retry
  await setImmediate()
  assert.equal(results.state.value.status, 'idle')
})

test('page URLs pause incompatible filters, reset on criteria changes, and restore through history', async t => {
  const { route, router } = await start(t, '/?from=1980&to=1989&language=ko&sort=rating&page=5')
  const active = () => readMovieBrowseQuery(route.query)
  assert.deepEqual(movieBrowseRequest(active()), {
    operation: 'discover', parameters: { from: '1980', to: '1989', language: 'ko', sort: 'rating', page: '5' },
  })
  await navigateMovieBrowse(router, { ...active(), q: 'Movie' })
  assert.equal(route.query.page, undefined)
  assert.deepEqual(movieBrowseRequest(active()), { operation: 'search', parameters: { query: 'Movie' } })
  await router.push(movieBrowseLocation({ ...active(), page: '2' }))
  assert.deepEqual(movieBrowseRequest(active()), { operation: 'search', parameters: { query: 'Movie', page: '2' } })
  router.back()
  await setImmediate()
  assert.equal(route.query.page, undefined)
  router.forward()
  await setImmediate()
  assert.equal(route.query.page, '2')
  await navigateMovieBrowse(router, { ...active(), q: '' })
  assert.deepEqual(movieBrowseRequest(active()), {
    operation: 'discover', parameters: { from: '1980', to: '1989', language: 'ko', sort: 'rating' },
  })
  assert.deepEqual(movieBrowseRequest(readMovieBrowseQuery({ category: 'trending', period: 'day', page: '3' })),
    { operation: 'trending', parameters: { period: 'day' } })
  assert.deepEqual(pageItems(250, 500), [1, null, 249, 250, 251, null, 500])
})
