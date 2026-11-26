<script setup>
import { computed, ref } from 'vue'
import { useLibraryStore } from '@/stores/libraryStore.js'
import { useFavoritesStore } from '@/stores/favoritesStore.js'
import { contentKey, snapshot } from '@/catalogue/libraryData.js'
import { mediaKey } from '@/catalogue/mediaIdentity.js'
import { detailLocation, playbackCatalogue, sourceFor, watchLocation } from '@/catalogue/playbackSources.js'
import { fetchLibraryRecommendations } from '@/services/discoveryApi.js'
import CinemaRail from '@/components/CinemaRail.vue'
import ContentState from '@/components/ContentState.vue'
import MovieCard from '@/components/MovieCard.vue'
import MediaPoster from '@/components/MediaPoster.vue'

const library = useLibraryStore()
const favorites = useFavoritesStore()
const tab = ref('watchlist')
const type = ref('all')
const recommendations = ref(false)
const eligible = row => !row.completed && row.position > 0 && !library.contains('watched', row.item)
  && sourceFor(row.item)?.asset === row.source
const entries = computed(() => (tab.value === 'progress' ? library.progress.filter(eligible) : library[tab.value])
  .filter(row => type.value === 'all' || (row.item ?? row).media_type === type.value))
const seeds = computed(() => {
  const result = new Map()
  for (const item of [...library.watchlist.slice(0, 3), ...favorites.favorites.slice(0, 3), ...library.watched.slice(0, 3)]) {
    const normalized = snapshot(item)
    if (!normalized || Number.isInteger(normalized.episode)) continue
    result.set(mediaKey(normalized), normalized)
    if (result.size === 3) break
  }
  return [...result.values()]
})
const personalizationKey = computed(() => seeds.value.map(mediaKey).join('|'))
const personalized = computed(() => ({
  title: 'Recommended from your library', category: 'library', type: 'movie', exclude: seeds.value.map(mediaKey),
  async load(signal) {
    const responses = await Promise.allSettled(seeds.value.map(item =>
      fetchLibraryRecommendations(item.media_type, item.id, signal)))
    signal.throwIfAborted()
    const pages = responses.filter(result => result.status === 'fulfilled').map(result => result.value)
    if (!pages.length) throw responses[0]?.reason ?? new Error('No recommendations available.')
    return { results: [0, 1, 2, 3].flatMap(index => pages.map(page => page.results[index]).filter(Boolean)) }
  },
}))
function remove(row) {
  if (tab.value === 'progress') library.remove('progress', row.item)
  else library.remove(tab.value, row)
}
</script>
<template>
  <section>
    <h1 class="section-heading">Your Library</h1>
    <p class="section-intro">Browse your saves, playback progress, and recently opened titles on this device.</p>
    <nav class="catalogue-categories" aria-label="Library sections">
      <button v-for="[key, label] in [['watchlist', 'Watchlist'], ['progress', 'Continue Watching'], ['watched', 'Watched'], ['recent', 'Recently Viewed']]" :key="key"
        class="catalogue-page-link" :aria-pressed="tab === key" @click="tab = key">{{ label }}</button>
    </nav>
    <p v-if="library.warning" class="cinema-warning mb-4" role="status">Some Library changes could not be stored. Existing unreadable data is kept intact.</p>
    <div class="mb-5 flex flex-wrap items-end gap-3">
      <label>Media type<select v-model="type" class="catalogue-filter-control mt-1"><option value="all">All titles</option><option value="movie">Movies</option><option value="tv">TV Series and episodes</option></select></label>
      <button v-if="tab === 'recent' && library.recent.length" class="catalogue-page-link" @click="library.clearRecent()">Clear history</button>
      <RouterLink class="catalogue-page-link" :to="{ name: 'favorites' }">Favorites</RouterLink>
      <RouterLink class="catalogue-page-link" :to="{ name: 'calendar' }">Release Calendar</RouterLink>
    </div>
    <ContentState v-if="!entries.length" compact title="Nothing in this section yet" />
    <div v-else class="media-grid">
      <div v-for="row in entries" :key="contentKey(row.item ?? row)" class="min-w-0">
        <RouterLink v-if="Number.isInteger((row.item ?? row).episode)" class="movie-tile__link ui-focus" :to="detailLocation(row.item ?? row)">
          <MediaPoster :path="(row.item ?? row).poster_path" :title="(row.item ?? row).name" />
          <h2 class="movie-tile__title">{{ (row.item ?? row).name }}</h2>
          <p class="movie-tile__meta">{{ (row.item ?? row).seriesTitle }} · S{{ (row.item ?? row).season }} E{{ (row.item ?? row).episode }}</p>
        </RouterLink>
        <MovieCard v-else :movie="row.item ?? row" show-type />
        <div v-if="tab === 'progress'" class="mt-2">
          <progress class="w-full" :value="row.position" :max="row.duration" aria-label="Viewing progress" />
          <RouterLink class="state-action" :to="watchLocation(row.item)">Resume</RouterLink>
        </div>
        <button class="catalogue-page-link mt-2" @click="remove(row)">{{ tab === 'watched' ? 'Mark unwatched' : 'Remove' }}</button>
        <button v-if="tab === 'watched' && library.contains('progress', row)" class="catalogue-page-link mt-2"
          @click="library.resetProgress(row)">Reset progress and watched status</button>
      </div>
    </div>
    <section class="mt-10">
      <h2 class="detail-subheading">Watch here</h2>
      <ul class="flex flex-wrap gap-2">
        <li v-for="item in playbackCatalogue" :key="contentKey(item)">
          <RouterLink class="catalogue-page-link" :to="watchLocation(item)">{{ item.source.title }}{{ item.media_type === 'tv' ? ' · Pioneer One' : '' }}</RouterLink>
        </li>
      </ul>
    </section>
    <div v-if="seeds.length" class="mt-10">
      <CinemaRail v-if="recommendations" :key="personalizationKey" :feed="personalized" />
      <button v-else class="catalogue-page-link" @click="recommendations = true">Show recommendations from your library</button>
    </div>
    <aside class="mt-10 flex flex-wrap items-center gap-3 text-sm cinema-muted" aria-label="Data attribution">
      <a class="ui-focus" href="https://www.themoviedb.org/" target="_blank" rel="noopener"><img src="/tmdb-logo.svg" width="90" alt="TMDB" /></a>
      <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
    </aside>
  </section>
</template>
