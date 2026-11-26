<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { trailerSession } from '@/composables/trailerSession.js'
import { useRouteRequest } from '@/composables/useRouteRequest.js'
import { fetchMovieById } from '@/services/moviesApi.js'
import { fetchTvResource } from '@/services/tvApi.js'
import { contentKey } from '@/catalogue/libraryData.js'
import { detailLocation, sourceFor, watchIdentity, watchLocation } from '@/catalogue/playbackSources.js'
import { useLibraryStore } from '@/stores/libraryStore.js'
import ContentState from '@/components/ContentState.vue'
import PlaybackPlayer from '@/components/PlaybackPlayer.vue'
import TrailerButton from '@/components/TrailerButton.vue'
import LibraryActions from '@/components/LibraryActions.vue'

const route = useRoute()
const library = useLibraryStore()
const identity = computed(() => watchIdentity(route))
const source = computed(() => sourceFor(identity.value))
const key = computed(() => source.value ? contentKey(identity.value) : '')
const started = ref(null)
const resumeUnavailable = ref(false)
const launch = ref(null)
watch([key, trailerSession.active], () => { started.value = null; resumeUnavailable.value = false }, { flush: 'sync' })
const { state } = useRouteRequest(key, (_, signal) => {
  const { media_type, id, season, episode } = identity.value
  return media_type === 'movie' ? fetchMovieById(id, { signal, throwOnError: true })
    : fetchTvResource('episode', { id, season, episode }, signal)
})
const { state: seasonInfo } = useRouteRequest(computed(() => key.value && identity.value.media_type === 'tv'
  ? identity.value.id + ':' + identity.value.season : ''), (_, signal) =>
  fetchTvResource('season', { id: identity.value.id, season: identity.value.season }, signal))
const { state: seriesInfo } = useRouteRequest(computed(() => key.value && identity.value.media_type === 'tv' ? String(identity.value.id) : ''), (id, signal) =>
  fetchTvResource('details', { id }, signal))
const episodeNumbers = computed(() => [...new Set((Array.isArray(seasonInfo.value.data?.episodes) ? seasonInfo.value.data.episodes : [])
  .map(episode => episode?.episode_number).filter(Number.isInteger))].sort((a, b) => a - b))
const neighbours = computed(() => {
  const index = episodeNumbers.value.indexOf(identity.value?.episode)
  if (index < 0) return []
  return [[episodeNumbers.value[index - 1], 'Previous episode'], [episodeNumbers.value[index + 1], 'Next episode']]
    .filter(([episode]) => episode !== undefined).map(([episode, label]) => {
      const neighbour = { ...identity.value, episode }
      return sourceFor(neighbour) ? [watchLocation(neighbour), label] : [detailLocation(neighbour), label]
    })
})
const record = computed(() => {
  const data = state.value.data
  if (!source.value || !identity.value) return null
  return identity.value.media_type === 'movie'
    ? { ...identity.value, title: data?.title || source.value.title, poster_path: data?.poster_path, release_date: data?.release_date }
    : { ...identity.value, name: data?.name || source.value.title, seriesTitle: seriesInfo.value.data?.name,
      poster_path: seriesInfo.value.data?.poster_path, first_air_date: data?.air_date }
})
const previous = computed(() => library.progress.find(row => contentKey(row.item) === key.value
  && row.source === source.value?.asset && !row.completed && row.position > 0 && !library.contains('watched', row.item)))
function start(resume) {
  trailerSession.close(trailerSession.active.value, false)
  started.value = { source: source.value, item: record.value, previous: previous.value, resume }
}
async function closePlayer() {
  started.value = null
  await nextTick()
  launch.value?.focus({ preventScroll: true })
}
const saveProgress = computed(() => {
  const session = started.value
  return (position, duration, completed) => {
    if (session) library.record(session.item, session.source.asset, position, duration, completed)
  }
})
</script>
<template>
  <ContentState v-if="!source" title="This title has no approved playback source" message="Discover titles with authorized full-content playback in the Library.">
    <template #action><RouterLink class="state-action" :to="{ name: 'library' }">Open Library</RouterLink></template>
  </ContentState>
  <section v-else>
    <nav class="detail-breadcrumb" aria-label="Playback navigation">
      <RouterLink class="catalogue-page-link" :to="detailLocation(identity)">← Back to details</RouterLink>
      <template v-if="identity.media_type === 'tv'">
        <RouterLink class="catalogue-page-link" :to="{ name: 'tv-details', params: { id: identity.id } }">Series</RouterLink>
        <RouterLink class="catalogue-page-link" :to="{ name: 'tv-season', params: { id: identity.id, seasonNumber: identity.season } }">Season {{ identity.season }}</RouterLink>
        <RouterLink v-for="[to, label] in neighbours" :key="label" class="catalogue-page-link" :to="to">{{ label }}</RouterLink>
      </template>
    </nav>
    <h1 class="section-heading">{{ record.title || record.name }}</h1>
    <p v-if="identity.media_type === 'tv'" class="section-intro">{{ record.seriesTitle }} · Season {{ identity.season }}, episode {{ identity.episode }}</p>
    <p v-if="state.data?.overview" class="detail-copy mb-6">{{ state.data.overview }}</p>
    <div v-if="!started" class="trailer-placeholder">
      <p>Full {{ source.contentType === 'movie' ? 'movie' : 'episode' }} · Plays through the third-party YouTube player.</p>
      <div class="flex flex-wrap gap-2">
        <button v-if="previous" class="state-action" @click="start(true)">Resume on YouTube player</button>
        <button ref="launch" class="catalogue-page-link" @click="start(false)">{{ previous ? 'Start over' : 'Load YouTube player' }}</button>
      </div>
    </div>
    <div v-else>
      <PlaybackPlayer :key="key" :source="started.source" :previous="started.previous" :resume="started.resume"
        @progress="saveProgress" @resume-unavailable="resumeUnavailable = true" />
      <button type="button" class="catalogue-page-link mt-3" @click="closePlayer">Close player</button>
    </div>
    <p v-if="resumeUnavailable" role="status">The player could not confirm your saved position. You can seek manually using the player controls.</p>
    <p class="mt-4 cinema-muted">{{ source.attribution }} · {{ source.permission }}. Availability can vary by region.</p>
    <a class="shelf-link ui-focus" :href="source.provenance" target="_blank" rel="noopener">Official source ↗</a>
    <div class="mt-4 flex flex-wrap gap-2">
      <LibraryActions :item="record" :episode="identity.media_type === 'tv'" watched />
      <TrailerButton v-if="identity.media_type === 'movie'" type="movie" :id="identity.id" :title="record.title" />
    </div>
  </section>
</template>
