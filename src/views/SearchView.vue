<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import CatalogueResults from '@/components/CatalogueResults.vue'
import ContentState from '@/components/ContentState.vue'
import { useRouteRequest } from '@/composables/useRouteRequest.js'
import { readGlobalSearchQuery, searchLocation } from '@/router/mediaBrowseQuery.js'
import { fetchGlobalPage } from '@/services/tvApi.js'
import { fetchDiscovery } from '@/services/discoveryApi.js'
import MediaPoster from '@/components/MediaPoster.vue'

const route = useRoute()
const active = computed(() => readGlobalSearchQuery(route.query))
const key = computed(() => route.name === 'search' && active.value.q ? JSON.stringify(active.value) : '')
const { state, retry, retryBlocked } = useRouteRequest(key, (value, signal) => {
  const { q, type, page } = JSON.parse(value)
  return type === 'people' ? fetchDiscovery('movie', 'person-search', { query: q, ...(page ? { page } : {}) }, signal)
    : fetchGlobalPage(q, type, page, signal)
}, { isEmpty: page => !page.results.length })
const types = [['', 'All titles'], ['movie', 'Movies'], ['tv', 'TV Series'], ['people', 'People']]
const locationForPage = page => searchLocation({ ...active.value, page: String(page) })
</script>

<template>
  <section aria-labelledby="search-heading">
    <h1 id="search-heading" class="section-heading break-words">{{ active.q ? 'Search results for “' + active.q + '”' : 'Search movies and TV series' }}</h1>
    <nav aria-label="Search media types" class="catalogue-categories">
      <RouterLink v-for="[type, label] in types" :key="type"
        :to="searchLocation(type === (active.type ?? '') ? active : { q: active.q, type })"
        :aria-current-value="type === (active.type ?? '') ? 'page' : null"
        :class="type === (active.type ?? '') ? 'state-action' : 'catalogue-page-link'">{{ label }}</RouterLink>
    </nav>
    <ContentState v-if="!active.q" :title="active.type === 'people' ? 'Find a person' : 'Find a title'"
      :message="active.type === 'people' ? 'Enter a name in the search bar.' : 'Enter a movie or series title in the search bar.'" />
    <CatalogueResults v-else :state="state" :page="Number(active.page ?? 1)" :location-for-page="locationForPage"
      :mixed="!active.type" show-type :retry-blocked="retryBlocked" @retry="retry">
      <template v-if="active.type === 'people'" #item="{ item }">
        <article class="movie-tile artwork-lift">
          <RouterLink class="movie-tile__link ui-focus" :to="{ name: 'person', params: { id: item.id } }">
            <MediaPoster :path="item.profile_path" portrait :title="item.name" />
            <h2 class="movie-tile__title">{{ item.name }}</h2>
            <p v-if="item.known_for_department" class="movie-tile__meta">{{ item.known_for_department }}</p>
          </RouterLink>
        </article>
      </template>
    </CatalogueResults>
  </section>
</template>
