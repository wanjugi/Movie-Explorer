<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { MAX_MOVIE_PAGE } from '@/catalogue/moviePages.js'
import { mediaKey } from '@/catalogue/mediaIdentity.js'
import { MovieApiError } from '@/services/moviesApi.js'
import CataloguePagination from './CataloguePagination.vue'
import ContentState from './ContentState.vue'
import MovieCard from './MovieCard.vue'
import MovieCardSkeleton from './MovieCardSkeleton.vue'

const props = defineProps({
  state: { type: Object, required: true },
  page: { type: Number, required: true },
  locationForPage: { type: Function, required: true },
  emptyTitle: { type: String, default: 'No titles found' },
  mixed: Boolean,
  showType: Boolean,
  singlePage: Boolean,
  retryBlocked: Boolean,
})
defineEmits(['retry'])
const data = computed(() => props.state.data)
const last = computed(() => data.value?.total_results
  ? Math.min(data.value.total_pages, props.singlePage ? 1 : MAX_MOVIE_PAGE) : 0)
const recovery = computed(() => {
  if (!last.value || (data.value.page === props.page && props.page <= last.value)) return null
  return props.page > last.value ? last.value : Math.min(data.value.page, last.value)
})
const message = computed(() => props.state.error instanceof MovieApiError
  ? props.state.error.message : 'The request could not be completed. Please try again.')
</script>

<template>
  <p class="sr-only" role="status">
    <template v-if="state.status === 'loading'">Loading titles…</template>
    <template v-else-if="recovery">This page is no longer available.</template>
    <template v-else-if="state.status === 'empty'">{{ emptyTitle }}</template>
    <template v-else-if="state.status === 'success'">{{ data.results.length }} titles loaded on page {{ page }}.</template>
  </p>
  <ContentState v-if="recovery" title="This page is no longer available" message="The result set has fewer available pages.">
    <template #action>
      <RouterLink :to="locationForPage(recovery)" :aria-current-value="null" class="state-action">Go to page {{ recovery }}</RouterLink>
    </template>
  </ContentState>
  <ContentState v-else-if="state.status === 'error'" kind="error" title="Could not load results" :message="message">
    <template v-if="state.error?.retryable !== false || page > 1" #action>
      <div class="flex flex-wrap justify-center gap-2">
        <button v-if="state.error?.retryable !== false" type="button" class="state-action" :disabled="retryBlocked" @click="$emit('retry')">
          Retry
        </button>
        <RouterLink v-if="page > 1" :to="locationForPage(1)" :aria-current-value="null" class="catalogue-page-link">Go to first page</RouterLink>
      </div>
    </template>
  </ContentState>
  <ContentState v-else-if="state.status === 'empty'" :title="emptyTitle"
    :message="mixed ? 'People and excluded results are omitted. Try a different page or media type.' : 'Try a different search or discovery filter.'">
    <template v-if="$slots.emptyAction" #action><slot name="emptyAction" /></template>
  </ContentState>
  <div :aria-busy="state.status === 'loading'">
    <div v-if="state.status === 'loading'" class="media-grid" aria-hidden="true">
      <MovieCardSkeleton v-for="index in 6" :key="index" />
    </div>
    <div v-else-if="state.status === 'success' && !recovery">
      <p class="mb-3 text-sm cinema-muted">
        {{ data.results.length }} shown · Page {{ page }} <template v-if="last">of {{ last }}</template>
        · {{ data.total_results.toLocaleString('en-US') }} results reported by TMDB
      </p>
      <div class="media-grid">
        <MovieCard v-for="(item, index) in data.results" :key="mediaKey(item)" :movie="item"
          :eager="index < 2" :show-type="showType" />
      </div>
    </div>
  </div>
  <template v-if="data && !recovery">
    <p v-if="mixed" class="mt-3 text-sm cinema-muted">
      TMDB's combined count can include people and other excluded records.
    </p>
    <p v-if="!singlePage && data.total_pages > MAX_MOVIE_PAGE" class="mt-3 text-sm cinema-muted">
      TMDB provides up to {{ MAX_MOVIE_PAGE }} accessible pages per query. Refine your filters or search to explore more titles.
    </p>
    <CataloguePagination :page="page" :last="last" :location-for-page="locationForPage" />
  </template>
</template>
