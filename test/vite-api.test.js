import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { createServer } from 'vite'

test('Vite serves app and API routes with server-only authentication', async t => {
  const serverKey = 'movie-explorer-test-server-marker'
  const legacyKey = 'movie-explorer-test-legacy-marker'
  const savedEnv = {
    TMDB_API_KEY: process.env.TMDB_API_KEY,
    VITE_TMDB_API_KEY: process.env.VITE_TMDB_API_KEY,
  }
  process.env.TMDB_API_KEY = serverKey
  process.env.VITE_TMDB_API_KEY = legacyKey
  const fetchLocal = globalThis.fetch
  const upstreamCalls = []

  t.mock.method(globalThis, 'fetch', async input => {
    upstreamCalls.push(new URL(input))
    return Response.json({ genres: [{ id: 28, name: 'Action' }] })
  })

  let vite
  try {
    vite = await createServer({
      configLoader: 'runner',
      envDir: fileURLToPath(new URL('.', import.meta.url)),
      logLevel: 'error',
      server: { host: '127.0.0.1', port: 0, watch: null, ws: false },
      optimizeDeps: { noDiscovery: true, include: [] },
    })
    await vite.listen()
    const origin = `http://127.0.0.1:${vite.httpServer.address().port}`
    const fetchPath = path => fetchLocal(origin + path, { signal: AbortSignal.timeout(5000) })

    for (const path of ['/', '/favorites', '/movie/550']) {
      const response = await fetchPath(path)
      assert.equal(response.status, 200)
      assert.match(response.headers.get('content-type'), /text\/html/)
      assert.match(await response.text(), /id="app"/)
    }

    const unknownApi = await fetchPath('/api/not-found')
    assert.equal(unknownApi.status, 404)
    assert.match(unknownApi.headers.get('content-type'), /application\/json/)
    assert.equal((await unknownApi.json()).error.code, 'NOT_FOUND')
    assert.equal(upstreamCalls.length, 0)

    const genres = await fetchPath('/api/movies?operation=genres')
    assert.equal(genres.status, 200)
    assert.deepEqual(await genres.json(), { genres: [{ id: 28, name: 'Action' }] })
    assert.equal(upstreamCalls.length, 1)
    assert.equal(upstreamCalls[0].origin, 'https://api.themoviedb.org')
    assert.equal(upstreamCalls[0].pathname, '/3/genre/movie/list')
    assert.ok(upstreamCalls[0].searchParams.get('api_key') === serverKey)

    for (const path of ['/src/router/index.js', '/src/services/moviesApi.js']) {
      const response = await fetchPath(path)
      assert.equal(response.status, 200)
      const clientModule = await response.text()
      assert.ok(![serverKey, legacyKey, 'TMDB_API_KEY', 'api.themoviedb.org']
        .some(marker => clientModule.includes(marker)), `${path} exposed server configuration`)
      if (path.includes('moviesApi')) assert.ok(clientModule.includes('/api/movies?'))
    }
  } finally {
    try {
      await vite?.close()
    } finally {
      for (const [name, value] of Object.entries(savedEnv)) {
        if (value === undefined) delete process.env[name]
        else process.env[name] = value
      }
    }
  }
})
