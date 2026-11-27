import { loadEnv } from 'vite'
import { handleMovieRequest } from './movies.js'
import { handleTvRequest } from './tv.js'
import { handleLiveTvRequest } from './live-tv.js'

const handlers = new Map([['/api/movies', handleMovieRequest], ['/api/tv', handleTvRequest], ['/api/live-tv', handleLiveTvRequest]])

export function movieApiPlugin() {
  function configure(server) {
    const { mode, envDir } = server.config
    const { TMDB_API_KEY: apiKey = '' } = loadEnv(mode, envDir, 'TMDB_API_KEY')
    const { YOUTUBE_DATA_API_KEY: key = '' } = loadEnv(mode, envDir, 'YOUTUBE_DATA_API_KEY')

    server.middlewares.use(async (req, res, next) => {
      const pathname = req.url?.split('?', 1)[0]
      if (pathname !== '/api' && !pathname?.startsWith('/api/')) return next()

      const handler = handlers.get(pathname.endsWith('/') ? pathname.slice(0, -1) : pathname)
      const response = handler
        ? await handler(req, { apiKey, key })
        : Response.json({ error: { code: 'NOT_FOUND', message: 'API endpoint not found.' } }, {
          status: 404,
          headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
        })

      res.writeHead(response.status, Object.fromEntries(response.headers))
      res.end(req.method === 'HEAD' ? undefined : await response.text())
    })
  }

  return {
    name: 'movie-api',
    configureServer: configure,
    configurePreviewServer: configure,
  }
}
