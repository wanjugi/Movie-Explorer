<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import CatalogueResults from '@/components/CatalogueResults.vue'
import ContentState from '@/components/ContentState.vue'
import { useRouteRequest } from '@/composables/useRouteRequest.js'
import { readGlobalSearchQuery, searchLocation } from '@/router/mediaBrowseQuery.js'
import { fetchGlobalPage } from '@/services/tvApi.js'

const route = useRoute()
const active = computed(() => readGlobalSearchQuery(route.query))
const key = computed(() => route.name === 'search' && active.value.q ? JSON.stringify(active.value) : '')
const { state, retry, retryBlocked } = useRouteRequest(key, (value, signal) => {
  const { q, type, page } = JSON.parse(value)
  return fetchGlobalPage(q, type, page, signal)
}, { isEmpty: page => !page.results.length })
const types = [['', 'All titles'], ['movie', 'Movies'], ['tv', 'TV Series']]
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
    <ContentState v-if="!active.q" title="Find a title" message="Enter a movie or series title in the search bar." />
    <CatalogueResults v-else :state="state" :page="Number(active.page ?? 1)" :location-for-page="locationForPage"
      :mixed="!active.type" show-type :retry-blocked="retryBlocked" @retry="retry" />
  </section>
</template>
