import { ref } from 'vue'
import { defineStore } from 'pinia'
import { mediaKey } from '../catalogue/mediaIdentity.js'
import { normalizeFavorite, openFavorites, persistFavorites } from './favoritesStorage.js'

export const useFavoritesStore = defineStore('favorites', () => {
  let storage
  try { storage = globalThis.localStorage } catch { /* blocked by browser */ }
  const session = openFavorites(storage)
  const favorites = ref(session.favorites)
  const storageWarning = ref(session.warning)

  function checkIsFavorite(id, type = 'movie') {
    const key = mediaKey({ id, media_type: type })
    return Boolean(key) && favorites.value.some(item => mediaKey(item) === key)
  }

  function toggleFavorite(item) {
    const favorite = normalizeFavorite(item, true)
    if (!favorite) return
    const key = mediaKey(favorite)
    const index = favorites.value.findIndex(saved => mediaKey(saved) === key)
    if (index === -1) favorites.value.push(favorite)
    else favorites.value.splice(index, 1)
    storageWarning.value = !persistFavorites(storage, session, favorites.value)
  }

  return { favorites, storageWarning, toggleFavorite, checkIsFavorite }
})
