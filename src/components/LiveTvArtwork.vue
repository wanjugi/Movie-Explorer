<script setup>
import { computed, ref, watch } from 'vue'
import { getStationArtwork } from '@/catalogue/liveTvStations.js'

const props = defineProps({
  station: { type: Object, required: true },
  variant: { type: String, default: 'card' },
  eager: Boolean,
})
const failed = ref(false)
const source = computed(() => getStationArtwork(props.station)?.url)
watch(source, () => { failed.value = false })
</script>

<template>
  <span class="station-art" :class="'station-art--' + variant" aria-hidden="true">
    <img v-if="source && !failed" :src="source" alt="" :loading="eager ? 'eager' : 'lazy'"
      decoding="async" referrerpolicy="strict-origin-when-cross-origin" @error="failed = true">
    <span v-else>{{ station.shortName }}</span>
  </span>
</template>

<style scoped>
.station-art {
  display: grid; place-items: center; aspect-ratio: 16 / 9; overflow: hidden; min-width: 0;
  background: var(--raised); color: var(--ink); border-radius: .75rem; border: 1px solid var(--line);
  text-align: center; font-weight: 750; font-size: clamp(.95rem, 2.1vw, 1.45rem);
}
.station-art img { width: 100%; height: 100%; min-height: 0; object-fit: contain; padding: .55rem; }
.station-art--guide { font-size: .65rem; border-radius: .35rem; }
.station-art--guide img { padding: .1rem; }
.station-art--player { width: min(10rem, 65%); min-height: 4.6rem; background: var(--art-base); color: var(--art-ink); }
.station-art--profile { min-height: 7rem; }
.station-art--history { width: 3.4rem; font-size: .65rem; }
.station-art--history img { padding: .1rem; }
</style>
