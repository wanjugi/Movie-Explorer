<script setup>
import { computed } from 'vue'
import { useLiveTvStore } from '@/stores/liveTvStore.js'

const props = defineProps({ station: { type: Object, required: true } })
const store = useLiveTvStore()
const selected = computed(() => store.favorites.includes(props.station.slug))
</script>

<template>
  <button type="button" class="catalogue-page-link ui-focus" :aria-pressed="selected"
    :aria-label="(selected ? 'Remove from station favorites: ' : 'Add to station favorites: ') + station.name"
    @click="store.toggle(station.slug)">
    <span aria-hidden="true" :class="{ selected }">{{ selected ? '♥' : '♡' }}</span>
    <span class="sr-only">{{ selected ? 'Favorited' : 'Favorite' }}</span>
  </button>
</template>

<style scoped>
button { min-width: 2.75rem; }
.selected { color: var(--coral); animation: station-heart var(--motion-lift) var(--ease); display: inline-block; }
@keyframes station-heart { 50% { transform: scale(1.2); } }
@media (prefers-reduced-motion: reduce) { .selected { animation: none; } }
</style>
