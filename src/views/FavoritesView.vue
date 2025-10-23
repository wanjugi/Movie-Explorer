<script setup>
import MovieCard from '@/components/MovieCard.vue';
import { useFavoritesStore } from '@/stores/favoritesStore';
const favoritesStore = useFavoritesStore();

</script>

<template>
    <main class="container mx-auto p-4">
        <h1 class="text-3xl font-bold mb-6 text-black border-b-4 border-green-500 pb-2">Favourite Movies</h1>

        <div class="text-gray-400" v-if="favoritesStore.favorites.length === 0">
            No favorite movies found.
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-6" v-else>

            <MovieCard v-for="movie in favoritesStore.favorites" 
                  :key="movie.id" 
                  :movie="movie" 
            />

        </div>
    </main>
</template>