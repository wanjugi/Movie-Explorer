import { ref } from 'vue'
import { defineStore } from 'pinia'
import { contentKey, createLibraryStorage, snapshot, validProgress } from '../catalogue/libraryData.js'

const specs = {
  watchlist: [snapshot, 250],
  recent: [snapshot, 40],
  watched: [snapshot, 500],
  progress: [validProgress, 120],
}

export const useLibraryStore = defineStore('library', () => {
  let storage
  try { storage = globalThis.localStorage } catch { /* the store remains usable in memory */ }
  const persistence = Object.fromEntries(Object.entries(specs).map(([name, [validate, limit]]) =>
    [name, createLibraryStorage(storage, 'movieExplorer.' + name + ':v1', validate, limit)]))
  const watchlist = ref(persistence.watchlist.initial)
  const recent = ref(persistence.recent.initial)
  const watched = ref(persistence.watched.initial)
  const progress = ref(persistence.progress.initial)
  const state = { watchlist, recent, watched, progress }
  const warning = ref(Object.values(persistence).some(store => store.blocked))
  function keyOf(item) { return contentKey(item?.item ?? item) }
  function replace(name, items) {
    state[name].value = items.slice(0, specs[name][1])
    if (!persistence[name].write(state[name].value)) warning.value = true
  }
  function contains(name, item) { return state[name].value.some(existing => keyOf(existing) === keyOf(item)) }
  function remove(name, item) { replace(name, state[name].value.filter(existing => keyOf(existing) !== keyOf(item))) }
  function upsert(name, item) { replace(name, [item, ...state[name].value.filter(existing => keyOf(existing) !== keyOf(item))]) }
  function toggle(name, item) {
    const safe = snapshot(item)
    if (!safe || !['watchlist', 'watched'].includes(name)) return
    if (contains(name, safe)) remove(name, safe)
    else upsert(name, safe)
  }
  function visit(item) {
    const safe = snapshot(item)
    if (safe && keyOf(recent.value[0]) !== keyOf(safe)) upsert('recent', safe)
  }
  function record(item, source, position, duration, completed = false) {
    const safe = snapshot(item)
    const row = { item: safe, source, position, duration, completed, lastPlayed: Date.now() }
    if (!validProgress(row)) return
    upsert('progress', row)
    if (completed && !contains('watched', safe)) upsert('watched', safe)
  }
  function resetProgress(item) {
    remove('progress', item)
    if (contains('watched', item)) remove('watched', item)
  }
  return { ...state, warning, contains, toggle, visit, record, remove, resetProgress, clearRecent: () => replace('recent', []) }
})
