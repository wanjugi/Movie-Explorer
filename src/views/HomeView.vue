<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import CataloguePagination from '@/components/CataloguePagination.vue'
import ContentState from '@/components/ContentState.vue'
import DiscoveryFilters from '@/components/DiscoveryFilters.vue'
import MovieCardSkeleton from '@/components/MovieCardSkeleton.vue'
import MovieCard from '@/components/MovieCard.vue'
import { DISCOVER_FIELDS, MOVIE_FEEDS, MOVIE_LANGUAGES, MOVIE_SORTS } from '@/catalogue/movieFilters.js'
import { MAX_MOVIE_PAGE } from '@/catalogue/moviePages.js'
import { useMovieFilters, useMovieSearch } from '@/composables/useMovieBrowseControls.js'
import { useMovieBrowseResults } from '@/composables/useMovieBrowseResults.js'
import { movieBrowseLocation, navigateMovieBrowse } from '@/router/movieBrowseQuery.js'
import { MovieApiError } from '@/services/moviesApi.js'

const route = useRoute()
const router = useRouter()
const { draft: movieSearch, invalid: searchInvalid, submit: submitSearch, clear: clearMovieSearch } = useMovieSearch(route, router)
const catalogueLocation = state => movieBrowseLocation(state, route.name === 'movies' ? 'movies' : 'home')
const { active, results, genres: genreList } = useMovieBrowseResults(route)
const { yearDraft, invalidYear, commitYear, selectGenre, clearFilters } = useMovieFilters(route, router, active)
const selectedGenre = computed({ get: () => active.value.genre, set: selectGenre })
const { state: movies, retryBlocked: moviesRetryBlocked, retry: retryMovies } = results
const { state: genres, retryBlocked: genresRetryBlocked, retry: retryGenres } = genreList
const genreChoices = computed(() => genres.value.data ?? [])
const isDiscover = computed(() => !active.value.q && !active.value.category)
const isTrending = computed(() => !active.value.q && active.value.category === 'trending')
const category = computed(() => active.value.category ?? 'discover')
const page = computed(() => Number(active.value.page ?? 1))
const lastPage = computed(() => {
  const data = movies.value.data
  if (!data?.total_results) return 0
  return Math.min(data.total_pages, isTrending.value ? 1 : MAX_MOVIE_PAGE)
})
const recoveryPage = computed(() => {
  const data = movies.value.data
  if (!lastPage.value || (data.page === page.value && page.value <= lastPage.value)) return null
  return page.value > lastPage.value ? lastPage.value : Math.min(data.page, lastPage.value)
})
const heading = computed(() => {
  if (active.value.q) return `Search results for “${active.value.q}”`
  return category.value === 'discover' ? 'Discover movies' : MOVIE_FEEDS[category.value]
})
const activeFilters = computed(() => {
  const state = active.value
  const labels = {
    genre: () => genreChoices.value.find(option => String(option.id) === state.genre)?.name ?? 'Genre ' + state.genre,
    year: () => 'Year ' + state.year,
    from: () => 'From ' + state.from,
    to: () => 'Through ' + state.to,
    language: () => 'Original language: ' + MOVIE_LANGUAGES[state.language],
    rating: () => 'Rating ≥ ' + state.rating,
    votes: () => 'Votes ≥ ' + state.votes,
    runtimeMin: () => 'Runtime ≥ ' + state.runtimeMin + ' min',
    runtimeMax: () => 'Runtime ≤ ' + state.runtimeMax + ' min',
    sort: () => MOVIE_SORTS[state.sort][0],
  }
  return Object.keys(DISCOVER_FIELDS).filter(key => state[key]).map(key => [key, labels[key]()])
})
const emptyMessage = computed(() => {
  if (active.value.q) return 'No movies matched your search.'
  if (isDiscover.value && activeFilters.value.length) return 'No movies matched these filters.'
  return 'No movies are available right now.'
})
const number = new Intl.NumberFormat('en-US')
const resultRange = computed(() => {
  const data = movies.value.data
  const start = (page.value - 1) * 20 + 1
  const end = start + (data?.results.length ?? 0) - 1
  const expected = Math.min(20, (data?.total_results ?? 0) - start + 1)
  return (isDiscover.value || active.value.q) && expected > 0 && data.results.length === expected
    ? `${number.format(start)}–${number.format(end)} shown`
    : `${data?.results.length ?? 0} shown`
})

function locationForPage(target) {
  return catalogueLocation({ ...active.value, page: String(target) })
}

function feedLocation(target) {
  if (target === category.value) return catalogueLocation(active.value)
  return catalogueLocation({ ...active.value, category: target, page: '' })
}

function applyAdvanced(values) {
  return navigateMovieBrowse(router, {
    ...active.value, ...values, year: values.from || values.to ? '' : active.value.year,
  })
}

function removeFilter(key) {
  if (key === 'year') {
    yearDraft.value = ''
    return
  }
  return navigateMovieBrowse(router, { ...active.value, [key]: '' })
}

function clearSearch() {
  return navigateMovieBrowse(router, { ...active.value, q: '' })
}

function errorMessage(error) {
  return error instanceof MovieApiError ? error.message : 'Movie data could not be loaded. Please try again.'
}
</script>

<template>
  <section aria-labelledby="movies-heading">
    <h1 id="movies-heading" class="section-heading">
      {{ heading }}
    </h1>
    <p v-if="!active.q" class="section-intro">Explore the movie catalogue by genre, era, or what’s playing now.</p>

    <form role="search" aria-label="Movie catalogue search" class="mb-4 max-w-md" @submit.prevent="submitSearch()">
      <label for="catalogue-movie-search" class="block text-sm font-medium">Search movies only</label>
      <div class="flex items-end gap-2">
        <input id="catalogue-movie-search" v-model="movieSearch" class="catalogue-filter-control min-w-0 flex-1"
          :aria-invalid="searchInvalid || undefined" :aria-describedby="searchInvalid ? 'catalogue-search-error' : undefined">
        <button class="state-action" type="submit">Search</button>
        <button v-if="movieSearch" class="catalogue-page-link" type="button" @click="clearMovieSearch">Clear</button>
      </div>
      <p v-if="searchInvalid" id="catalogue-search-error" class="text-sm" role="status">Use up to 160 characters without control characters.</p>
    </form>

    <nav v-if="!active.q" aria-label="Movie categories" class="mb-4">
      <ul class="catalogue-categories">
        <li v-for="(label, value) in MOVIE_FEEDS" :key="value">
          <RouterLink
            :to="feedLocation(value)"
            :class="category === value ? 'state-action' : 'catalogue-page-link'"
            :aria-current-value="category === value ? 'page' : null"
          >{{ label }}</RouterLink>
        </li>
      </ul>
    </nav>

    <div v-if="isTrending" class="mb-4 flex flex-wrap items-center gap-2 text-sm">
      <span>Trending period</span>
      <RouterLink v-for="[period, label] in [['week', 'This week'], ['day', 'Today']]" :key="period"
        :to="catalogueLocation({ ...active, period })"
        :aria-current-value="(active.period ?? 'week') === period ? 'true' : null"
        :class="(active.period ?? 'week') === period ? 'state-action' : 'catalogue-page-link'">{{ label }}</RouterLink>
    </div>

    <p v-if="!active.q && !isDiscover" class="mb-4 text-sm cinema-muted">
      This TMDB feed uses its own ranking. Use Discover to filter and sort movies.
      <span v-if="isTrending">Trending shows one page per period.</span>
    </p>

    <div v-if="isDiscover" class="mb-4 grid gap-3 sm:grid-cols-[14rem_12rem] sm:gap-4">
      <div class="min-w-0">
        <label for="genre" class="block text-sm font-medium cinema-ink">
          Genre
          <span v-if="genres.status === 'loading'" class="ml-1 cinema-quiet" role="status">Loading…</span>
        </label>
        <select
          id="genre"
          v-model="selectedGenre"
          class="ui-focus catalogue-select mt-1"
        >
          <option value="">All Genres</option>
          <option v-if="active.genre && !genreChoices.some(genre => String(genre.id) === active.genre)" :value="active.genre">
            Genre {{ active.genre }}
          </option>
          <option v-for="genre in genreChoices" :key="genre.id" :value="String(genre.id)">
            {{ genre.name }}
          </option>
        </select>
        <ContentState
          v-if="genres.status === 'error'"
          kind="error"
          compact
          title="Could not load genre choices"
          :message="errorMessage(genres.error)"
        >
          <template v-if="genres.error?.retryable !== false" #action>
            <button type="button" class="state-action" :disabled="genresRetryBlocked" @click="retryGenres">
              Retry genres
            </button>
          </template>
        </ContentState>
      </div>
      <div>
        <label for="year" class="block text-sm font-medium cinema-ink">Year</label>
        <input
          id="year"
          v-model="yearDraft"
          type="text"
          inputmode="numeric"
          placeholder="e.g., 2024"
          :aria-invalid="invalidYear || undefined"
          :aria-describedby="invalidYear ? 'movie-year-error' : undefined"
          class="catalogue-filter-control mt-1"
          @keydown.enter.prevent="commitYear"
        />
        <p v-if="invalidYear" id="movie-year-error" class="mt-1 text-sm cinema-muted">
          Enter four digits from 1000 to 9999.
        </p>
      </div>
    </div>

    <DiscoveryFilters v-if="isDiscover" :active="active" @apply="applyAdvanced" />

    <div v-if="isDiscover && activeFilters.length" class="mb-4 flex flex-wrap gap-2" aria-label="Active discovery filters">
      <button v-for="[key, label] in activeFilters" :key="key" type="button" class="catalogue-page-link max-w-full"
        :aria-label="'Remove filter: ' + label" @click="removeFilter(key)">
        {{ label }} <span aria-hidden="true" class="ml-1.5">×</span>
      </button>
      <button type="button" class="catalogue-page-link" @click="clearFilters">Reset filters</button>
    </div>

    <p class="sr-only" role="status">
      <template v-if="movies.status === 'loading'">Loading movies…</template>
      <template v-else-if="recoveryPage">This page is no longer available.</template>
      <template v-else-if="movies.status === 'empty'">{{ emptyMessage }}</template>
      <template v-else-if="movies.status === 'success'">
        {{ movies.data.results.length }} movies loaded on page {{ page }}.
      </template>
    </p>

    <ContentState
      v-if="recoveryPage"
      title="This page is no longer available"
      message="The current result set has fewer pages than this link requested."
    >
      <template #action>
        <RouterLink :to="locationForPage(recoveryPage)" :aria-current-value="null" class="state-action">Go to page {{ recoveryPage }}</RouterLink>
      </template>
    </ContentState>

    <ContentState
      v-else-if="movies.status === 'empty'"
      title="No movies found"
      :message="emptyMessage"
    >
      <template v-if="active.q || (isDiscover && activeFilters.length)" #action>
        <button type="button" class="state-action" @click="active.q ? clearSearch() : clearFilters()">
          {{ active.q ? 'Clear search' : 'Clear filters' }}
        </button>
      </template>
    </ContentState>

    <ContentState
      v-else-if="movies.status === 'error'"
      kind="error"
      :title="active.q ? 'Could not load search results' : 'Could not load movies'"
      :message="errorMessage(movies.error)"
    >
      <template v-if="movies.error?.retryable !== false || page > 1" #action>
        <div class="flex flex-wrap justify-center gap-2">
          <button v-if="movies.error?.retryable !== false" type="button" class="state-action"
            :disabled="moviesRetryBlocked" @click="retryMovies">Retry movies</button>
          <RouterLink v-if="page > 1" :to="locationForPage(1)" :aria-current-value="null" class="catalogue-page-link">
            Go to first page
          </RouterLink>
        </div>
      </template>
    </ContentState>

    <div :aria-busy="movies.status === 'loading'">
      <div v-if="movies.status === 'loading'" class="media-grid" aria-hidden="true">
        <MovieCardSkeleton v-for="index in 6" :key="index" />
      </div>
      <div v-else-if="movies.status === 'success' && !recoveryPage">
        <p class="mb-3 text-sm cinema-muted">
          {{ resultRange }} · Page {{ page }} <template v-if="lastPage">of {{ lastPage }}</template>
          · {{ number.format(movies.data.total_results) }} results reported by TMDB
        </p>
        <div class="media-grid">
          <MovieCard
            v-for="(movie, index) in movies.data.results"
            :key="movie.id"
            :movie="movie"
            :eager="index < 2"
          />
        </div>
      </div>
    </div>

    <template v-if="movies.data && !recoveryPage">
      <p v-if="!isTrending && movies.data.total_pages > MAX_MOVIE_PAGE" class="mt-3 text-sm cinema-muted">
        TMDB provides up to {{ MAX_MOVIE_PAGE }} accessible pages per query.
        {{ active.q ? 'Try a more specific title search.' : 'Use Discover filters to reveal more of the catalogue.' }}
      </p>
      <CataloguePagination :page="page" :last="lastPage" :location-for-page="locationForPage" />
    </template>
  </section>
</template>
