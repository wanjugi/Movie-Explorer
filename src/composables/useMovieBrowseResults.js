import { computed, watch } from 'vue'
import { isMovieBrowseRoute, movieBrowseRequest, readMovieBrowseQuery } from '../router/movieBrowseQuery.js'
import { fetchGenres, fetchMoviePage } from '../services/moviesApi.js'
import { useLatestRequest } from './useLatestRequest.js'

export function useMovieBrowseResults(route) {
  const active = computed(() => readMovieBrowseQuery(route.query))
  const results = useLatestRequest({ isEmpty: page => page.results.length === 0 })
  const genres = useLatestRequest()

  const requestKey = computed(() => {
    if (!isMovieBrowseRoute(route.name)) return ''
    return JSON.stringify(movieBrowseRequest(active.value))
  })

  watch(requestKey, key => {
    if (!key) return results.cancel()
    const { operation, parameters } = movieBrowseRequest(active.value)
    void results.run(signal => fetchMoviePage(operation, parameters, { signal }))
  }, { immediate: true, flush: 'sync' })

  watch(() => isMovieBrowseRoute(route.name) && !active.value.q && !active.value.category, enabled => {
    if (enabled && genres.state.value.status === 'idle') {
      void genres.run(signal => fetchGenres({ signal, throwOnError: true }))
    } else if (!enabled && genres.state.value.status === 'loading') {
      genres.cancel()
    }
  }, { immediate: true, flush: 'sync' })

  return { active, results, genres }
}
