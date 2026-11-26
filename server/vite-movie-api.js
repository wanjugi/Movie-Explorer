import { loadEnv } from 'vite'
import { handleMovieRequest } from './movies.js'

export function movieApiPlugin() {
  function configure(server) {
    const { mode, envDir } = server.config
    const { TMDB_API_KEY: apiKey = '' } = loadEnv(mode, envDir, 'TMDB_API_KEY')

    server.middlewares.use(async (req, res, next) => {
      const pathname = req.url?.split('?', 1)[0]
      if (pathname !== '/api' && !pathname?.startsWith('/api/')) return next()

      const response = pathname === '/api/movies' || pathname === '/api/movies/'
        ? await handleMovieRequest(req, { apiKey })
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
