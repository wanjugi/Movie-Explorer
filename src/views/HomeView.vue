<script setup>
import { ref, onMounted, watchEffect } from 'vue';
import { searchMovies, discoverMovies, fetchGenres } from '/src/services/moviesApi';
import { useSearchStore } from '@/stores/searchStore';
import MovieCard from '@/components/MovieCard.vue';

const movies = ref([]);
const searchStore = useSearchStore();
const isLoading = ref(false);
const genres = ref([]);
const selectedGenre = ref('');
const selectedYear = ref('');

// Use onMounted to fetch data when the component is first loaded
onMounted(async () => {
    genres.value = await fetchGenres();
});


// Use watchEffect to automatically react to ALL changes
//    (search, genre, or year)
watchEffect(async () => {
    isLoading.value = true;

    if (searchStore.searchQuery.length > 0) {
        // SEARCH MODE: If the user is searching, call searchMovies
        movies.value = await searchMovies(searchStore.searchQuery);
    } else {
        // DISCOVER MODE: Pass the filter refs to the discover function
        const filters = {
            genre: selectedGenre.value,
            year: selectedYear.value
        };
        movies.value = await discoverMovies(filters);
    }
    isLoading.value = false;
});
</script>

<template>
    <main class="container mx-auto p-4">
        <h1 class="text-3xl font-bold mb-6 text-black border-b-4 border-green-500 pb-2">
            Popular Movies
        </h1>
        
        <div v-if="!searchStore.searchQuery" class="flex flex-col sm:flex-row gap-6 mb-6">
            <div>
                <label for="genre" class="block text-sm font-medium text-gray-600">Genre</label>
                <select v-model="selectedGenre" id="genre" class="mt-1 block w-full sm:w-auto rounded-lg bg-gray-600 border-transparent text-white
             focus:border-green-500 focus:ring-green-500">
                    <option value="">All Genres</option>
                    <option v-for="genre in genres" :key="genre.id" :value="genre.id">
                        {{ genre.name }}
                    </option>
                </select>
            </div>
            <div>
                <label for="year" class="block text-sm font-medium text-gray-600">Year</label>
                <input v-model="selectedYear" type="number" id="year" placeholder="e.g., 2024" class="mt-1 block w-full sm:w-auto rounded-lg bg-gray-600 border-transparent text-white placeholder-gray-400
             focus:border-green-500 focus:ring-green-500" />
            </div>
        </div>

        <div class="text-gray-400" v-if="movies.length === 0">
            Loading movies...
        </div>

        <div class="grid grid-cols-2 md:grid-cols-5 gap-6" v-else>
            <MovieCard v-for="movie in movies" :key="movie.id" :movie="movie" />

        </div>
    </main>
</template>