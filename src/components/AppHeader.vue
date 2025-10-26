<script setup>
import { RouterLink } from 'vue-router'
import { useSearchStore } from '@/stores/searchStore';

const searchStore = useSearchStore();

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
        
        <input 
          v-model="searchStore.searchQuery"
          type="text" 
          placeholder="Search movies..."
          class="w-full rounded-full bg-gray-700 px-4 py-1.5 text-sm text-white 
            placeholder-gray-400 focus:outline-none focus:ring-2 
            focus:ring-green-500 
            md:w-auto"
        />
      </div>
    </nav>
  </header>
</template>
