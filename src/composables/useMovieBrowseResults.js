import { computed, watch } from 'vue'
import { readMovieBrowseQuery } from '../router/movieBrowseQuery.js'
import { discoverMovies, fetchGenres, searchMovies } from '../services/moviesApi.js'
import { useLatestRequest } from './useLatestRequest.js'

export function useMovieBrowseResults(route) {
  const active = computed(() => readMovieBrowseQuery(route.query))
  const results = useLatestRequest()
  const genres = useLatestRequest()

  const requestKey = computed(() => {
    if (route.name !== 'home') return ''
    const { q, genre, year } = active.value
    return JSON.stringify(q ? ['search', q] : ['discover', genre, year])
  })

  watch(requestKey, key => {
    if (!key) return results.cancel()
    const { q, genre, year } = active.value
    void results.run(signal => {
      const options = { signal, throwOnError: true }
      return q ? searchMovies(q, options) : discoverMovies({ genre, year }, options)
    })
  }, { immediate: true, flush: 'sync' })

  watch(() => route.name === 'home' && !active.value.q, enabled => {
    if (enabled && genres.state.value.status === 'idle') {
      void genres.run(signal => fetchGenres({ signal, throwOnError: true }))
    } else if (!enabled && genres.state.value.status === 'loading') {
      genres.cancel()
    }
  }, { immediate: true, flush: 'sync' })

  return { active, results, genres }
}
