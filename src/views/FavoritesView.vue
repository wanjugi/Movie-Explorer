<script setup>
import { computed, nextTick, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import ContentState from '@/components/ContentState.vue'
import MovieCard from '@/components/MovieCard.vue'
import { mediaKey } from '@/catalogue/mediaIdentity.js'
import { useFavoritesStore } from '@/stores/favoritesStore'

const favoritesStore = useFavoritesStore()
const route = useRoute()
const type = computed(() => ['movie', 'tv'].includes(route.query.type) ? route.query.type : '')
const entries = computed(() => favoritesStore.favorites.filter(item => !type.value || item.media_type === type.value))
const grid = ref(null)
const heading = ref(null)
async function restoreFavoriteFocus(index, event) {
  if (event.currentTarget !== document.activeElement) return
  await nextTick()
  const buttons = grid.value?.querySelectorAll('.movie-tile__favorite')
  const target = buttons?.[Math.min(index, buttons.length - 1)] ?? heading.value
  target?.focus({ preventScroll: true })
}
</script>

<template>
  <section aria-labelledby="favorites-heading">
    <h1 id="favorites-heading" ref="heading" tabindex="-1" class="section-heading ui-focus">Your Favorites</h1>
    <p class="section-intro">The movies and series you’ve saved, all in one place.</p>
    <nav aria-label="Favorite media types" class="catalogue-categories">
      <RouterLink v-for="[key, label] in [['', 'All favorites'], ['movie', 'Movies'], ['tv', 'TV Series']]" :key="key"
        :to="{ name: 'favorites', query: key ? { type: key } : {} }"
        :aria-current-value="type === key ? 'page' : null"
        :class="type === key ? 'state-action' : 'catalogue-page-link'">{{ label }}</RouterLink>
    </nav>
    <p v-if="favoritesStore.storageWarning" class="mb-4 text-sm font-medium cinema-warning" role="status">
      Browser storage could not be verified. Changes in this session may not persist.
    </p>
    <ContentState v-if="entries.length === 0"
      :title="type === 'movie' ? 'No favorite movies yet' : type === 'tv' ? 'No favorite series yet' : 'No favorites yet'"
      message="Use the heart on a card to save a title here.">
      <template #action>
        <div class="flex flex-wrap justify-center gap-2">
          <RouterLink :to="{ name: 'movies' }" :class="type === 'tv' ? 'catalogue-page-link' : 'state-action'">Browse movies</RouterLink>
          <RouterLink :to="{ name: 'tv' }" :class="type === 'tv' ? 'state-action' : 'catalogue-page-link'">Browse TV series</RouterLink>
        </div>
      </template>
    </ContentState>
    <div v-else ref="grid" class="media-grid">
      <MovieCard v-for="(item, index) in entries" :key="mediaKey(item)" :movie="item" :eager="index < 2" :show-type="!type"
        @favorite-removed="restoreFavoriteFocus(index, $event)" />
    </div>
  </section>
</template>
