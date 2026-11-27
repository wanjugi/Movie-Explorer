import { ref } from 'vue'
import { defineStore } from 'pinia'
import { createLibraryStorage } from '../catalogue/libraryData.js'
import { findStation } from '../catalogue/liveTvStations.js'

// A separate envelope per list keeps station lifecycle and failures independent.
export function createStationStorage(storage, key, limit) {
  return createLibraryStorage(storage, 'movieExplorer.liveTv' + key + ':v1',
    row => !!findStation(row?.channel) || typeof row?.channel === 'string' && /^[a-z0-9-]{1,60}$/.test(row.channel),
    limit, row => row.channel)
}

export const useLiveTvStore = defineStore('live-tv', () => {
  let storage
  try { storage = globalThis.localStorage } catch { /* Use in-memory state. */ }
  const stores = {
    favorites: createStationStorage(storage, 'Favorites', 100),
    recent: createStationStorage(storage, 'Recent', 12),
    opened: createStationStorage(storage, 'Opened', 12),
    last: createStationStorage(storage, 'Last', 1),
  }
  const state = Object.fromEntries(Object.entries(stores).map(([name, store]) =>
    [name, ref(store.initial.map(row => row.channel))]))
  const warning = ref(Object.values(stores).some(store => store.blocked))
  function save(name, slugs) {
    if (slugs.join('|') === state[name].value.join('|')) return
    state[name].value = slugs
    if (!stores[name].write(slugs.map(channel => ({ channel })))) warning.value = true
  }
  function remember(name, slug) {
    if (!findStation(slug)) return
    save(name, [slug, ...state[name].value.filter(item => item !== slug)].slice(0, name === 'last' ? 1 : 12))
  }
  function forget(name, slug) {
    if (name === 'recent' || name === 'opened') save(name, state[name].value.filter(item => slug && item !== slug))
  }
  function toggle(slug) {
    if (!findStation(slug)) return
    const list = state.favorites.value
    save('favorites', list.includes(slug) ? list.filter(item => item !== slug) : [slug, ...list].slice(0, 100))
  }
  return { ...state, warning, remember, forget, toggle }
})
