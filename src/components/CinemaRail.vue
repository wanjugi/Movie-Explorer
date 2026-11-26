<script setup>
import { computed, onMounted, onScopeDispose, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useRouteRequest } from '@/composables/useRouteRequest.js'
import { fetchMoviePage } from '@/services/moviesApi.js'
import { fetchTvPage } from '@/services/tvApi.js'
import { mediaKey } from '@/catalogue/mediaIdentity.js'
import ContentState from './ContentState.vue'
import MovieCard from './MovieCard.vue'
import MovieCardSkeleton from './MovieCardSkeleton.vue'

const props = defineProps({
  feed: { type: Object, required: true },
  featuredRequest: { type: Object, default: null },
})
const element = ref(null)
const rail = ref(null)
const ready = ref(false)
let observer
onMounted(() => {
  if (props.featuredRequest) return
  if (!('IntersectionObserver' in window)) { ready.value = true; return }
  observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return
    ready.value = true
    observer.disconnect()
  }, { rootMargin: '200px 0px' })
  observer.observe(element.value)
})
onScopeDispose(() => observer?.disconnect())

const request = useRouteRequest(computed(() => ready.value ? props.feed.category : ''), (category, signal) =>
  props.feed.load ? props.feed.load(signal)
    : props.feed.type === 'tv' ? fetchTvPage(category, {}, signal) : fetchMoviePage(category, {}, { signal }),
{ isEmpty: page => page.results.length === 0 })
const active = computed(() => props.featuredRequest ?? request)
const state = computed(() => active.value.state.value)
const items = computed(() => {
  if (!props.feed.load) return (state.value.data?.results ?? []).slice(0, props.feed.grid ? 6 : 10)
  const unique = new Map()
  for (const item of state.value.data?.results ?? []) {
    const key = mediaKey(item)
    if (key && !unique.has(key) && !props.feed.exclude?.includes(key)) unique.set(key, item)
  }
  return [...unique.values()].slice(0, 10)
})
const previous = ref(false)
const next = ref(false)
const canScroll = ref(false)
const railSizes = '(min-width: 1440px) 200px, (min-width: 1100px) 16vw, (min-width: 851px) 18vw, (min-width: 600px) 22vw, 36vw'

function measure() {
  const node = rail.value
  const end = node ? node.scrollWidth - node.clientWidth : 0
  const offset = node?.scrollLeft ?? 0
  canScroll.value = end > 2
  previous.value = offset > 2
  next.value = end - offset > 2
}

watch([rail, items], ([node], _, cleanup) => {
  measure()
  if (!node || props.feed.grid) return
  if (!('ResizeObserver' in window)) {
    window.addEventListener('resize', measure)
    cleanup(() => window.removeEventListener('resize', measure))
    return
  }
  const resize = new ResizeObserver(measure)
  resize.observe(node)
  cleanup(() => resize.disconnect())
}, { flush: 'post' })

function scroll(direction) {
  rail.value?.scrollBy({
    left: direction * rail.value.clientWidth * 0.88,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  })
}
</script>

<template>
  <section ref="element" class="home-shelf" :aria-label="feed.title">
    <div class="shelf-heading">
      <h2>{{ feed.title }}</h2>
      <div class="flex items-center gap-2">
        <RouterLink v-if="!feed.load" :to="{ name: feed.type === 'tv' ? 'tv' : 'movies', query: { category: feed.category } }" class="shelf-link ui-focus"
          :aria-label="'View all ' + feed.title">View all <span aria-hidden="true">↗</span></RouterLink>
        <div v-if="!feed.grid" class="shelf-arrows" :class="{ invisible: !canScroll }" :aria-hidden="!canScroll || undefined">
          <button type="button" class="cinema-icon" :disabled="!previous" :aria-label="'Scroll ' + feed.title + ' left'" @click="scroll(-1)">‹</button>
          <button type="button" class="cinema-icon" :disabled="!next" :aria-label="'Scroll ' + feed.title + ' right'" @click="scroll(1)">›</button>
        </div>
      </div>
    </div>
    <ContentState v-if="state.status === 'error'" compact kind="error" title="This collection is unavailable" :message="state.error?.message">
      <template v-if="state.error?.retryable !== false" #action>
        <button type="button" class="catalogue-page-link" :disabled="active.retryBlocked.value" @click="active.retry">Retry</button>
      </template>
    </ContentState>
    <ContentState v-else-if="state.status === 'empty' || (state.status === 'success' && !items.length)" compact
      title="No titles in this collection right now" />
    <div v-else-if="items.length" ref="rail" class="shelf-resolved" :class="feed.grid ? 'media-grid' : 'cinema-rail'"
      :tabindex="canScroll ? 0 : undefined" :aria-label="feed.grid ? undefined : feed.title + ' titles'" @scroll.passive="measure">
      <MovieCard v-for="(item, index) in items" :key="mediaKey(item)" :movie="item" :eager="!!featuredRequest && index < 2"
        :sizes="feed.grid ? undefined : railSizes" level="h3" />
    </div>
    <div v-else :class="feed.grid ? 'media-grid' : 'cinema-rail'" aria-hidden="true">
      <MovieCardSkeleton v-for="index in 6" :key="index" />
    </div>
    <p class="sr-only" role="status">{{ state.status === 'loading' ? 'Loading ' + feed.title : '' }}</p>
  </section>
</template>
