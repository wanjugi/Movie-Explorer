import { computed, onScopeDispose, ref, watch } from 'vue'
import {
  isMovieBrowseRoute, navigateMovieBrowse, normalizeGenre, normalizeMovieSearch, normalizeYear, readMovieBrowseQuery,
} from '../router/movieBrowseQuery.js'
import { readGlobalSearchQuery, searchLocation } from '../router/mediaBrowseQuery.js'

export const BROWSE_DEBOUNCE_MS = 350

function useBrowseDebounce(router) {
  let timer

  function cancel() {
    clearTimeout(timer)
    timer = undefined
  }

  const removeGuard = router.beforeEach(cancel)
  onScopeDispose(() => {
    removeGuard()
    cancel()
  })

  function schedule(action) {
    cancel()
    timer = setTimeout(() => {
      timer = undefined
      action()
    }, BROWSE_DEBOUNCE_MS)
  }

  return { cancel, schedule }
}

function useSearchDraft(route, router, activeQuery, commit) {
  const draft = ref(activeQuery())
  const invalid = computed(() => normalizeMovieSearch(draft.value) === null)
  const { cancel, schedule } = useBrowseDebounce(router)

  function submit(debounced = false) {
    cancel()
    const q = normalizeMovieSearch(draft.value)
    if (q === null || q === activeQuery()) return
    return commit(q, debounced && Boolean(activeQuery()) && Boolean(q))
  }

  function clear() {
    cancel()
    draft.value = ''
  }

  watch(() => route.fullPath, () => {
    cancel()
    draft.value = activeQuery()
  }, { flush: 'sync' })

  watch(draft, value => {
    cancel()
    const q = normalizeMovieSearch(value)
    if (q === null || q === activeQuery()) return
    if (!q) void submit()
    else schedule(() => { void submit(true) })
  }, { flush: 'sync' })

  return { draft, invalid, submit, clear }
}

export function useMovieSearch(route, router) {
  const active = computed(() => readMovieBrowseQuery(isMovieBrowseRoute(route.name) ? route.query : {}))
  return useSearchDraft(route, router, () => active.value.q,
    (q, replace) => navigateMovieBrowse(router, { ...active.value, q }, replace))
}

export function useGlobalSearch(route, router) {
  const current = computed(() => route.name === 'search' ? readGlobalSearchQuery(route.query) : {})
  const legacy = computed(() => isMovieBrowseRoute(route.name) ? readMovieBrowseQuery(route.query) : null)
  return useSearchDraft(route, router, () => current.value.q ?? legacy.value?.q ?? '', (q, replace) => {
    if (!q && legacy.value?.q) return navigateMovieBrowse(router, { ...legacy.value, q: '' })
    const location = searchLocation({ q, type: current.value.type })
    return replace && route.name === 'search' ? router.replace(location) : router.push(location)
  })
}

export function useMovieFilters(route, router, active) {
  const yearDraft = ref(active.value.year)
  const invalidYear = computed(() => Boolean(yearDraft.value) && !normalizeYear(yearDraft.value))
  const { cancel, schedule } = useBrowseDebounce(router)

  function commitYear() {
    cancel()
    if (invalidYear.value || !isMovieBrowseRoute(route.name) || active.value.q) return
    return navigateMovieBrowse(router, { ...active.value, year: yearDraft.value })
  }

  function selectGenre(value) {
    cancel()
    return navigateMovieBrowse(router, {
      ...active.value,
      genre: normalizeGenre(value),
      year: invalidYear.value ? active.value.year : yearDraft.value,
    })
  }

  function clearFilters() {
    cancel()
    if (!active.value.year) yearDraft.value = ''
    return navigateMovieBrowse(router, {})
  }

  watch(() => route.fullPath, () => {
    cancel()
    yearDraft.value = active.value.year
  }, { flush: 'sync' })

  watch(yearDraft, year => {
    cancel()
    if (year === active.value.year || invalidYear.value || active.value.q || !isMovieBrowseRoute(route.name)) return
    if (!year) void commitYear()
    else schedule(commitYear)
  }, { flush: 'sync' })

  return { yearDraft, invalidYear, commitYear, selectGenre, clearFilters }
}
