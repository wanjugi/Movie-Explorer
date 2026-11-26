<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ContentState from '@/components/ContentState.vue'
import DetailSkeleton from '@/components/DetailSkeleton.vue'
import FavoriteButton from '@/components/FavoriteButton.vue'
import MediaDetailHero from '@/components/MediaDetailHero.vue'
import CastGallery from '@/components/CastGallery.vue'
import TrailerButton from '@/components/TrailerButton.vue'
import { isMediaId } from '@/catalogue/mediaIdentity.js'
import { useRouteRequest } from '@/composables/useRouteRequest.js'
import { fetchMovieById } from '@/services/moviesApi.js'

const route = useRoute()
const router = useRouter()
const id = computed(() => route.name === 'movie-details' && /^[1-9]\d{0,9}$/.test(route.params.id)
  && isMediaId(Number(route.params.id)) ? route.params.id : '')
const { state, retry, retryBlocked } = useRouteRequest(id, (value, signal) => fetchMovieById(value, { signal, throwOnError: true }))
const movie = computed(() => state.value.data)
const year = computed(() => /^\d{4}/.exec(movie.value?.release_date ?? '')?.[0])
const genres = computed(() => Array.isArray(movie.value?.genres) ? movie.value.genres
  .map(genre => genre?.name).filter(name => typeof name === 'string' && name).join(' · ') : '')
const rating = computed(() => movie.value?.vote_count > 0 && movie.value.vote_average >= 0 && movie.value.vote_average <= 10
  ? movie.value.vote_average.toFixed(1) : '')
const runtime = computed(() => Number.isFinite(movie.value?.runtime) && movie.value.runtime > 0 ? movie.value.runtime + ' min' : '')
const cast = computed(() => movie.value?.credits.cast.slice(0, 5) ?? [])
</script>

<template>
  <section :aria-labelledby="movie ? 'movie-detail-heading' : undefined">
    <div class="detail-breadcrumb">
      <button v-if="router.options.history.state.back" type="button" class="catalogue-page-link" @click="router.back()">← Back</button>
      <RouterLink :to="{ name: 'movies' }" class="catalogue-page-link">Movies</RouterLink>
    </div>
    <ContentState v-if="!id" kind="error" title="Invalid movie link" message="Browse Movies to find this title." />
    <DetailSkeleton v-else-if="state.status === 'loading'" label="Loading movie details" />
    <ContentState v-else-if="state.status === 'error'" kind="error"
      :title="state.error.status === 404 ? 'Movie unavailable' : 'Could not load movie details'" :message="state.error.message">
      <template v-if="state.error.retryable" #action>
        <button type="button" class="state-action" :disabled="retryBlocked" @click="retry">Retry</button>
      </template>
    </ContentState>
    <template v-else-if="movie">
      <MediaDetailHero :title="movie.title" :backdrop="movie.backdrop_path" :poster="movie.poster_path"
        kicker="Movie" heading-id="movie-detail-heading">
        <p v-if="movie.tagline" class="mb-3 italic cinema-muted">{{ movie.tagline }}</p>
        <p class="feature-hero__meta">
          <span v-if="year">{{ year }}</span><span v-if="runtime">{{ runtime }}</span><span v-if="genres">{{ genres }}</span>
          <span v-if="rating" class="cinema-rating">★ {{ rating }} / 10 <small>({{ movie.vote_count.toLocaleString() }} votes)</small></span>
        </p>
        <div class="feature-hero__actions">
          <FavoriteButton :item="movie" with-label />
          <TrailerButton type="movie" :id="movie.id" :title="movie.title" />
        </div>
      </MediaDetailHero>
      <section v-if="movie.overview" class="mt-8">
        <h2 class="detail-subheading">Overview</h2>
        <p class="detail-copy">{{ movie.overview }}</p>
      </section>
      <dl v-if="year || runtime" class="detail-facts">
        <div v-if="year"><dt>Release date</dt><dd>{{ movie.release_date }}</dd></div>
        <div v-if="runtime"><dt>Runtime</dt><dd>{{ runtime }}</dd></div>
      </dl>
      <CastGallery :people="cast" />
    </template>
  </section>
</template>
