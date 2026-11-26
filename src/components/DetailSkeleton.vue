<script setup>
defineProps({ label: { type: String, required: true }, landscape: Boolean })
</script>

<template>
  <div class="detail-hero" :class="{ 'detail-hero--still': landscape }">
    <p class="sr-only" role="status">{{ label }}</p>
    <div class="detail-hero__grid" aria-hidden="true">
      <div class="media-poster cinema-skeleton__poster" :class="{ 'aspect-video': landscape }"></div>
      <div class="detail-skeleton">
        <div class="cinema-skeleton__line w-1/4"></div>
        <div class="cinema-skeleton__line !h-8 w-3/4"></div>
        <div class="cinema-skeleton__line w-1/3"></div>
        <div class="cinema-skeleton__line w-5/6"></div>
        <div class="cinema-skeleton__line w-2/3"></div>
      </div>
    </div>
  </div>
</template>
