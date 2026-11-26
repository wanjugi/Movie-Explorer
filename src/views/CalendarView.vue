<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { fetchDiscovery } from '@/services/discoveryApi.js'
import { fetchTvResource } from '@/services/tvApi.js'
import { useRouteRequest } from '@/composables/useRouteRequest.js'
import { useLibraryStore } from '@/stores/libraryStore.js'
import { useFavoritesStore } from '@/stores/favoritesStore.js'
import { mediaKey, isTvNumber } from '@/catalogue/mediaIdentity.js'
import CatalogueResults from '@/components/CatalogueResults.vue'
import MovieCard from '@/components/MovieCard.vue'
const route = useRoute()
const library = useLibraryStore()
const favorites = useFavoritesStore()
const type = computed(() => route.query.type === 'tv' ? 'tv' : 'movie')
const page = computed(() => typeof route.query.page === 'string' && /^[1-9]\d{0,2}$/.test(route.query.page) && Number(route.query.page) <= 500 ? Number(route.query.page) : 1)
const offset = computed(() => typeof route.query.window === 'string' && /^-?\d{1,2}$/.test(route.query.window) ? Math.max(-12, Math.min(12, Number(route.query.window))) : 0)
const today = new Date().toISOString().slice(0, 10)
function day(offset) { return new Date(Date.parse(today) + offset * 86400000).toISOString().slice(0, 10) }
const from = computed(() => day(offset.value * 30))
const to = computed(() => day(offset.value * 30 + 29))
function location(media = type.value, span = offset.value, number = 1) {
  return { name: 'calendar', query: { ...(media === 'tv' ? { type: 'tv' } : {}), ...(span ? { window: span } : {}), ...(number > 1 ? { page: number } : {}) } }
}
const key = computed(() => route.name === 'calendar' ? [type.value, from.value, to.value, page.value].join(':') : '')
const request = useRouteRequest(key, (_, signal) => fetchDiscovery(type.value, 'calendar', { from: from.value, to: to.value, page: page.value }, signal),
  { isEmpty: data => data.results.length === 0 })
const tracked = computed(() => [...new Map([...library.watchlist, ...favorites.favorites].filter(item => item.media_type === 'tv')
  .map(item => [mediaKey(item), item])).values()].slice(0, 5))
const expanded = ref(false)
const episodes = useRouteRequest(computed(() => route.name === 'calendar' && expanded.value && type.value === 'tv'
  ? [from.value, to.value, ...tracked.value.map(mediaKey)].join('|') : ''), async (_, signal) => {
  const results = await Promise.allSettled(tracked.value.map(item => fetchTvResource('details', { id: item.id }, signal)))
  signal.throwIfAborted()
  const rows = []
  for (const [index, result] of results.entries()) {
    if (result.status !== 'fulfilled') continue
    const episode = result.value.next_episode_to_air
    if (episode && typeof episode.air_date === 'string' && episode.air_date >= from.value && episode.air_date <= to.value
      && isTvNumber(episode.season_number) && isTvNumber(episode.episode_number)) rows.push({ series: tracked.value[index], episode })
  }
  return { rows: rows.sort((a, b) => a.episode.air_date.localeCompare(b.episode.air_date)), failed: results.some(result => result.status === 'rejected') }
})
</script>
<template>
  <section>
    <h1 class="section-heading">Release Calendar</h1>
    <p class="section-intro">TMDB primary movie release dates and television premieres. Exact dates and schedules can change.</p>
    <nav class="catalogue-categories" aria-label="Calendar media type">
      <RouterLink v-for="[value, label] in [['movie','Movies'],['tv','TV Series']]" :key="value" class="catalogue-page-link"
        :aria-current-value="type === value ? 'page' : null" :to="location(value)">{{ label }}</RouterLink>
    </nav>
    <div class="mb-5 flex flex-wrap items-center gap-2">
      <RouterLink v-if="offset > -12" class="catalogue-page-link" :to="location(type, offset - 1)">Previous 30 days</RouterLink>
      <span>{{ from }} to {{ to }}</span>
      <RouterLink v-if="offset < 12" class="catalogue-page-link" :to="location(type, offset + 1)">Next 30 days</RouterLink>
    </div>
    <CatalogueResults :state="request.state.value" :page="page" :location-for-page="number => location(type, offset, number)" :retry-blocked="request.retryBlocked.value" @retry="request.retry">
      <template #item="{ item, index }">
        <div class="min-w-0">
          <MovieCard :movie="item" :eager="index < 2" />
          <p class="cinema-muted text-sm">{{ item.release_date || item.first_air_date || 'Date unavailable' }}</p>
        </div>
      </template>
    </CatalogueResults>
    <section v-if="type === 'tv'" class="mt-10">
      <h2 class="detail-subheading">Next episodes from saved series</h2>
      <p class="cinema-muted mb-3">Known dates reported by TMDB for up to five saved series. An episode numbered one may be a season premiere.</p>
      <button v-if="!expanded" class="catalogue-page-link" @click="expanded = true">Check saved series</button>
      <p v-else-if="episodes.state.value.status === 'loading'" role="status">Checking known episode dates…</p>
      <template v-else>
        <p v-if="!episodes.state.value.data?.rows.length">No upcoming episode dates are available for this range.</p>
        <p v-if="episodes.state.value.data?.failed" class="cinema-warning">Some saved series could not be checked.</p>
        <ul class="space-y-2">
          <li v-for="{ series, episode } in episodes.state.value.data?.rows ?? []" :key="series.id">
            <RouterLink class="catalogue-page-link" :to="{ name: 'tv-episode', params: { id: series.id, seasonNumber: episode.season_number, episodeNumber: episode.episode_number } }">
              {{ episode.air_date }} · {{ series.name }} · S{{ episode.season_number }} E{{ episode.episode_number }} · {{ episode.name }}
            </RouterLink>
          </li>
        </ul>
      </template>
    </section>
  </section>
</template>
