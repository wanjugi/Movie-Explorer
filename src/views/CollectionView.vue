<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useRouteRequest } from '@/composables/useRouteRequest.js'
import { fetchDiscovery } from '@/services/discoveryApi.js'
import ContentState from '@/components/ContentState.vue'
import DetailSkeleton from '@/components/DetailSkeleton.vue'
import MediaDetailHero from '@/components/MediaDetailHero.vue'
import MovieCard from '@/components/MovieCard.vue'
const route = useRoute()
const id = computed(() => route.name === 'collection' && /^[1-9]\d{0,9}$/.test(route.params.id) && +route.params.id <= 2147483647 ? route.params.id : '')
const { state, retry, retryBlocked } = useRouteRequest(id, (id, signal) => fetchDiscovery('movie', 'collection', { id }, signal))
const collection = computed(() => state.value.data)
const parts = computed(() => [...(collection.value?.parts ?? [])].sort((a, b) =>
  (a.release_date || '~').localeCompare(b.release_date || '~')))
</script>
<template>
  <DetailSkeleton v-if="state.status === 'loading'" label="Loading collection" />
  <ContentState v-else-if="!id || state.status === 'error'" kind="error" title="Collection unavailable" :message="state.error?.message">
    <template v-if="state.error?.retryable" #action><button class="state-action" :disabled="retryBlocked" @click="retry">Retry</button></template>
  </ContentState>
  <div v-else-if="collection">
    <MediaDetailHero :title="collection.name" :poster="collection.poster_path" :backdrop="collection.backdrop_path" kicker="Collection" heading-id="collection-title" />
    <p v-if="collection.overview" class="detail-copy mt-8">{{ collection.overview }}</p>
    <h2 class="detail-subheading mt-8">Movies by release date</h2>
    <ContentState v-if="!parts.length" compact title="No movies are available in this collection" />
    <div v-else class="media-grid">
      <div v-for="item in parts" :key="item.id">
        <MovieCard :movie="item" level="h3" />
        <p v-if="item.release_date" class="movie-tile__meta">{{ item.release_date }}</p>
      </div>
    </div>
  </div>
</template>
