<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { filmography } from '@/catalogue/filmography.js'
import { mediaKey } from '@/catalogue/mediaIdentity.js'
import { fetchDiscovery } from '@/services/discoveryApi.js'
import { useRouteRequest } from '@/composables/useRouteRequest.js'
import ContentState from '@/components/ContentState.vue'
import DetailSkeleton from '@/components/DetailSkeleton.vue'
import MediaDetailHero from '@/components/MediaDetailHero.vue'
import MediaPoster from '@/components/MediaPoster.vue'
import MovieCard from '@/components/MovieCard.vue'

const route = useRoute()
const id = computed(() => route.name === 'person' && /^[1-9]\d{0,9}$/.test(route.params.id) && +route.params.id <= 2147483647 ? route.params.id : '')
const { state, retry, retryBlocked } = useRouteRequest(id, (id, signal) => fetchDiscovery('movie', 'person', { id }, signal))
const person = computed(() => state.value.data)
const type = ref('all')
const role = ref('all')
const order = ref('newest')
const count = ref(24)
const items = computed(() => filmography(person.value?.combined_credits, type.value, role.value, order.value))
watch([id, type, role, order], () => { count.value = 24 })
const photos = computed(() => [...new Set((Array.isArray(person.value?.images?.profiles) ? person.value.images.profiles : [])
  .map(item => item?.file_path).filter(path => typeof path === 'string' && path !== person.value.profile_path))].slice(0, 12))
const facts = computed(() => [
  ['Born', person.value?.birthday], ['Place of birth', person.value?.place_of_birth], ['Died', person.value?.deathday],
  ['Also known as', Array.isArray(person.value?.also_known_as) ? person.value.also_known_as.filter(name => typeof name === 'string').join(', ') : ''],
].filter(([, value]) => typeof value === 'string' && value))
</script>
<template>
  <DetailSkeleton v-if="state.status === 'loading'" label="Loading person" />
  <ContentState v-else-if="!id || state.status === 'error'" title="Person unavailable" kind="error" :message="state.error?.message">
    <template v-if="state.error?.retryable" #action><button class="state-action" :disabled="retryBlocked" @click="retry">Retry</button></template>
  </ContentState>
  <div v-else-if="person">
    <MediaDetailHero :title="person.name" :poster="person.profile_path" :kicker="person.known_for_department || 'Person'" heading-id="person-title" portrait />
    <section v-if="person.biography" class="mt-8">
      <h2 class="detail-subheading">Biography</h2>
      <p class="detail-copy whitespace-pre-line">{{ person.biography }}</p>
    </section>
    <dl v-if="facts.length" class="detail-facts"><div v-for="[label, value] in facts" :key="label"><dt>{{ label }}</dt><dd>{{ value }}</dd></div></dl>
    <section class="mt-10">
      <h2 class="detail-subheading">Filmography</h2>
      <div class="mb-5 grid gap-3 sm:grid-cols-3">
        <label>Media type<select v-model="type" class="catalogue-filter-control"><option value="all">Movies and TV</option><option value="movie">Movies</option><option value="tv">TV Series</option></select></label>
        <label>Role<select v-model="role" class="catalogue-filter-control"><option value="all">All credits</option><option v-for="group in ['Acting', 'Directing', 'Writing', 'Production', 'Other crew']" :key="group">{{ group }}</option></select></label>
        <label>Sort<select v-model="order" class="catalogue-filter-control"><option value="newest">Newest release first</option><option value="popular">Most popular</option></select></label>
      </div>
      <ContentState v-if="!items.length" compact title="No matching credits" />
      <div v-else class="media-grid">
        <div v-for="item in items.slice(0, count)" :key="mediaKey(item)">
          <MovieCard :movie="item" show-type level="h3" />
          <p class="movie-tile__meta break-words">{{ [...item.roles].join(' · ') }}</p>
        </div>
      </div>
      <button v-if="items.length > count" type="button" class="catalogue-page-link mt-5" @click="count += 24">Show more credits</button>
    </section>
    <section v-if="photos.length" class="mt-10">
      <h2 class="detail-subheading">Photos</h2>
      <div class="cast-gallery"><MediaPoster v-for="(path, index) in photos" :key="path" :path="path" :title="person.name + ' photo ' + (index + 1)" portrait sizes="128px" /></div>
    </section>
  </div>
</template>
