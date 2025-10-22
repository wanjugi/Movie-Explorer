<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { fetchMovieById } from '/src/services/moviesApi';

// Ref to hold the movie data
const movie = ref(null);

// Get current route information
const route = useRoute();

// Get 'id' parameter from the URL
const movieId = route.params.id;

// Fetch the movie's data when the component loads
onMounted(async () => {
  movie.value = await fetchMovieById(movieId);
});
</script>

<template>
  <main class="container mx-auto p-4">

    <div class="text-center text-lg" v-if="!movie">
      Loading movie details...
    </div>

    <div class="flex flex-col md:flex-row gap-8" v-else>

      <div class="md:w-1/3">
        <img :src="'https://image.tmdb.org/t/p/w500' + movie.poster_path" :alt="movie.title"
          class="rounded-lg shadow-lg w-full">
      </div>

      <div class="md:w-2/3">
        <h1 class="text-4xl font-bold mb-2">{{ movie.title }}</h1>
        <p class="text-gray-400 text-lg mb-4 italic">{{ movie.tagline }}</p>

        <div class="flex items-center mb-4">
          <span class="text-yellow-500 mr-2">
            ★ {{ movie.vote_average.toFixed(1) }} / 10
          </span>
          <span class="text-gray-600">({{ movie.vote_count }} votes)</span>
        </div>

        <p class="mb-4 text-black">{{ movie.overview }}</p>

        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="font-semibold text-gray-600">Release Date:</span>
            <p>{{ movie.release_date }}</p>
          </div>
          <div>
            <span class="font-semibold text-gray-600">Runtime:</span>
            <p>{{ movie.runtime }} minutes</p>
          </div>
          <div class="mt-4">
            <span class="font-semibold text-gray-600">Cast:</span>
            <p>
              <span v-for="actor in movie.credits.cast.slice(0, 5)" :key="actor.id" class="mr-2">
                {{ actor.name }},
              </span>
            </p>
          </div>
        </div>

      </div>
    </div>
  </main>
</template>