<script setup>
import CinemaArtwork from './CinemaArtwork.vue'
import MediaPoster from './MediaPoster.vue'

defineProps({
  title: { type: String, required: true },
  kicker: { type: String, required: true },
  headingId: { type: String, required: true },
  backdrop: String,
  poster: String,
  still: String,
  landscape: Boolean,
})
</script>

<template>
  <div class="detail-hero breakout on-art" :class="{ 'detail-hero--still': landscape }">
    <CinemaArtwork :path="backdrop || still" :still="!backdrop && landscape" priority />
    <div class="content-frame detail-hero__grid">
      <MediaPoster :path="landscape ? still : poster" :title="title" :landscape="landscape" :detail-still="landscape"
        :sizes="landscape ? '(min-width: 600px) 48vw, 100vw' : '(min-width: 600px) 240px, 160px'" eager />
      <div class="min-w-0">
        <p class="cinema-kicker"><span></span> {{ kicker }}</p>
        <h1 :id="headingId" class="detail-title">{{ title }}</h1>
        <slot />
      </div>
    </div>
  </div>
</template>
