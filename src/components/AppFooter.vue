<template>
  <footer class="bg-gray-900 text-gray-400 py-6 text-center px-4">
    <div class="container mx-auto">
      
      <p class="text-sm">
        Made by Ahmed Wanjugi using
      </p>

      <div class="mt-2 flex flex-col gap-1 md:flex-row md:justify-center md:gap-2">
        <a href="https://vuejs.org/" target="_blank"
          class="text-green-500 hover:text-green-400">Vue.js</a>
        
        <span class="hidden md:inline">,</span>

        <a href="https://tailwindcss.com/" target="_blank" 
          class="text-green-500 hover:text-green-400">Tailwind CSS</a>

        <span class="hidden md:inline">,</span>

        <a href="https://pinia.vuejs.org/" target="_blank" 
          class="text-green-500 hover:text-green-400">Pinia</a>
      </div>

      <p class="text-xs mt-4">
        Movie data provided by
        <a href="https://www.themoviedb.org/" target="_blank" class="text-blue-400 hover:text-blue-300">TMDB</a>.
      </p>
    </div>
  </footer>
</template>