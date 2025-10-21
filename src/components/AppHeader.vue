<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <header class="bg-gray-900 text-white shadow-lg">
    <nav class="container mx-auto flex items-center justify-between p-4">
      
      <RouterLink :to="{ name: 'home' }" class="text-2xl font-bold text-green-500">
        MovieExplorer
      </RouterLink>

      <div class="flex items-center space-x-6">
        <RouterLink :to="{ name: 'home' }" class="hover:text-green-400">
          Home
        </RouterLink>
        <RouterLink :to="{ name: 'favorites' }" class="hover:text-green-400">
          Favorites
        </RouterLink>
        
        <input 
          type="text" 
          placeholder="Search movies..."
          class="rounded-full bg-gray-700 px-4 py-1.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
    </nav>
  </header>
</template>