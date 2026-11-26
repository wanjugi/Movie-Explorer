export const SEARCH_LIMIT = 160

export function normalizeMovieSearch(value) {
  if (typeof value !== 'string') return null
  const query = value.trim()
  if (!query) return ''
  if ([...query].length > SEARCH_LIMIT || /[\p{Cc}]/u.test(value)) return null
  return query
}

export function normalizeGenre(value) {
  return typeof value === 'string' && /^[1-9]\d{0,9}$/.test(value) && Number(value) <= 2_147_483_647
    ? value
    : ''
}

export function normalizeYear(value) {
  return typeof value === 'string' && /^[1-9]\d{3}$/.test(value) ? value : ''
}

export function readMovieBrowseQuery(query = {}) {
  return {
    q: normalizeMovieSearch(query.q) ?? '',
    genre: normalizeGenre(query.genre),
    year: normalizeYear(query.year),
  }
}

export function navigateMovieBrowse(router, values, replace = false) {
  const next = readMovieBrowseQuery(values)
  const current = router.currentRoute.value
  const active = readMovieBrowseQuery(current.query)
  if (current.name === 'home' && Object.keys(next).every(key => next[key] === active[key])) return

  const query = Object.fromEntries(Object.entries(next).filter(([, value]) => value))
  return replace ? router.replace({ name: 'home', query }) : router.push({ name: 'home', query })
}
