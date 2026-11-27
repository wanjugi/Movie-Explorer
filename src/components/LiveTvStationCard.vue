<script setup>
import { stationPlaybackLabel } from '@/catalogue/liveTvStations.js'
import LiveTvFavorite from './LiveTvFavorite.vue'
import LiveTvArtwork from './LiveTvArtwork.vue'

defineProps({ station: { type: Object, required: true } })
</script>

<template>
  <article class="station-card movie-tile artwork-lift">
    <RouterLink class="movie-tile__link ui-focus" :to="{ name: 'live-tv-channel', params: { channelSlug: station.slug }, hash: '#station-player' }">
      <LiveTvArtwork :station="station" />
      <h3 class="movie-tile__title">{{ station.name }}</h3>
    </RouterLink>
    <p class="movie-tile__meta">{{ [station.categories[0], station.languages[0]].filter(Boolean).join(' · ') }}</p>
    <p class="movie-tile__meta">{{ stationPlaybackLabel(station) }}</p>
    <div class="mt-2 flex flex-wrap items-center gap-2">
      <LiveTvFavorite :station="station" />
      <RouterLink class="shelf-link ui-focus" :aria-label="station.name + ' station details'"
        :to="{ name: 'live-tv-about', params: { channelSlug: station.slug } }">Station details</RouterLink>
    </div>
  </article>
</template>

<style scoped>
.movie-tile__meta { display: block; min-height: 1.2em; }
</style>
