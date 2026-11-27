<script setup>
import { RouterLink, useRoute } from 'vue-router'
import TitleSearch from './TitleSearch.vue'
import ThemeToggle from './ThemeToggle.vue'

const route = useRoute()
const links = [['home', 'Home'], ['movies', 'Movies'], ['tv', 'TV Series'], ['live-tv', 'Live TV'], ['favorites', 'Favorites']]
function inSection(name) {
  if (name === 'movies' && route.name === 'movie-details') return true
  if (name === 'tv' && String(route.name).startsWith('tv-')) return true
  if (name === 'live-tv' && String(route.name).startsWith('live-tv-')) return true
  return name === route.name
}
</script>

<template>
  <header class="cinema-header">
    <div class="content-frame cinema-header__inner">
      <RouterLink :to="{ name: 'home' }" class="cinema-brand ui-focus" aria-label="MovieExplorer home">
        <img src="/movie-explorer.svg" width="34" height="34" alt="">
        <span>Movie<span>Explorer</span></span>
      </RouterLink>
      <nav class="cinema-nav" aria-label="Primary">
        <RouterLink v-for="[name, label] in links" :key="name" :to="{ name }" class="ui-focus"
          :class="{ 'cinema-nav__active': inSection(name) }">{{ label }}</RouterLink>
      </nav>
      <TitleSearch class="cinema-header__search" />
      <ThemeToggle />
    </div>
  </header>
</template>

<style scoped>
@media (min-width: 851px) and (max-width: 1120px) {
  .cinema-nav { gap: clamp(.55rem, 1.35vw, 1rem); }
}
@media (max-width: 360px) {
  .cinema-nav > a { font-size: .8rem; }
}
</style>
