<script setup>
import { computed, nextTick, onMounted, onScopeDispose, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from 'vue-router'
import ContentState from '@/components/ContentState.vue'
import LiveTvFavorite from '@/components/LiveTvFavorite.vue'
import LiveTvPlayer from '@/components/LiveTvPlayer.vue'
import LiveTvArtwork from '@/components/LiveTvArtwork.vue'
import LiveTvStationCard from '@/components/LiveTvStationCard.vue'
import { filterStations, findStation, fixedLiveSource, fixedLiveSources, liveTvStations, playbackChannels, stationPlaybackLabel, viewingLabel, viewingUrl } from '@/catalogue/liveTvStations.js'
import { liveFallback, resolveLiveStation } from '@/services/liveTvApi.js'
import { useLiveTvStore } from '@/stores/liveTvStore.js'
import { trailerSession } from '@/composables/trailerSession.js'

const route = useRoute()
const store = useLiveTvStore()
const groups = [['kenya', 'Kenyan Television'], ['international', 'International Television']]
const regions = [['all', 'All Channels'], ['kenya', 'Kenya'], ['international', 'International']]
const region = ref('all')
const search = ref('')
const category = ref('')
const language = ref('')
const favoritesOnly = ref(false)
const directory = computed(() => filterStations({ region: region.value, search: search.value, category: category.value, language: language.value })
  .filter(item => !favoritesOnly.value || store.favorites.includes(item.slug)))
const options = key => [...new Set(liveTvStations.flatMap(item => item[key]))].sort()
const cats = options('categories')
const languages = options('languages')
const indexStation = findStation(store.last[0]) ?? findStation('ntv-kenya')
const station = computed(() => route.name === 'live-tv' ? indexStation : findStation(route.params.channelSlug))
const about = computed(() => route.name === 'live-tv-about')
const stationSlug = computed(() => station.value?.slug)
const discoverable = computed(() => station.value && station.value.discovery !== false && playbackChannels(station.value).some(Boolean))
const playable = computed(() => !!(discoverable.value || (station.value && fixedLiveSource(station.value))))
const related = computed(() => liveTvStations.filter(item => item !== station.value &&
  (item.categories.some(value => station.value?.categories.includes(value)) ||
    item.languages.some(value => station.value?.languages.includes(value)))).slice(0, 4))
const listed = history => history.map(findStation).filter(Boolean)
const favorites = computed(() => listed(store.favorites).filter(item => directory.value.includes(item)))
const histories = computed(() => [
  { key: 'recent', title: 'Recently Watched', items: listed(store.recent).filter(item => directory.value.includes(item)) },
  { key: 'opened', title: 'Recently Opened', items: listed(store.opened).filter(item => directory.value.includes(item)) },
])
const player = ref(null)
const playerArea = ref(null)
const launch = ref(null)
const guide = ref(null)
const error = ref('')
const checking = ref(false)
const cooldown = ref(false)
const recentArtwork = ref(null)
const shareStatus = ref('')
let sessionNumber = 0
let request, retryTimer
const rejectedByStation = new Map()

const viewingLocation = item => ({ name: 'live-tv-channel', params: { channelSlug: item.slug } })
const aboutLocation = item => ({ name: 'live-tv-about', params: { channelSlug: item.slug } })
function resetPlayer() {
  sessionNumber++
  request?.abort()
  request = undefined
  clearTimeout(retryTimer)
  player.value = null
  checking.value = false
  cooldown.value = false
  error.value = ''
}
onBeforeRouteLeave(resetPlayer)
onBeforeRouteUpdate((to, from) => {
  if (to.name !== from.name || to.params.channelSlug !== from.params.channelSlug) resetPlayer()
})
function onVisibility() { if (document.hidden) resetPlayer() }
onMounted(() => document.addEventListener('visibilitychange', onVisibility))
onScopeDispose(() => {
  document.removeEventListener('visibilitychange', onVisibility)
  resetPlayer()
})
watch(trailerSession.active, incoming => { if (incoming) resetPlayer() }, { flush: 'sync' })
watch([stationSlug, about], ([slug, isAbout]) => {
  shareStatus.value = ''
  if (slug && !isAbout && route.name === 'live-tv-channel') store.remember('last', slug)
}, { immediate: true })
watch(guide, node => {
  const activeRow = node?.querySelector('[aria-current="page"]')
  if (!activeRow) return
  const distance = activeRow.getBoundingClientRect().bottom - node.getBoundingClientRect().bottom
  if (distance > 0) node.scrollTop += distance + 3
}, { flush: 'post' })

const messages = {
  unavailable: 'No live broadcast is currently available.',
  unconfigured: 'Live availability cannot be checked right now.',
  restricted: 'This broadcast is unavailable in your region.',
  unsupported: 'No verified YouTube broadcast is available here.',
  quota: 'Live availability is temporarily limited. Try again later.',
  cooldown: 'Please wait before checking again.',
  upstream: 'Unable to check for a live broadcast right now.',
}
async function activate(failed = '', recovery = false, previousError = '') {
  if (!playable.value || player.value || checking.value || cooldown.value) return
  trailerSession.close(trailerSession.active.value, false)
  error.value = ''
  const slug = stationSlug.value
  const id = ++sessionNumber
  const currentStation = station.value
  const excluded = rejectedByStation.get(slug) ?? new Set()
  rejectedByStation.set(slug, excluded)
  const approved = fixedLiveSources(currentStation)
  let selected = null
  if (discoverable.value) {
    const controller = new AbortController()
    request = controller
    checking.value = true
    let result
    try { result = await resolveLiveStation(slug, controller.signal, failed) }
    catch { result = { status: 'upstream' } }
    if (id !== sessionNumber || stationSlug.value !== slug || controller.signal.aborted) return
    request = undefined
    checking.value = false
    for (const { id } of approved) if (result.rejected?.[id]) excluded.add(id)
    if (result.status === 'live' && result.videoId !== failed) {
      excluded.delete(result.videoId)
      selected = result
    } else {
      const fallback = liveFallback(currentStation, result, excluded)
      if (fallback) selected = { videoId: fallback.id }
    }
    if (!selected) {
      error.value = result.status === 'live' || (result.status === 'unconfigured' && previousError)
        ? previousError || messages.unavailable : messages[result.status]
      if (result.retryAfter > 0) {
        cooldown.value = true
        retryTimer = setTimeout(() => { cooldown.value = false }, result.retryAfter * 1000)
      }
      return
    }
  }
  if (!selected && !discoverable.value) {
    const source = fixedLiveSource(currentStation, [...excluded])
    if (source) selected = { videoId: source.id }
  }
  if (!selected) { error.value = previousError || messages.unavailable; return }
  if (selected.thumbnail && /^https:\/\/i\.ytimg\.com\/vi\/[\w-]{11}\/[\w-]+\.jpg$/.test(selected.thumbnail)) {
    recentArtwork.value = { slug, url: selected.thumbnail, expires: Date.now() + 60_000 }
  }
  player.value = {
    id,
    station: currentStation,
    videoId: selected.videoId,
    title: selected.title,
    kind: selected.kind,
    played: () => { if (player.value?.id === id) store.remember('recent', slug) },
    failed: message => {
      if (player.value?.id !== id) return
      if (approved.some(({ id }) => id === selected.videoId)) excluded.add(selected.videoId)
      player.value = null
      error.value = message
      if (!recovery && discoverable.value) void activate(selected.videoId, true, message)
    },
    hidden: () => { if (player.value?.id === id) resetPlayer() },
  }
  void nextTick(() => playerArea.value?.focus({ preventScroll: true }))
}
async function closePlayer() {
  resetPlayer()
  await nextTick()
  launch.value?.focus({ preventScroll: true })
}
async function share() {
  const url = new URL('/live-tv/' + stationSlug.value, location.origin).href
  try {
    if (navigator.share) await navigator.share({ title: station.value.name, url })
    else { await navigator.clipboard.writeText(url); shareStatus.value = 'Station link copied.' }
  } catch (cause) {
    if (cause?.name !== 'AbortError') shareStatus.value = url
  }
}
</script>

<template>
  <section v-if="about && station">
    <nav class="detail-breadcrumb" aria-label="Station navigation"><RouterLink class="shelf-link ui-focus" :to="{ name: 'live-tv' }">← Live TV</RouterLink></nav>
    <div class="station-profile">
      <LiveTvArtwork :station="station" variant="profile" eager />
      <div>
        <p class="cinema-accent font-semibold">{{ station.country }} · Television</p>
        <h1 class="section-heading">{{ station.name }}</h1>
        <p class="detail-copy">{{ station.description }}</p>
        <div class="station-actions">
          <RouterLink v-if="playable" class="state-action ui-focus" :to="viewingLocation(station)">Watch Live</RouterLink>
          <LiveTvFavorite :station="station" />
          <a v-if="station.website" class="catalogue-page-link" :href="station.website" target="_blank" rel="noopener">Official website ↗</a>
        </div>
      </div>
    </div>
    <dl class="detail-facts">
      <div><dt>Country of origin</dt><dd>{{ station.country }}</dd></div>
      <div v-if="station.broadcaster"><dt>Broadcaster</dt><dd>{{ station.broadcaster }}</dd></div>
      <div v-if="station.headquarters"><dt>Production base</dt><dd>{{ station.headquarters }}</dd></div>
      <div v-if="station.categories.length"><dt>Programming</dt><dd>{{ station.categories.join(', ') }}</dd></div>
      <div v-if="station.languages.length"><dt>Languages</dt><dd>{{ station.languages.join(', ') }}</dd></div>
    </dl>
    <section v-if="station.history" class="mt-8"><h2 class="detail-subheading">History</h2><p class="detail-copy">{{ station.history }}</p></section>
    <section class="mt-8">
      <h2 class="detail-subheading">Official resources</h2>
      <p v-if="station.viewing" class="detail-copy">{{ station.viewing }}</p>
      <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        <li v-if="station.live"><a class="shelf-link ui-focus" :href="station.live" target="_blank" rel="noopener"
          @click="store.remember('opened', station.slug)">Official viewing ↗</a></li>
        <li v-if="station.youtube"><a class="shelf-link ui-focus" :href="station.youtube" target="_blank" rel="noopener">Official YouTube channel ↗</a></li>
        <li v-if="station.schedule"><a class="shelf-link ui-focus" :href="station.schedule" target="_blank" rel="noopener">Official programme schedule ↗</a></li>
      </ul>
      <details class="mt-4">
        <summary class="ui-focus cursor-pointer">Sources · verified {{ station.verified }}</summary>
        <ul class="mt-2 space-y-2">
          <li v-for="link in station.sources" :key="link"><a class="shelf-link ui-focus break-all" :href="link" target="_blank" rel="noopener">{{ link }}</a></li>
        </ul>
      </details>
    </section>
    <section v-if="related.length" class="mt-10">
      <h2 class="detail-subheading">Related stations</h2>
      <div class="station-grid"><LiveTvStationCard v-for="item in related" :key="item.id" :station="item" /></div>
    </section>
  </section>
  <section v-else-if="about && !station">
    <h1 class="section-heading">Station unavailable</h1>
    <RouterLink class="catalogue-page-link" :to="{ name: 'live-tv' }">Explore Live TV</RouterLink>
  </section>
  <section v-else>
    <h1 class="section-heading">Live TV</h1>
    <p class="section-intro">Discover Kenyan and international television, news and entertainment.</p>
    <div class="catalogue-categories" role="group" aria-label="Station region">
      <button v-for="[key, label] in regions" :key="key" type="button" class="catalogue-page-link"
        :aria-pressed="region === key" @click="region = key">{{ label }}</button>
    </div>
    <p v-if="store.warning" class="cinema-warning mb-4" role="status">Some station changes could not be stored on this device.</p>
    <div class="station-layout">
      <div class="min-w-0">
        <div v-if="station">
          <h2 id="station-player" class="detail-subheading">{{ station.name }}</h2>
          <div ref="playerArea" tabindex="-1" class="ui-focus" :aria-label="station.name + ' viewing area'">
            <LiveTvPlayer v-if="player" :key="player.id" :station="player.station" :video-id="player.videoId"
              @played="player.played" @failed="player.failed" @close="player.hidden" />
            <div v-else class="station-screen on-art">
              <img v-if="recentArtwork?.slug === station.slug && recentArtwork.expires > Date.now()" :src="recentArtwork.url" alt=""
                class="station-screen__poster" @error="recentArtwork = null">
              <LiveTvArtwork :station="station" variant="player" eager />
              <p v-if="error" role="alert">{{ error }}</p>
              <p v-else-if="checking" role="status">Checking for a live broadcast…</p>
              <p v-else-if="!playable">{{ station.viewing || 'No verified live broadcast is currently available.' }}</p>
              <button v-if="playable" ref="launch" type="button" class="state-action" :disabled="checking || cooldown" @click="activate()">
                {{ checking ? 'Checking…' : error ? 'Retry player' : 'Watch Live' }}
              </button>
            </div>
          </div>
          <p v-if="player?.title" class="movie-tile__meta">{{ player.kind === 'event' ? 'Live programme' : 'Live broadcast' }} · {{ player.title }}</p>
          <div class="station-actions">
            <button v-if="player" type="button" class="catalogue-page-link" @click="closePlayer">Close player</button>
            <LiveTvFavorite :station="station" />
            <button type="button" class="catalogue-page-link" @click="share">Share station</button>
            <RouterLink class="catalogue-page-link" :to="aboutLocation(station)">Station details</RouterLink>
            <a v-if="viewingUrl(station)" class="shelf-link ui-focus" :href="viewingUrl(station)" target="_blank" rel="noopener"
              @click="store.remember('opened', station.slug)">{{ viewingLabel(station) }} ↗</a>
          </div>
          <p v-if="shareStatus" role="status" class="break-all">{{ shareStatus }}</p>
          <p class="detail-copy mt-3">{{ station.description }}</p>
        </div>
        <ContentState v-else title="Station unavailable" message="Choose another station from the guide." />
      </div>
      <aside aria-labelledby="station-guide" class="station-guide">
        <h2 id="station-guide" class="detail-subheading">Channel guide</h2>
        <label class="block text-sm">Search stations<input v-model="search" class="catalogue-filter-control" type="search"></label>
        <div class="grid grid-cols-2 gap-2 mt-2">
          <label class="min-w-0 text-sm">Category<select v-model="category" class="catalogue-filter-control"><option value="">All categories</option><option v-for="item in cats" :key="item">{{ item }}</option></select></label>
          <label class="min-w-0 text-sm">Language<select v-model="language" class="catalogue-filter-control"><option value="">All languages</option><option v-for="item in languages" :key="item">{{ item }}</option></select></label>
        </div>
        <label class="my-3 flex items-center gap-2 text-sm"><input v-model="favoritesOnly" type="checkbox"> Favorites only</label>
        <p v-if="!directory.length" role="status">No matching stations.</p>
        <nav v-else ref="guide" class="station-guide__list" aria-label="Select a television station">
          <template v-for="[key, label] in groups" :key="key">
            <div v-if="directory.some(item => item.regionGroup === key)">
              <h3 v-if="region === 'all'" class="py-2 text-sm font-semibold">{{ label }}</h3>
              <RouterLink v-for="item in directory.filter(item => item.regionGroup === key)" :key="item.id" :to="viewingLocation(item)"
                class="station-row ui-focus" :class="{ 'station-row--selected': item.slug === stationSlug }"
                :aria-current-value="item.slug === stationSlug ? 'page' : null">
                <LiveTvArtwork :station="item" variant="guide" />
                <span><strong class="block">{{ item.name }}</strong><small>{{ stationPlaybackLabel(item) }}</small></span>
              </RouterLink>
            </div>
          </template>
        </nav>
      </aside>
    </div>
    <section v-if="favorites.length && !favoritesOnly" class="mt-10">
      <h2 class="detail-subheading">Favorite stations</h2>
      <div class="station-grid"><LiveTvStationCard v-for="item in favorites" :key="item.id" :station="item" /></div>
    </section>
    <template v-for="history in histories" :key="history.key">
      <section v-if="history.items.length" class="mt-10">
        <div class="station-actions"><h2 class="detail-subheading">{{ history.title }}</h2>
          <button class="catalogue-page-link" type="button" @click="store.forget(history.key)">Clear {{ history.title.toLowerCase() }}</button>
        </div>
        <ul class="space-y-2">
          <li v-for="item in history.items" :key="item.id" class="flex flex-wrap items-center gap-2">
            <LiveTvArtwork :station="item" variant="history" />
            <RouterLink class="shelf-link ui-focus" :to="viewingLocation(item)">{{ item.name }}</RouterLink>
            <button class="catalogue-page-link" type="button" :aria-label="'Remove ' + item.name + ' from ' + history.title"
              @click="store.forget(history.key, item.slug)">Remove</button>
          </li>
        </ul>
      </section>
    </template>
    <section class="mt-10">
      <h2 class="detail-subheading">Explore television stations</h2>
      <template v-for="[key, label] in groups" :key="key">
        <section v-if="directory.some(item => item.regionGroup === key)" class="mt-6">
          <h3 class="detail-subheading">{{ label }}</h3>
          <div class="station-grid"><LiveTvStationCard v-for="item in directory.filter(item => item.regionGroup === key)" :key="item.id" :station="item" /></div>
        </section>
      </template>
      <ContentState v-if="!directory.length" compact title="No stations match these filters" />
    </section>
  </section>
</template>

<style scoped>
.station-layout { display: grid; gap: clamp(1rem, 3vw, 2rem); }
.station-screen {
  position: relative; isolation: isolate; overflow: hidden;
  display: flex; flex-direction: column; gap: .85rem; align-items: center; justify-content: center;
  text-align: center; width: 100%; aspect-ratio: 16 / 9; min-height: 200px; border-radius: .9rem; padding: 1rem;
  background: var(--art-fallback); color: var(--art-ink);
}
.station-screen__poster { position: absolute; z-index: -1; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .24; }
.station-actions { display: flex; flex-wrap: wrap; gap: .6rem; align-items: center; margin-block: .85rem; }
.station-guide { min-width: 0; padding: 1rem; border: 1px solid var(--line); border-radius: .9rem; background: var(--surface); align-self: start; }
.station-guide__list { max-height: clamp(15rem, 44vw, 29rem); overflow-y: auto; padding: 3px; }
.station-row { display: grid; grid-template-columns: 3.5rem minmax(0, 1fr); align-items: center; gap: .6rem; border-radius: .6rem; padding: .45rem; }
.station-row:hover, .station-row--selected { background: var(--active); color: var(--active-ink); }
.station-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(.9rem, 2vw, 1.6rem); }
.station-profile { display: grid; gap: 1.4rem; align-items: center; background: var(--surface); border: 1px solid var(--line); padding: clamp(1rem, 3vw, 2rem); border-radius: .9rem; }
@media (min-width: 640px) {
  .station-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .station-profile { grid-template-columns: minmax(12rem, 1fr) 3fr; }
}
@media (min-width: 1024px) {
  .station-layout { grid-template-columns: minmax(0, 3fr) minmax(15rem, 1fr); }
  .station-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
@media (min-width: 1280px) { .station-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); } }
@media (max-width: 339px) { .station-grid { grid-template-columns: 1fr; } }
</style>
