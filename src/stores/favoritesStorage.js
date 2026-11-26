import { isMovieSummary, isTvSummary, mediaKey } from '../catalogue/mediaIdentity.js'

export const LEGACY_FAVORITES_KEY = 'favoritesList'
export const FAVORITES_KEY = 'favoritesList:v2'

export function normalizeFavorite(item, legacy = false) {
  const type = item?.media_type ?? (legacy ? 'movie' : null)
  if (type === 'movie' && isMovieSummary(item)) return { ...item, media_type: 'movie' }
  if (type === 'tv' && isTvSummary(item)) return { ...item, media_type: 'tv' }
  return null
}

function decode(raw, legacy) {
  if (raw === null) return { favorites: [], valid: true }
  let data
  try { data = JSON.parse(raw) } catch { return { favorites: [], valid: false } }
  const entries = legacy ? data : data?.version === 2 ? data.favorites : null
  if (!Array.isArray(entries)) return { favorites: [], valid: false }
  const unique = new Map()
  let valid = true
  for (const entry of entries) {
    const favorite = normalizeFavorite(entry, legacy)
    if (!favorite) {
      valid = false
      continue
    }
    const key = mediaKey(favorite)
    if (!unique.has(key)) unique.set(key, favorite)
  }
  return { favorites: [...unique.values()], valid }
}

export function openFavorites(storage) {
  try {
    const raw = storage.getItem(FAVORITES_KEY)
    if (raw !== null) {
      const decoded = decode(raw, false)
      const favorites = decoded.valid || decoded.favorites.length
        ? decoded.favorites
        : decode(storage.getItem(LEGACY_FAVORITES_KEY), true).favorites
      return { raw, favorites, writable: decoded.valid, warning: !decoded.valid }
    }
    const legacy = storage.getItem(LEGACY_FAVORITES_KEY)
    const decoded = decode(legacy, true)
    // Keep a valid subset usable. The legacy payload is left at its original key.
    const writable = decoded.valid || decoded.favorites.length > 0
    return { raw, favorites: decoded.favorites, writable, warning: !writable }
  } catch {
    return { raw: null, favorites: [], writable: false, warning: true }
  }
}

export function persistFavorites(storage, session, favorites) {
  if (!session.writable) return false
  try {
    if (storage.getItem(FAVORITES_KEY) !== session.raw) return false
    const raw = JSON.stringify({ version: 2, favorites })
    if (!decode(raw, false).valid) return false
    storage.setItem(FAVORITES_KEY, raw)
    if (storage.getItem(FAVORITES_KEY) !== raw) return false
    session.raw = raw
    return true
  } catch {
    return false
  }
}
