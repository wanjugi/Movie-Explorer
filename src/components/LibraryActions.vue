<script setup>
import { useLibraryStore } from '@/stores/libraryStore.js'
defineProps({ item: { type: Object, required: true }, episode: Boolean, watched: Boolean })
const library = useLibraryStore()
</script>

<template>
  <button v-if="!episode" type="button" class="catalogue-page-link" :aria-pressed="library.contains('watchlist', item)"
    @click="library.toggle('watchlist', item)">{{ library.contains('watchlist', item) ? 'In Watchlist' : 'Add to Watchlist' }}</button>
  <button v-if="watched || episode" type="button" class="catalogue-page-link" :aria-pressed="library.contains('watched', item)"
    @click="library.toggle('watched', item)">{{ library.contains('watched', item) ? 'Watched' : 'Mark watched' }}</button>
</template>
