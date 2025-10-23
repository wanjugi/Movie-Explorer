<script setup>
import { ref, onMounted, watch } from 'vue';
import { fetchPopularMovies, searchMovies } from '/src/services/moviesApi';
import { useSearchStore } from '@/stores/searchStore';
import MovieCard from '@/components/MovieCard.vue';

const movies = ref([]);
const searchStore = useSearchStore();
const isLoading = ref(false);

// Use onMounted to fetch data when the component is first loaded
onMounted(() => {
    getMovies();
});

async function getMovies() {
    isLoading.value = true;
    if (searchStore.searchQuery.length > 0) {
        // If there is a search, call searchMovies
        movies.value = await searchMovies(searchStore.searchQuery);
    } else {
        // Otherwise, get popular movies
        movies.value = await fetchPopularMovies();
    }
    isLoading.value = false;
}
// Watch for changes in the search query
watch(() =>
    searchStore.searchQuery, // Watch this source
    (newQuery, oldQuery) => {       // Run this callback
        getMovies();
    }
);
</script>

<template>
    <main class="container mx-auto p-4">
        <h1 class="text-3xl font-bold mb-6 text-black border-b-4 border-green-500 pb-2">
            Popular Movies
        </h1>

        <div class="text-gray-400" v-if="movies.length === 0">
            Loading movies...
        </div>

        <div class="grid grid-cols-2 md:grid-cols-5 gap-6" v-else>
            <MovieCard v-for="movie in movies" 
                  :key="movie.id" 
                  :movie="movie" 
            />

        </div>
    </main>
</template>