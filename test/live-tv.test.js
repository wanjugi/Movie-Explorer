import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createPinia } from 'pinia'
import { findStation, filterStations, liveEmbed, liveTvStations, viewingUrl } from '../src/catalogue/liveTvStations.js'
import { useLiveTvStore } from '../src/stores/liveTvStore.js'

test('station IDs are namespaced, unique, and international membership is explicit', () => {
  assert.equal(new Set(liveTvStations.map(station => station.id)).size, liveTvStations.length)
  assert.deepEqual(filterStations({ region: 'international' }).map(station => station.slug),
    ['al-jazeera-english', 'bbc-news', 'cnn-international', 'cgtn-africa', 'france-24-english'])
  for (const station of liveTvStations) {
    assert.match(station.id, /^channel:[a-z0-9-]+$/)
    assert.equal(findStation(station.slug), station)
    assert.equal(new URL(viewingUrl(station)).protocol, 'https:')
  }
  for (const slug of ['__proto__', '../ntv-kenya', 'youtube', undefined, ['ntv-kenya']]) assert.equal(findStation(slug), null)
})

test('regional, language, category and text filters compose and include station aliases', () => {
  assert.deepEqual(filterStations({ region: 'kenya', language: 'Dholuo', category: 'Vernacular' }).map(s => s.slug), ['ramogi-tv'])
  assert.equal(filterStations({ region: 'international', language: 'English', category: 'News' }).length, 5)
  assert.deepEqual(filterStations({ search: 'ktn news' }).map(s => s.slug), ['ktn-home'])
  assert.equal(filterStations({ region: 'international', search: 'nTV' }).length, 0)
})

test('the embedded player accepts only registered sources and falls back after a dated event expires', () => {
  const alJazeera = findStation('al-jazeera-english')
  const ntv = findStation('ntv-kenya')
  const embed = new URL(liveEmbed(alJazeera, 'https://example.test'))
  assert.equal(embed.origin, 'https://www.youtube-nocookie.com')
  assert.equal(embed.searchParams.get('autoplay'), '0')
  assert.equal(embed.searchParams.get('origin'), 'https://example.test')
  assert.equal(liveEmbed({ ...alJazeera, videoId: 'arbitraryID' }, 'https://example.test'), null)
  assert.match(liveEmbed(findStation('bbc-news'), 'https://example.test'), /\/embed\/sc21UUjyLaw\?/)
  assert.equal(liveEmbed(findStation('cnn-international'), 'https://example.test'), null)
  assert.ok(liveEmbed(ntv, 'https://example.test', Date.parse('2026-11-26')))
  assert.equal(liveEmbed(ntv, 'https://example.test', Date.parse('2026-12-01')), null)
})

test('station favorites, confirmed watch history and external opens remain separate and preserve unreadable data', () => {
  const stored = new Map([['movieExplorer.liveTvRecent:v1', '{broken'], ['favoritesList:v2', 'existing']])
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value),
  } })
  try {
    const store = useLiveTvStore(createPinia())
    assert.equal(store.warning, true)
    store.toggle('france-24-english')
    store.remember('opened', 'bbc-news')
    assert.deepEqual(store.recent, [])
    store.remember('recent', 'ntv-kenya')
    store.remember('recent', 'ntv-kenya')
    assert.deepEqual(store.recent, ['ntv-kenya'])
    assert.equal(stored.get('movieExplorer.liveTvRecent:v1'), '{broken')
    assert.equal(stored.get('favoritesList:v2'), 'existing')
    const restored = useLiveTvStore(createPinia())
    assert.deepEqual(restored.favorites, ['france-24-english'])
    assert.deepEqual(restored.opened, ['bbc-news'])
    restored.forget('opened', 'bbc-news')
    assert.deepEqual(restored.opened, [])
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original)
    else delete globalThis.localStorage
  }
})
