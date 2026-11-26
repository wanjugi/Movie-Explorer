<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { mediaCardData } from '@/catalogue/mediaIdentity.js'
import FavoriteButton from './FavoriteButton.vue'
import MediaPoster from './MediaPoster.vue'

const props = defineProps({
  movie: { type: Object, required: true },
  eager: Boolean,
  showType: Boolean,
  sizes: String,
  level: { type: String, default: 'h2' },
})
defineEmits(['favorite-removed'])

const media = computed(() => mediaCardData(props.movie))
const rating = computed(() => props.movie.vote_count > 0 && Number.isFinite(props.movie.vote_average)
  && props.movie.vote_average >= 0 && props.movie.vote_average <= 10 ? props.movie.vote_average.toFixed(1) : '')
</script>

<template>
  <article class="movie-tile artwork-lift">
    <RouterLink :to="media.location" class="movie-tile__link ui-focus" :aria-label="`Details for ${media.title}`">
      <MediaPoster :path="media.poster" :title="media.title" :eager="eager" :sizes="sizes" />
      <component :is="level" class="movie-tile__title line-clamp-2" :title="media.title">{{ media.title }}</component>
    </RouterLink>
    <div class="movie-tile__meta">
      <span v-if="showType">{{ media.type === 'tv' ? 'TV Series' : 'Movie' }}</span>
      <time v-if="media.date" :datetime="media.date">{{ media.date.slice(0, 4) }}</time>
      <span v-if="rating" class="cinema-rating" :aria-label="'Rated ' + rating + ' out of 10'">★ {{ rating }}</span>
    </div>
    <FavoriteButton :item="movie" class="movie-tile__favorite" @removed="$emit('favorite-removed', $event)" />
  </article>
</template>
