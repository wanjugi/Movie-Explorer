import { computed, onScopeDispose, ref, watch } from 'vue'
import {
  navigateMovieBrowse, normalizeGenre, normalizeMovieSearch, normalizeYear, readMovieBrowseQuery,
} from '../router/movieBrowseQuery.js'

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

export function useMovieSearch(route, router) {
  const active = computed(() => readMovieBrowseQuery(route.name === 'home' ? route.query : {}))
  const draft = ref(active.value.q)
  const invalid = computed(() => normalizeMovieSearch(draft.value) === null)
  const { cancel, schedule } = useBrowseDebounce(router)

  function submit(debounced = false) {
    cancel()
    const q = normalizeMovieSearch(draft.value)
    if (q === null || (!q && !active.value.q)) return
    return navigateMovieBrowse(router, { ...active.value, q }, debounced && Boolean(active.value.q) && Boolean(q))
  }

  function clear() {
    cancel()
    draft.value = ''
  }

  watch(() => route.fullPath, () => {
    cancel()
    draft.value = active.value.q
  }, { flush: 'sync' })

  watch(draft, value => {
    cancel()
    const q = normalizeMovieSearch(value)
    if (q === null || q === active.value.q) return
    if (!q) void submit()
    else schedule(() => { void submit(true) })
  }, { flush: 'sync' })

  return { draft, invalid, submit, clear }
}

export function useMovieFilters(route, router, active) {
  const yearDraft = ref(active.value.year)
  const invalidYear = computed(() => Boolean(yearDraft.value) && !normalizeYear(yearDraft.value))
  const { cancel, schedule } = useBrowseDebounce(router)

  function commitYear() {
    cancel()
    if (invalidYear.value || route.name !== 'home' || active.value.q) return
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
    return navigateMovieBrowse(router, { ...active.value, genre: '', year: '' })
  }

  watch(() => route.fullPath, () => {
    cancel()
    yearDraft.value = active.value.year
  }, { flush: 'sync' })

  watch(yearDraft, year => {
    cancel()
    if (year === active.value.year || invalidYear.value || active.value.q || route.name !== 'home') return
    if (!year) void commitYear()
    else schedule(commitYear)
  }, { flush: 'sync' })

  return { yearDraft, invalidYear, commitYear, selectGenre, clearFilters }
}
