<script setup>
import { ref, onMounted } from 'vue';
import { fetchPopularMovies } from '/src/services/moviesApi';
import { RouterLink } from 'vue-router';

// Create a reactive variable to hold the movies
const movies = ref([]);

// Use onMounted to fetch data when the component is first loaded
onMounted(async () => {
    movies.value = await fetchPopularMovies();
    // Add an 'isLiked' property to each movie
    movies.value = movies.value.map(movie => ({
        ...movie, // Keep all the original movie data
        isLiked: false // Add the new property to track its state
    }));
});
</script>

<template>
    <main class="container mx-auto p-4">
        <h1 class="text-3xl font-bold mb-6 text-black">Popular Movies</h1>

        <div class="text-gray-400" v-if="movies.length === 0">
            Loading movies...
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-6" v-else>

            <div class="bg-gray-800 rounded-lg shadow-lg overflow-hidden" v-for="movie in movies" :key="movie.id">
                <img :src="'https://image.tmdb.org/t/p/w500' + movie.poster_path" :alt="movie.title"
                    class="rounded-t-lg w-full" />
                <div class="p-3">
                    <h2 class="mb-2 text-lg text-white font-semibold">{{ movie.title }}</h2>
                    <p class="mb-2 text-sm text-white">Release Date: {{ movie.release_date }}</p>
                    <div class="flex gap-4">
                        <RouterLink :to="{ name: 'movie-details', params: { id: movie.id } }"
                            class="flex-1 rounded-lg bg-green-600 px-4 py-2 text-center font-semibold text-white hover:bg-green-800 text-sm">
                            Details
                        </RouterLink>
                        <button @click="movie.isLiked = !movie.isLiked"
                            class="p-2 rounded-full hover:bg-gray-700 focus:outline-none">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="1.5"
                                stroke="currentColor" class="w-6 h-6 transition-colors duration-200" :class="[
                                    movie.isLiked
                                        ? 'fill-red-500 stroke-red-500'
                                        : 'fill-none text-gray-400 hover:text-white'
                                ]">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

        </div>
    </main>
</template>