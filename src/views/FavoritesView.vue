<script setup>
import { useFavoritesStore } from '/src/stores/favoritesStore';
import { RouterLink } from 'vue-router';

const favoritesStore = useFavoritesStore();
</script>

<template>
    <main class="container mx-auto p-4">
        <h1 class="text-3xl font-bold mb-6 text-black border-b-4 border-green-500 pb-2">Favourite Movies</h1>

        <div class="text-gray-400" v-if="favoritesStore.favorites.length === 0">
            No favorite movies found.
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-6" v-else>

            <div class="bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl"
                v-for="movie in favoritesStore.favorites" :key="movie.id">
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
                        <button @click="favoritesStore.toggleFavorite(movie)"
                            class="p-2 rounded-full hover:bg-gray-700 focus:outline-none">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="1.5"
                                stroke="currentColor" class="w-6 h-6 transition-colors duration-200" :class="[
                                    favoritesStore.checkIsFavorite(movie.id)
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