<template>
  <footer class="cinema-footer">
    <section aria-label="Credits" class="content-frame flex flex-col gap-3 text-sm sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p class="mb-2 font-semibold cinema-ink">Movie<span class="cinema-accent">Explorer</span></p>
        <p>Made by Ahmed Wanjugi</p>
        <ul aria-label="Technologies" class="mt-1 flex flex-wrap items-center gap-x-3">
          <li><a href="https://vuejs.org/" target="_blank" rel="noopener noreferrer"
            class="ui-focus-dark inline-flex min-h-8 items-center rounded cinema-accent underline-offset-4 hover:underline">Vue.js</a></li>
          <li><a href="https://tailwindcss.com/" target="_blank" rel="noopener noreferrer"
            class="ui-focus-dark inline-flex min-h-8 items-center rounded cinema-accent underline-offset-4 hover:underline">Tailwind CSS</a></li>
          <li><a href="https://pinia.vuejs.org/" target="_blank" rel="noopener noreferrer"
            class="ui-focus-dark inline-flex min-h-8 items-center rounded cinema-accent underline-offset-4 hover:underline">Pinia</a></li>
        </ul>
      </div>

      <div class="flex items-center gap-3">
        <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer"
          aria-label="TMDB" class="ui-focus-dark inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded footer-logo">
          <img src="/tmdb-logo.svg" alt="" width="185" height="133" class="h-auto w-10" />
        </a>
        <p class="max-w-md text-xs leading-5">This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
      </div>
    </section>
  </footer>
</template>
