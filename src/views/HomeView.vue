<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MovieCard from '@/components/MovieCard.vue'
import { useMovieFilters } from '@/composables/useMovieBrowseControls.js'
import { useMovieBrowseResults } from '@/composables/useMovieBrowseResults.js'
import { navigateMovieBrowse } from '@/router/movieBrowseQuery.js'
import { MovieApiError } from '@/services/moviesApi.js'

const route = useRoute()
const router = useRouter()
const { active, results, genres: genreList } = useMovieBrowseResults(route)
const { yearDraft, invalidYear, commitYear, selectGenre, clearFilters } = useMovieFilters(route, router, active)
const selectedGenre = computed({ get: () => active.value.genre, set: selectGenre })
const { state: movies, retryBlocked: moviesRetryBlocked, retry: retryMovies } = results
const { state: genres, retryBlocked: genresRetryBlocked, retry: retryGenres } = genreList
const genreChoices = computed(() => genres.value.data ?? [])
const emptyMessage = computed(() => {
  if (active.value.q) return 'No movies matched your search.'
  if (active.value.genre || active.value.year) return 'No movies matched these filters.'
  return 'No movies are available right now.'
})

function clearSearch() {
  return navigateMovieBrowse(router, { ...active.value, q: '' })
}

function errorMessage(error) {
  return error instanceof MovieApiError ? error.message : 'Movie data could not be loaded. Please try again.'
}
</script>

<template>
    <main class="container mx-auto p-4">
        <h1 class="text-3xl font-bold mb-6 text-black border-b-4 border-green-500 pb-2 break-words">
            {{ active.q ? `Search results for “${active.q}”` : 'Popular Movies' }}
        </h1>

        <div v-if="!active.q" class="flex flex-col sm:flex-row gap-6 mb-6">
            <div>
                <label for="genre" class="block text-sm font-medium text-gray-600">Genre</label>
                <select
                    id="genre"
                    v-model="selectedGenre"
                    class="mt-1 block w-full sm:w-auto rounded-lg bg-gray-600 border-transparent text-white focus:border-green-500 focus:ring-green-500"
                >
                    <option value="">All Genres</option>
                    <option v-if="active.genre && !genreChoices.some(genre => String(genre.id) === active.genre)" :value="active.genre">
                        Genre {{ active.genre }}
                    </option>
                    <option v-for="genre in genreChoices" :key="genre.id" :value="String(genre.id)">
                        {{ genre.name }}
                    </option>
                </select>
                <p v-if="genres.status === 'loading'" class="mt-1 text-sm text-gray-600" role="status">Loading genres…</p>
                <div v-else-if="genres.status === 'error'" class="mt-1 text-sm text-gray-900">
                    <p role="status">Could not load genre choices. {{ errorMessage(genres.error) }}</p>
                    <button
                        v-if="genres.error?.retryable !== false"
                        type="button"
                        :disabled="genresRetryBlocked"
                        class="mt-1 rounded px-2 py-1 font-semibold underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-800 disabled:opacity-60"
                        @click="retryGenres"
                    >Retry genres</button>
                </div>
            </div>
            <div>
                <label for="year" class="block text-sm font-medium text-gray-600">Year</label>
                <input
                    id="year"
                    v-model="yearDraft"
                    type="text"
                    inputmode="numeric"
                    placeholder="e.g., 2024"
                    :aria-invalid="invalidYear || undefined"
                    :aria-describedby="invalidYear ? 'movie-year-error' : undefined"
                    class="mt-1 block w-full sm:w-auto rounded-lg bg-gray-600 border-transparent text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500"
                    @keydown.enter.prevent="commitYear"
                />
                <p v-if="invalidYear" id="movie-year-error" class="mt-1 text-sm text-gray-600">Enter four digits from 1000 to 9999.</p>
            </div>
        </div>

        <p class="text-gray-600" role="status">
            <template v-if="movies.status === 'loading'">Loading movies…</template>
            <template v-else-if="movies.status === 'empty'">
                {{ emptyMessage }}
            </template>
            <span v-else-if="movies.status === 'success'" class="sr-only">
                {{ movies.data.length }} {{ movies.data.length === 1 ? 'movie' : 'movies' }} loaded.
            </span>
        </p>

        <div v-if="movies.status === 'empty'" class="mt-2">
            <button
                v-if="active.q || active.genre || active.year"
                type="button"
                class="rounded px-2 py-1 font-semibold text-gray-900 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-800"
                @click="active.q ? clearSearch() : clearFilters()"
            >{{ active.q ? 'Clear search' : 'Clear filters' }}</button>
        </div>
        <div v-else-if="movies.status === 'error'" class="text-gray-900">
            <p role="alert">{{ errorMessage(movies.error) }}</p>
            <button
                v-if="movies.error?.retryable !== false"
                type="button"
                :disabled="moviesRetryBlocked"
                class="mt-2 rounded px-2 py-1 font-semibold underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-800 disabled:opacity-60"
                @click="retryMovies"
            >Retry movies</button>
        </div>

        <div :aria-busy="movies.status === 'loading'">
            <div v-if="movies.status === 'success'" class="grid grid-cols-2 md:grid-cols-5 gap-6">
                <MovieCard v-for="movie in movies.data" :key="movie.id" :movie="movie" />
            </div>
        </div>
    </main>
</template>
