<script setup>
import { computed, onMounted, onScopeDispose, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import CinemaArtwork from '@/components/CinemaArtwork.vue'
import CinemaRail from '@/components/CinemaRail.vue'
import FavoriteButton from '@/components/FavoriteButton.vue'
import TitleSearch from '@/components/TitleSearch.vue'
import TrailerButton from '@/components/TrailerButton.vue'
import { autoPreview, setAutoPreview, trailerSession } from '@/composables/trailerSession.js'
import { mediaCardData, mediaKey } from '@/catalogue/mediaIdentity.js'
import { useRouteRequest } from '@/composables/useRouteRequest.js'
import { fetchMoviePage } from '@/services/moviesApi.js'
import { fetchTvPage } from '@/services/tvApi.js'

const route = useRoute()
const routeKey = computed(() => route.name === 'home' ? 'home' : '')
const listOptions = { isEmpty: page => page.results.length === 0 }
const movieRequest = useRouteRequest(routeKey, (_, signal) => fetchMoviePage('trending', {}, { signal }), listOptions)
const tvRequest = useRouteRequest(routeKey, (_, signal) => fetchTvPage('trending', {}, signal), listOptions)
const movies = computed(() => movieRequest.state.value.data?.results ?? [])
const television = computed(() => tvRequest.state.value.data?.results ?? [])
const hasArtwork = item => /^\/[\w.-]+\.(?:jpe?g|png|webp)$/i.test(item.backdrop_path ?? '')
  && mediaKey(item) && (item.media_type === 'tv' ? item.name : item.title)?.trim()
const hasOverview = item => typeof item.overview === 'string' && !!item.overview.trim()
const candidates = computed(() => {
  const lists = [movies.value, television.value].map(list => list.filter(hasArtwork)
    .sort((a, b) => Number(hasOverview(b)) - Number(hasOverview(a))))
  const unique = new Map()
  for (let index = 0; index < Math.max(...lists.map(list => list.length)); index++) {
    for (const list of lists) {
      const candidate = list[index]
      if (!candidate) continue
      const key = mediaKey(candidate)
      if (!unique.has(key)) unique.set(key, candidate)
      if (unique.size === 5) return [...unique.values()]
    }
  }
  return [...unique.values()]
})
const activeKey = ref('')
const selected = computed(() => Math.max(0, candidates.value.findIndex(item => mediaKey(item) === activeKey.value)))
const item = computed(() => candidates.value[selected.value])
const media = computed(() => item.value ? mediaCardData(item.value) : null)
const loading = computed(() => !item.value && [movieRequest, tvRequest].some(request => request.state.value.status === 'loading'))
const rating = computed(() => item.value?.vote_count > 0 && Number.isFinite(item.value.vote_average)
  && item.value.vote_average >= 0 && item.value.vote_average <= 10 ? item.value.vote_average.toFixed(1) : '')
const paused = ref(false)
const hovering = ref(false)
const focused = ref(false)
const hidden = ref(true)
const reduced = ref(true)
const hero = ref(null)
const visible = ref(false)
const announcement = ref('')
const trailerOpen = computed(() => Boolean(trailerSession.active.value))
let observer
let query
function visibility() { hidden.value = document.hidden }
function motion() { reduced.value = query.matches }
onMounted(() => {
  query = window.matchMedia('(prefers-reduced-motion: reduce)')
  motion()
  visibility()
  query.addEventListener('change', motion)
  document.addEventListener('visibilitychange', visibility)
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(([entry]) => { visible.value = entry.isIntersecting })
    observer.observe(hero.value)
  } else visible.value = true
})
onScopeDispose(() => {
  query?.removeEventListener('change', motion)
  document.removeEventListener('visibilitychange', visibility)
  observer?.disconnect()
})
function select(index, manual = true) {
  const list = candidates.value
  if (!list.length) return
  const position = (index + list.length) % list.length
  activeKey.value = mediaKey(list[position])
  if (manual) announcement.value = `Featured title ${position + 1} of ${list.length}: ${mediaCardData(list[position]).title}`
}
const stopped = computed(() => paused.value || hovering.value || focused.value || hidden.value || reduced.value || !visible.value || trailerOpen.value)
watch([item, stopped, () => candidates.value.length], (_, __, cleanup) => {
  if (stopped.value || candidates.value.length < 2) return
  const timer = setTimeout(() => select(selected.value + 1, false), 14000)
  cleanup(() => clearTimeout(timer))
})
watch(item, current => { if (current && !activeKey.value) activeKey.value = mediaKey(current) })

const feeds = [
  { title: 'Popular Movies', type: 'movie', category: 'popular' },
  { title: 'Popular TV Series', type: 'tv', category: 'popular' },
  { title: 'Top Rated Movies', type: 'movie', category: 'top-rated', grid: true },
  { title: 'Top Rated TV Series', type: 'tv', category: 'top-rated' },
  { title: 'Coming Soon', type: 'movie', category: 'upcoming' },
  { title: 'On the Air', type: 'tv', category: 'on-the-air' },
]
</script>

<template>
  <div class="cinema-home">
    <section ref="hero" aria-label="Featured titles" aria-roledescription="carousel" class="feature-hero on-art" :class="{ 'feature-hero--paused': stopped }"
      @mouseenter="hovering = true" @mouseleave="hovering = false" @focusin="focused = true"
      @focusout="focused = $event.currentTarget.contains($event.relatedTarget)">
      <CinemaArtwork :path="item?.backdrop_path" priority wide />
      <p class="sr-only" role="status">{{ announcement }}</p>
      <div class="content-frame feature-hero__frame">
        <div class="feature-hero__copy">
          <div v-if="item && media" :key="mediaKey(item)" class="feature-hero__story">
            <p class="cinema-kicker"><span></span> In the spotlight</p>
            <h1>{{ media.title }}</h1>
            <p class="feature-hero__meta">
              <span>{{ media.type === 'tv' ? 'TV Series' : 'Movie' }}</span>
              <span v-if="media.date">{{ media.date.slice(0, 4) }}</span>
              <span v-if="rating" class="cinema-rating" :aria-label="'Rated ' + rating + ' out of 10'">★ {{ rating }}</span>
            </p>
            <p v-if="hasOverview(item)" class="feature-hero__overview">{{ item.overview }}</p>
            <div class="feature-hero__actions">
              <RouterLink :to="media.location" class="state-action">Explore details <span aria-hidden="true">↗</span></RouterLink>
              <FavoriteButton :item="item" with-label />
              <TrailerButton :type="media.type" :id="item.id" :title="media.title" hover-preview />
            </div>
          </div>
          <div v-else-if="loading" class="feature-hero__placeholder">
            <p class="sr-only" role="status">Loading featured titles</p>
            <div aria-hidden="true">
              <div class="cinema-skeleton__line w-36"></div>
              <div class="cinema-skeleton__poster mt-4 h-14 w-4/5 rounded-xl sm:h-20"></div>
              <div class="cinema-skeleton__line mt-5 w-2/3"></div>
              <div class="cinema-skeleton__line mt-4 w-3/4"></div>
              <div class="cinema-skeleton__poster mt-5 h-11 w-40 rounded-lg"></div>
            </div>
          </div>
          <div v-else>
            <p class="cinema-kicker"><span></span> MovieExplorer</p>
            <h1>Find your next favorite.</h1>
            <p class="feature-hero__overview">Explore movies and TV series, from what’s trending to titles worth revisiting.</p>
            <div class="feature-hero__actions">
              <RouterLink :to="{ name: 'movies' }" class="state-action">Browse movies</RouterLink>
              <RouterLink :to="{ name: 'tv' }" class="catalogue-page-link">Browse TV</RouterLink>
            </div>
          </div>
        </div>
        <div v-if="candidates.length > 1" class="feature-controls" aria-label="Featured slides" role="group"
          @keydown.left.prevent="select(selected - 1)" @keydown.right.prevent="select(selected + 1)">
          <button class="cinema-icon" type="button" aria-label="Previous featured title" @click="select(selected - 1)">‹</button>
          <button v-for="(candidate, index) in candidates" :key="mediaKey(candidate)" type="button" class="feature-indicator"
            :aria-label="'Feature ' + mediaCardData(candidate).title" :aria-current="selected === index ? 'true' : undefined"
            @click="select(index)"></button>
          <button class="cinema-icon" type="button" aria-label="Next featured title" @click="select(selected + 1)">›</button>
          <button v-if="!reduced" class="cinema-icon" type="button" :aria-label="paused ? 'Resume rotation' : 'Pause rotation'"
            @click="paused = !paused">{{ paused ? '▷' : 'Ⅱ' }}</button>
        </div>
      </div>
    </section>
    <div class="content-frame home-programme">
      <TitleSearch prominent />
      <label class="preview-preference">
        <input type="checkbox" :checked="autoPreview" @change="setAutoPreview($event.target.checked)">
        <span>Auto-preview trailers <small>On desktop, holding the pointer over Watch trailer may load YouTube.</small></span>
      </label>
      <CinemaRail :feed="{ title: 'Trending Movies', type: 'movie', category: 'trending' }" :featured-request="movieRequest" />
      <CinemaRail :feed="{ title: 'Trending TV Series', type: 'tv', category: 'trending' }" :featured-request="tvRequest" />
      <CinemaRail v-for="feed in feeds" :key="feed.title" :feed="feed" />
    </div>
  </div>
</template>
