<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  path: { type: String, default: null },
  title: { type: String, default: '' },
  sizes: {
    type: String,
    default: '(min-width: 1536px) 192px, (min-width: 1440px) 239px, (min-width: 1024px) calc(20vw - 50px), (min-width: 768px) calc(25vw - 46px), (min-width: 640px) calc(33.33vw - 48px), calc(50vw - 34px)',
  },
  eager: Boolean,
  landscape: Boolean,
  portrait: Boolean,
  detailStill: Boolean,
})

const failed = ref(false)
const imagePath = computed(() => /^\/[\w.-]+\.(?:jpe?g|png|webp)$/i.test(props.path ?? '') ? props.path : '')
const imageUrl = width => 'https://image.tmdb.org/t/p/w' + width + imagePath.value
const sourceSet = computed(() => (props.portrait ? [45, 185] : props.landscape ? [185, 300] : [185, 342, 500, 780])
  .map(width => imageUrl(width) + ' ' + width + 'w').join(', '))
watch(imagePath, () => { failed.value = false }, { flush: 'sync' })
</script>

<template>
  <div class="media-poster" :class="{ 'media-still': landscape }">
    <picture v-if="imagePath && !failed">
      <source v-if="detailStill && landscape" media="(min-width: 1000px)" :srcset="'https://image.tmdb.org/t/p/original' + imagePath">
      <img
      :key="imagePath"
      :src="imageUrl(portrait ? 185 : landscape ? 300 : 500)"
      :srcset="sourceSet"
      :sizes="sizes"
      :alt="portrait ? '' : landscape ? (title ? title + ' episode still' : 'Episode still') : (title ? title + ' poster' : 'Title poster')"
      :loading="eager ? 'eager' : 'lazy'"
      :width="landscape ? 300 : 500"
      :height="landscape ? 169 : 750"
      decoding="async"
      class="absolute inset-0 h-full w-full object-cover"
      :data-artwork="imagePath"
      @error="event => { if (event.currentTarget.dataset.artwork === imagePath) failed = true }"
      />
    </picture>
    <div v-else class="poster-fallback" :aria-hidden="portrait || undefined">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-8 w-8 cinema-accent">
        <template v-if="portrait">
          <circle cx="12" cy="8" r="3" />
          <path d="M5 20v-2a7 7 0 0 1 14 0v2" />
        </template>
        <template v-else>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 4v16m10-16v16M3 9h4m-4 6h4m10-6h4m-4 6h4m-10-3h10" />
        </template>
      </svg>
      <span v-if="!portrait">{{ landscape ? 'Still unavailable' : 'Poster unavailable' }}</span>
    </div>
  </div>
</template>

<style scoped>
.media-poster.media-still {
  aspect-ratio: 16 / 9;
}
</style>
