<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CatalogueResults from '@/components/CatalogueResults.vue'
import ContentState from '@/components/ContentState.vue'
import DiscoveryFilters from '@/components/DiscoveryFilters.vue'
import { TV_FEEDS, TV_FIELDS, TV_SORTS } from '@/catalogue/tvFilters.js'
import { MOVIE_LANGUAGES } from '@/catalogue/movieFilters.js'
import { useRouteRequest } from '@/composables/useRouteRequest.js'
import { readTvBrowseQuery, tvBrowseRequest, tvLocation } from '@/router/mediaBrowseQuery.js'
import { fetchTvGenres, fetchTvPage } from '@/services/tvApi.js'

const route = useRoute()
const router = useRouter()
const active = computed(() => readTvBrowseQuery(route.query))
const category = computed(() => active.value.category ?? 'discover')
const discover = computed(() => category.value === 'discover')
const trending = computed(() => category.value === 'trending')
const key = computed(() => route.name === 'tv' ? JSON.stringify(tvBrowseRequest(active.value)) : '')
const { state, retry, retryBlocked } = useRouteRequest(key, (value, signal) => {
  const [operation, params] = JSON.parse(value)
  return fetchTvPage(operation, params, signal)
}, { isEmpty: page => !page.results.length })
const { state: genres, retry: retryGenres, retryBlocked: genresBlocked } = useRouteRequest(
  computed(() => route.name === 'tv' && discover.value ? 'genres' : ''), (_, signal) => fetchTvGenres(signal),
)
const genreDraft = ref('')
const yearDraft = ref('')
watch(() => active.value.genre, value => { genreDraft.value = value ?? '' }, { immediate: true })
watch(() => active.value.year, value => { yearDraft.value = value ?? '' }, { immediate: true })
const invalidYear = computed(() => !!yearDraft.value && !TV_FIELDS.year[0](yearDraft.value))
const filters = computed(() => {
  const { genre, year, from, to, language, rating, votes, sort } = active.value
  return [
    ['genre', genre && (genres.value.data?.find(option => String(option.id) === genre)?.name ?? 'Genre ' + genre)],
    ['year', year && 'First aired in ' + year], ['from', from && 'From ' + from], ['to', to && 'Through ' + to],
    ['language', language && MOVIE_LANGUAGES[language]], ['rating', rating && 'Rating ≥ ' + rating],
    ['votes', votes && 'Votes ≥ ' + votes], ['sort', sort && TV_SORTS[sort][0]],
  ].filter(([, label]) => label)
})

function commit(patch) {
  const next = readTvBrowseQuery({ ...active.value, ...patch, page: undefined })
  const [, params] = tvBrowseRequest(active.value)
  delete params.page
  if (JSON.stringify([category.value, params]) === JSON.stringify(tvBrowseRequest(next))) return
  return router.push(tvLocation(next))
}

function applyCommon() {
  if (invalidYear.value) return
  const patch = { genre: genreDraft.value, year: yearDraft.value }
  if (patch.year) Object.assign(patch, { from: undefined, to: undefined })
  return commit(patch)
}

function applyAdvanced(values) {
  return commit({ ...values, year: values.from || values.to ? undefined : active.value.year })
}

function reset() {
  genreDraft.value = ''
  yearDraft.value = ''
  if (filters.value.length) return router.push(tvLocation({}))
}

const locationForPage = page => tvLocation({ ...active.value, page: String(page) })
</script>

<template>
  <section aria-labelledby="tv-heading">
    <h1 id="tv-heading" class="section-heading">{{ discover ? 'Discover TV series' : TV_FEEDS[category] + ' TV series' }}</h1>
    <p class="section-intro">Explore series by genre or first-air date, or see what’s airing now.</p>
    <nav aria-label="TV categories" class="catalogue-categories">
      <RouterLink v-for="(label, value) in TV_FEEDS" :key="value"
        :to="tvLocation(value === category ? active : { ...active, category: value, page: undefined, period: undefined })"
        :aria-current-value="category === value ? 'page' : null"
        :class="category === value ? 'state-action' : 'catalogue-page-link'">{{ label }}</RouterLink>
    </nav>
    <div v-if="trending" class="mb-4 flex flex-wrap gap-2">
      <RouterLink v-for="[period, label] in [['week', 'This week'], ['day', 'Today']]" :key="period"
        :to="tvLocation({ ...active, period })" :aria-current-value="(active.period ?? 'week') === period ? 'true' : null"
        :class="(active.period ?? 'week') === period ? 'state-action' : 'catalogue-page-link'">{{ label }}</RouterLink>
    </div>
    <p v-if="!discover" class="mb-4 text-sm cinema-muted">
      Discover filters are paused while browsing this TMDB feed.
      <span v-if="trending">Trending shows one page per period.</span>
    </p>
    <form v-if="discover" class="mb-4 flex flex-wrap items-end gap-3" @submit.prevent="applyCommon">
      <div class="min-w-0 flex-1 sm:max-w-56">
        <label for="tv-genre" class="block text-sm font-medium">
          TV genre <span v-if="genres.status === 'loading'" role="status">Loading…</span>
        </label>
        <select id="tv-genre" v-model="genreDraft" class="catalogue-filter-control">
          <option value="">All genres</option>
          <option v-if="active.genre && !genres.data?.some(genre => String(genre.id) === active.genre)" :value="active.genre">Genre {{ active.genre }}</option>
          <option v-for="genre in genres.data ?? []" :key="genre.id" :value="String(genre.id)">{{ genre.name }}</option>
        </select>
      </div>
      <div class="min-w-0 flex-1 sm:max-w-48">
        <label for="tv-year" class="block text-sm font-medium">First-air year</label>
        <input id="tv-year" v-model.trim="yearDraft" inputmode="numeric" class="catalogue-filter-control"
          placeholder="e.g., 2008" :aria-invalid="invalidYear || undefined"
          :aria-describedby="invalidYear ? 'tv-year-error' : undefined">
      </div>
      <button type="submit" class="state-action" :disabled="invalidYear">Apply</button>
      <p v-if="invalidYear" id="tv-year-error" class="basis-full text-sm" role="status">Enter four digits from 1000 to 9999.</p>
    </form>
    <ContentState v-if="discover && genres.status === 'error'" kind="error" compact
      title="Could not load TV genres" :message="genres.error?.message ?? 'Please try again.'">
      <template v-if="genres.error?.retryable !== false" #action>
        <button type="button" class="state-action" :disabled="genresBlocked" @click="retryGenres">Retry genres</button>
      </template>
    </ContentState>
    <DiscoveryFilters v-if="discover" :active="active" television @apply="applyAdvanced" />
    <div v-if="discover && filters.length" class="mb-4 flex flex-wrap gap-2" aria-label="Active TV discovery filters">
      <button v-for="[field, label] in filters" :key="field" type="button" class="catalogue-page-link"
        :aria-label="'Remove filter: ' + label" @click="commit({ [field]: undefined })">{{ label }} <span aria-hidden="true">×</span></button>
      <button type="button" class="catalogue-page-link" @click="reset">Reset filters</button>
    </div>
    <CatalogueResults :state="state" :page="Number(active.page ?? 1)" :location-for-page="locationForPage"
      empty-title="No TV series found" :single-page="trending" :retry-blocked="retryBlocked" @retry="retry">
      <template v-if="discover && filters.length" #emptyAction>
        <button type="button" class="state-action" @click="reset">Clear filters</button>
      </template>
    </CatalogueResults>
  </section>
</template>
