<script setup>
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useMovieSearch } from '@/composables/useMovieBrowseControls.js'

const { draft, invalid, submit, clear } = useMovieSearch(useRoute(), useRouter())
const searchInput = ref(null)

function clearAndFocus() {
  clear()
  searchInput.value?.focus()
}
</script>

<template>
  <header class="bg-gray-900 text-white shadow-lg">
    <nav class="container mx-auto flex flex-col gap-4 p-4 md:flex-row md:justify-between">
      <RouterLink :to="{ name: 'home' }" class="text-2xl font-bold text-green-500">
        MovieExplorer
      </RouterLink>

      <div class="flex flex-col gap-4 md:flex-row md:items-center md:space-x-6">
        <RouterLink :to="{ name: 'home' }" class="hover:text-green-400">
          Home
        </RouterLink>
        <RouterLink :to="{ name: 'favorites' }" class="hover:text-green-400">
          Favorites
        </RouterLink>

        <form role="search" @submit.prevent="submit()">
          <div class="flex items-center gap-2">
            <input
              ref="searchInput"
              v-model="draft"
              type="text"
              aria-label="Search movies"
              :aria-invalid="invalid || undefined"
              :aria-describedby="invalid ? 'movie-search-error' : undefined"
              placeholder="Search movies..."
              class="w-full min-w-0 rounded-full bg-gray-700 px-4 py-1.5 text-sm text-white
                placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 md:w-auto"
            />
            <button
              v-if="draft"
              type="button"
              aria-label="Clear movie search"
              class="rounded px-2 py-1 text-sm text-green-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-500"
              @click="clearAndFocus"
            >
              Clear
            </button>
          </div>
          <p v-if="invalid" id="movie-search-error" class="mt-1 text-sm text-white" role="status">
            Use up to 160 characters without control characters.
          </p>
        </form>
      </div>
    </nav>
  </header>
</template>
