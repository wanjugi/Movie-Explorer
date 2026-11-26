import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createPinia, setActivePinia } from 'pinia'
import { useFavoritesStore } from '../src/stores/favoritesStore.js'
import { openFavorites, persistFavorites, FAVORITES_KEY, LEGACY_FAVORITES_KEY } from '../src/stores/favoritesStorage.js'

const movie = { id: 550, title: 'Legacy movie', poster_path: null, release_date: '1999-10-15' }
const tv = { id: 550, name: 'Same ID series', poster_path: null, media_type: 'tv' }
const legacy = JSON.stringify([movie, movie])
const fakeStorage = (data = {}) => ({
  getItem: key => data[key] ?? null,
  setItem(key, value) { data[key] = value },
})
const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
after(() => {
  if (previous) Object.defineProperty(globalThis, 'localStorage', previous)
  else delete globalThis.localStorage
})

test('legacy migration is idempotent and both media identities can coexist and be removed separately', () => {
  const storage = fakeStorage({ [LEGACY_FAVORITES_KEY]: legacy })
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage })
  setActivePinia(createPinia())
  const store = useFavoritesStore()
  assert.deepEqual(store.favorites, [{ ...movie, media_type: 'movie' }])
  assert.equal(storage.getItem(FAVORITES_KEY), null)
  store.toggleFavorite(tv)
  assert.equal(store.checkIsFavorite(550), true)
  assert.equal(store.checkIsFavorite(550, 'tv'), true)
  assert.deepEqual(openFavorites(storage).favorites, openFavorites(storage).favorites)
  assert.equal(openFavorites(storage).favorites.length, 2)
  store.toggleFavorite(movie)
  assert.equal(store.checkIsFavorite(550), false)
  assert.equal(store.checkIsFavorite(550, 'tv'), true)
  assert.deepEqual(openFavorites(storage).favorites, [tv])
  assert.equal(storage.getItem(LEGACY_FAVORITES_KEY), legacy)
})

test('read, write and concurrent-version failures preserve saved data', () => {
  const storage = fakeStorage({ [LEGACY_FAVORITES_KEY]: legacy })
  const session = openFavorites(storage)
  const firstWriter = openFavorites(storage)
  assert.equal(persistFavorites(storage, firstWriter, [tv]), true)
  assert.equal(persistFavorites(storage, session, []), false)
  assert.deepEqual(openFavorites(storage).favorites, [tv])
  const broken = fakeStorage({ [LEGACY_FAVORITES_KEY]: legacy, [FAVORITES_KEY]: 'broken-json' })
  const fallback = openFavorites(broken)
  assert.equal(fallback.warning, true)
  assert.equal(fallback.favorites.length, 1)
  assert.equal(persistFavorites(broken, fallback, []), false)
  assert.equal(broken.getItem(FAVORITES_KEY), 'broken-json')
  const quota = fakeStorage({ [LEGACY_FAVORITES_KEY]: legacy })
  quota.setItem = () => { throw new Error('Quota') }
  assert.equal(persistFavorites(quota, openFavorites(quota), [tv]), false)
  assert.equal(quota.getItem(LEGACY_FAVORITES_KEY), legacy)
  assert.equal(openFavorites({ getItem() { throw new Error('Denied') } }).warning, true)
})
