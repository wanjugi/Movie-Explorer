<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import ContentState from '@/components/ContentState.vue'
import DetailSkeleton from '@/components/DetailSkeleton.vue'
import FavoriteButton from '@/components/FavoriteButton.vue'
import MediaDetailHero from '@/components/MediaDetailHero.vue'
import MediaPoster from '@/components/MediaPoster.vue'
import CastGallery from '@/components/CastGallery.vue'
import TrailerButton from '@/components/TrailerButton.vue'
import ConnectedTitles from '@/components/ConnectedTitles.vue'
import CrewLinks from '@/components/CrewLinks.vue'
import LibraryActions from '@/components/LibraryActions.vue'
import WhereToWatch from '@/components/WhereToWatch.vue'
import { sourceFor, watchLocation } from '@/catalogue/playbackSources.js'
import { useLibraryStore } from '@/stores/libraryStore.js'
import { isTvNumber, readTvRouteParams } from '@/catalogue/mediaIdentity.js'
import { useRouteRequest } from '@/composables/useRouteRequest.js'
import { fetchTvResource } from '@/services/tvApi.js'

const route = useRoute()
const mode = computed(() => ({ 'tv-details': 'details', 'tv-season': 'season', 'tv-episode': 'episode' })[route.name])
const params = computed(() => readTvRouteParams(route.params))
const key = computed(() => {
  const { id, season, episode } = params.value
  if (!mode.value || !id) return ''
  if (mode.value === 'details') return JSON.stringify(['details', { id }])
  if (season === null) return ''
  if (mode.value === 'season') return JSON.stringify(['season', { id, season }])
  return episode === null ? '' : JSON.stringify(['episode', { id, season, episode }])
})

function load(key, signal) {
  const [operation, parameters] = JSON.parse(key)
  return fetchTvResource(operation, parameters, signal)
}

const { state, retry, retryBlocked } = useRouteRequest(key, load)
const data = computed(() => state.value.data)
const parent = useRouteRequest(computed(() => key.value && mode.value !== 'details'
  ? JSON.stringify(['details', { id: params.value.id }]) : ''), load).state
const parentSeason = useRouteRequest(computed(() => key.value && mode.value === 'episode'
  ? JSON.stringify(['season', { id: params.value.id, season: params.value.season }]) : ''), load).state

const series = computed(() => mode.value === 'details' ? data.value : parent.value.data)
const episode = computed(() => mode.value === 'episode')
const season = computed(() => mode.value === 'season')
const seriesDetails = computed(() => mode.value === 'details')
const kind = computed(() => episode.value ? 'episode' : season.value ? 'season' : 'TV series')
const array = value => Array.isArray(value) ? value : []
const text = value => typeof value === 'string' ? value.trim() : ''
const path = value => typeof value === 'string' ? value : null
const count = value => isTvNumber(value) ? value : null
const positive = value => Number.isFinite(value) && value > 0 ? value : null
const names = list => array(list).map(item => text(item?.name)).filter(Boolean).join(', ')
const starring = computed(() => array(data.value?.credits?.cast).slice(0, 12))
function readableCode(value, type) {
  const code = text(value)
  if (!code) return ''
  try { return new Intl.DisplayNames('en', { type, fallback: 'none' }).of(code) || code }
  catch { return code }
}
const countries = list => array(list).map(code => readableCode(code, 'region')).filter(Boolean).join(', ')
const crewCredits = computed(() => array(data.value?.crew))
const seriesCrew = computed(() => array(data.value?.credits?.crew).filter(person => person
  && (person.job === 'Director' || ['Writing', 'Production'].includes(person.department))).slice(0, 20))
const minutes = value => positive(value) ? value + ' min' : ''
const score = item => positive(item?.vote_count) && Number.isFinite(item?.vote_average)
  && item.vote_average >= 0 && item.vote_average <= 10 ? item.vote_average.toFixed(1) + ' / 10' : ''

function numberedEntries(list, field) {
  const entries = new Map()
  for (const item of array(list)) {
    if (isTvNumber(item?.[field]) && !entries.has(item[field])) entries.set(item[field], item)
  }
  return [...entries.values()].sort((a, b) => a[field] - b[field])
}

const seasons = computed(() => numberedEntries(series.value?.seasons, 'season_number'))
const episodes = computed(() => numberedEntries(season.value ? data.value?.episodes : parentSeason.value.data?.episodes, 'episode_number'))
const seasonTitle = (number, name) => Number(number) === 0 ? 'Specials (Season 0)' : text(name) || 'Season ' + number
const heading = computed(() => {
  if (!data.value) return episode.value ? 'Episode details' : season.value ? 'Season details' : 'TV series details'
  if (season.value) return seasonTitle(params.value.season, data.value.name)
  return text(data.value.name) || (episode.value ? 'Episode ' + params.value.episode : 'Untitled series')
})
watch(() => data.value ? heading.value : '', title => {
  if (title) document.title = title + ' | MovieExplorer'
})

const seriesLink = computed(() => ({ name: 'tv-details', params: { id: params.value.id } }))
const seasonLink = (number = params.value.season) => ({
  name: 'tv-season', params: { id: params.value.id, seasonNumber: number },
})
const episodeLink = number => ({
  name: 'tv-episode', params: { id: params.value.id, seasonNumber: params.value.season, episodeNumber: number },
})
const neighbors = computed(() => {
  const numbers = episode.value ? episodes.value.map(item => item.episode_number) : seasons.value.map(item => item.season_number)
  const index = numbers.indexOf(Number(episode.value ? params.value.episode : params.value.season))
  return index < 0 ? [] : [[numbers[index - 1], 'Previous'], [numbers[index + 1], 'Next']]
    .filter(([number]) => number !== undefined)
})
const favorite = computed(() => ({
  media_type: 'tv', id: data.value?.id, name: data.value?.name,
  first_air_date: data.value?.first_air_date, poster_path: path(data.value?.poster_path), vote_average: data.value?.vote_average,
}))
const library = useLibraryStore()
watch(data, value => { if (value && seriesDetails.value) library.visit(favorite.value) })
function episodeRecord(entry) {
  return {
    media_type: 'tv', id: Number(params.value.id), season: Number(params.value.season),
    episode: entry.episode_number, name: entry.name || 'Episode ' + entry.episode_number,
    seriesTitle: series.value?.name, poster_path: series.value?.poster_path, first_air_date: entry.air_date,
  }
}
const episodeItem = computed(() => episode.value && data.value ? episodeRecord(data.value) : null)
const watchedInSeason = computed(() => episodes.value.filter(entry => library.contains('watched', episodeRecord(entry))).length)
function knownSeasonWatched(entry) {
  const count = library.watched.filter(item => item.media_type === 'tv' && item.id === Number(params.value.id)
    && item.season === entry.season_number).length
  return isTvNumber(entry.episode_count) ? Math.min(count, entry.episode_count) : 0
}
const watchedInSeries = computed(() => seasons.value.filter(entry => entry.season_number !== 0)
  .reduce((sum, entry) => sum + knownSeasonWatched(entry), 0))
const facts = computed(() => {
  const item = data.value
  if (!item) return []
  const ratings = [['Average rating', score(item)], ['Votes', count(item.vote_count)]]
  const fields = seriesDetails.value ? [
    ['First aired', text(item.first_air_date)], ['Last aired', text(item.last_air_date)], ['Status', text(item.status)],
    ['Seasons', count(item.number_of_seasons)], ['Episodes', count(item.number_of_episodes)], ['Genres', names(item.genres)],
    ['Original language', readableCode(item.original_language, 'language')], ['Origin countries', countries(item.origin_country)], ['Networks', names(item.networks)],
    ['Episode runtimes', array(item.episode_run_time).map(minutes).filter(Boolean).join(', ')], ...ratings,
  ] : season.value ? [['Season number', Number(params.value.season)], ['Air date', text(item.air_date)],
    ['Available episodes', episodes.value.length]]
    : [['Season number', Number(params.value.season)], ['Episode number', Number(params.value.episode)],
      ['Air date', text(item.air_date)], ['Runtime', minutes(item.runtime)], ...ratings]
  return fields.filter(([, value]) => value !== null && value !== '')
})
const televisionError = computed(() => state.value.error?.status === 404
  ? 'This ' + kind.value + ' could not be found.' : state.value.error?.message ?? 'Please try again.')
const detailKicker = computed(() => {
  if (seriesDetails.value) return 'TV Series'
  const title = text(series.value?.name)
  const context = episode.value ? 'Season ' + params.value.season + ' · Episode ' + params.value.episode
    : Number(params.value.season) === 0 ? 'Specials' : 'Season ' + params.value.season
  return title ? title + ' · ' + context : context
})
</script>

<template>
  <section aria-labelledby="tv-detail-heading">
    <nav aria-label="Television details" class="detail-breadcrumb">
      <RouterLink :to="{ name: 'tv' }" class="catalogue-page-link">TV Series</RouterLink>
      <RouterLink v-if="key && !seriesDetails" :to="seriesLink" class="catalogue-page-link">
        {{ text(series?.name) || 'Back to series' }}
      </RouterLink>
      <RouterLink v-if="key && episode" :to="seasonLink()" class="catalogue-page-link">
        {{ seasonTitle(params.season, parentSeason.data?.name) }}
      </RouterLink>
    </nav>
    <h1 v-if="!data" id="tv-detail-heading" class="section-heading">{{ heading }}</h1>
    <ContentState v-if="!key" kind="error" title="Invalid TV link" message="Check the series, season or episode number." />
    <DetailSkeleton v-else-if="state.status === 'loading'" :label="'Loading ' + kind" :landscape="episode" />
    <ContentState v-else-if="state.status === 'error'" kind="error"
      :title="state.error?.status === 404 ? 'Title unavailable' : 'Could not load ' + kind" :message="televisionError">
      <template v-if="state.error?.retryable !== false" #action>
        <button type="button" class="state-action" :disabled="retryBlocked" @click="retry">Retry</button>
      </template>
    </ContentState>
    <template v-else-if="data">
      <MediaDetailHero :title="heading" :kicker="detailKicker" heading-id="tv-detail-heading" :landscape="episode"
        :backdrop="path(series?.backdrop_path)" :poster="path(data.poster_path)" :still="path(data.still_path)">
        <p v-if="seriesDetails && text(data.original_name) && data.original_name !== data.name" class="mb-2 text-sm cinema-muted">
          {{ data.original_name }}
        </p>
        <p v-if="text(data.tagline)" class="italic cinema-muted">{{ data.tagline }}</p>
        <p class="feature-hero__meta">
          <span v-if="text(data.first_air_date || data.air_date)">{{ data.first_air_date || data.air_date }}</span>
          <span v-if="episode && minutes(data.runtime)">{{ minutes(data.runtime) }}</span>
          <span v-if="seriesDetails && text(data.status)">{{ data.status }}</span>
          <span v-if="score(data)" class="cinema-rating">★ {{ score(data) }}</span>
        </p>
        <div v-if="seriesDetails" class="feature-hero__actions">
          <FavoriteButton :item="favorite" with-label />
          <TrailerButton type="tv" :id="data.id" :title="heading" />
        </div>
      </MediaDetailHero>
      <section v-if="text(data.overview)" class="mt-8">
        <h2 class="detail-subheading">Overview</h2>
        <p class="detail-copy">{{ data.overview }}</p>
      </section>
      <dl v-if="facts.length" class="detail-facts">
        <div v-for="[label, value] in facts" :key="label"><dt>{{ label }}</dt><dd>{{ value }}</dd></div>
      </dl>
      <CastGallery v-if="seriesDetails" :people="starring" heading="Latest-season cast" />
      <CastGallery v-if="episode" :people="array(data.guest_stars)" heading="Guest cast" />
      <CrewLinks v-if="episode" :credits="crewCredits" heading="Episode crew" />
      <CrewLinks v-if="seriesDetails" :credits="array(data.created_by)" heading="Creators" />
      <CrewLinks v-if="seriesDetails" :credits="seriesCrew" heading="Latest-season crew" />
      <div v-if="seriesDetails || episodeItem" class="mt-6 flex flex-wrap gap-2">
        <LibraryActions v-if="seriesDetails" :item="favorite" />
        <LibraryActions v-if="episodeItem" :item="episodeItem" episode />
        <RouterLink v-if="episodeItem && sourceFor(episodeItem)" class="state-action" :to="watchLocation(episodeItem)">Watch episode</RouterLink>
      </div>
      <WhereToWatch v-if="seriesDetails" :key="data.id" type="tv" :id="data.id" />
      <nav v-if="!seriesDetails && neighbors.length" :aria-label="episode ? 'Adjacent episodes' : 'Adjacent seasons'" class="mt-6 flex flex-wrap gap-2">
        <RouterLink v-for="[number, label] in neighbors" :key="number" class="catalogue-page-link"
          :to="episode ? episodeLink(number) : seasonLink(number)">{{ label }} {{ episode ? 'episode' : 'season' }} {{ number }}</RouterLink>
      </nav>
      <section v-if="seriesDetails && seasons.length" aria-labelledby="seasons-heading" class="mt-8">
        <h2 id="seasons-heading" class="detail-subheading">Seasons</h2>
        <p v-if="isTvNumber(data.number_of_episodes) && data.number_of_episodes > 0" class="mb-4 cinema-muted">
          {{ Math.min(watchedInSeries, data.number_of_episodes) }} of {{ data.number_of_episodes }} episodes watched · Specials counted separately
        </p>
        <div class="media-grid">
          <article v-for="entry in seasons" :key="entry.season_number" class="movie-tile artwork-lift">
            <RouterLink :to="seasonLink(entry.season_number)" class="movie-tile__link ui-focus">
              <MediaPoster :path="path(entry.poster_path)" :title="seasonTitle(entry.season_number, entry.name)" />
              <h3 class="movie-tile__title">{{ seasonTitle(entry.season_number, entry.name) }}</h3>
            </RouterLink>
            <p class="movie-tile__meta">
              <span v-if="entry.season_number !== 0">Season {{ entry.season_number }}</span>
              <span v-if="count(entry.episode_count) !== null">{{ entry.episode_count }} episodes</span>
              <span v-if="count(entry.episode_count) > 0">{{ knownSeasonWatched(entry) }} watched</span>
              <span v-if="text(entry.air_date)">{{ entry.air_date.slice(0, 4) }}</span>
            </p>
            <p v-if="text(entry.overview)" class="mt-2 line-clamp-3 break-words text-sm cinema-muted">{{ entry.overview }}</p>
          </article>
        </div>
      </section>
      <section v-if="season" class="mt-8" aria-labelledby="episodes-heading">
        <h2 id="episodes-heading" class="detail-subheading">Episodes</h2>
        <p v-if="episodes.length" class="mb-3 cinema-muted">{{ watchedInSeason }} of {{ episodes.length }} listed episodes watched</p>
        <ContentState v-if="!episodes.length" title="No episodes listed" message="TMDB does not list episodes for this season." />
        <ol v-else class="space-y-4">
          <li v-for="(entry, index) in episodes" :key="entry.episode_number">
            <RouterLink :to="episodeLink(entry.episode_number)" class="episode-row ui-focus rounded-lg"
              :aria-label="'Episode ' + entry.episode_number + (text(entry.name) ? ': ' + entry.name : '')">
              <MediaPoster :path="path(entry.still_path)" :title="text(entry.name)" landscape :eager="index === 0"
                sizes="(min-width: 600px) 272px, 100vw" />
              <div class="min-w-0">
                <p class="episode-kicker">Episode {{ entry.episode_number }}</p>
                <h3>{{ text(entry.name) || 'Episode ' + entry.episode_number }} <span aria-hidden="true" class="cinema-accent">↗</span></h3>
                <p v-if="text(entry.air_date) || minutes(entry.runtime) || score(entry)" class="my-2 text-sm cinema-muted">
                  {{ [text(entry.air_date), minutes(entry.runtime)].filter(Boolean).join(' · ') }}
                  <span v-if="score(entry)" class="cinema-rating"> ★ {{ score(entry) }}</span>
                </p>
                <p v-if="text(entry.overview)" class="detail-copy text-sm">{{ entry.overview }}</p>
              </div>
            </RouterLink>
            <div class="mb-3 flex flex-wrap gap-2">
              <LibraryActions :item="episodeRecord(entry)" episode />
              <RouterLink v-if="sourceFor(episodeRecord(entry))" class="catalogue-page-link" :to="watchLocation(episodeRecord(entry))">Watch episode</RouterLink>
            </div>
          </li>
        </ol>
      </section>
      <ConnectedTitles v-if="seriesDetails" :key="data.id" type="tv" :id="data.id" />
    </template>
  </section>
</template>
