import { createRouter, createWebHistory } from 'vue-router'
import { DISCOVER_FIELDS } from '../catalogue/movieFilters.js'
import { isMovieBrowseRoute, movieBrowseCriteria, readMovieBrowseQuery } from './movieBrowseQuery.js'
import { readGlobalSearchQuery, readTvBrowseQuery, tvBrowseRequest } from './mediaBrowseQuery.js'

const tvDetail = () => import('../views/TvDetailView.vue')
const watchView = () => import('../views/WatchView.vue')
const liveTvView = () => import('../views/LiveTvView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.name === 'live-tv-channel' && to.hash === '#station-player') {
      return { el: '#station-player', top: 12 }
    }
    if (to.name !== from.name || to.path !== from.path) return { top: 0 }
    if (to.name === 'tv' || to.name === 'search') {
      const read = to.name === 'tv' ? readTvBrowseQuery : readGlobalSearchQuery
      const { page, ...criteria } = read(to.query)
      const { page: oldPage, ...oldCriteria } = read(from.query)
      const key = state => JSON.stringify(to.name === 'tv' ? tvBrowseRequest(state) : state)
      if (page !== oldPage && key(criteria) === key(oldCriteria)) {
        return { el: to.name === 'tv' ? '#tv-heading' : '#search-heading', top: 12 }
      }
      return
    }
    if (!isMovieBrowseRoute(to.name)) return
    const next = readMovieBrowseQuery(to.query)
    const previous = readMovieBrowseQuery(from.query)
    if (next.page !== previous.page && movieBrowseCriteria(next) === movieBrowseCriteria(previous)) {
      return { el: '#movies-heading', top: 12 }
    }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/CinemaHomeView.vue')
    },
    { path: '/movies', name: 'movies', component: () => import('../views/HomeView.vue') },
    { path: '/tv', name: 'tv', component: () => import('../views/TvBrowseView.vue') },
    { path: '/search', name: 'search', component: () => import('../views/SearchView.vue') },
    { path: '/person/:id', name: 'person', component: () => import('../views/PersonView.vue') },
    { path: '/collection/:id', name: 'collection', component: () => import('../views/CollectionView.vue') },
    { path: '/library', name: 'library', component: () => import('../views/LibraryView.vue') },
    { path: '/calendar', name: 'calendar', component: () => import('../views/CalendarView.vue') },
    { path: '/live-tv', name: 'live-tv', component: liveTvView },
    { path: '/live-tv/:channelSlug', name: 'live-tv-channel', component: liveTvView },
    { path: '/live-tv/:channelSlug/about', name: 'live-tv-about', component: liveTvView },
    { path: '/watch/movie/:id', name: 'watch-movie', component: watchView },
    { path: '/watch/tv/:id/season/:seasonNumber/episode/:episodeNumber', name: 'watch-episode', component: watchView },
    { path: '/tv/:id', name: 'tv-details', component: tvDetail },
    { path: '/tv/:id/season/:seasonNumber', name: 'tv-season', component: tvDetail },
    { path: '/tv/:id/season/:seasonNumber/episode/:episodeNumber', name: 'tv-episode', component: tvDetail },
    {
      path: '/favorites',
      name: 'favorites',
      // This is a lazy-loaded route
      component: () => import('../views/FavoritesView.vue')
    },
    {
      // This is a dynamic route.
      path: '/movie/:id',
      name: 'movie-details',
      component: () => import('../views/MovieDetailView.vue')
    }
  ],
})

const legacyCatalogueKeys = ['q', 'category', 'period', 'page', ...Object.keys(DISCOVER_FIELDS)]
router.beforeEach(to => {
  if (to.name === 'home' && legacyCatalogueKeys.some(key => Object.hasOwn(to.query, key))) {
    return { name: 'movies', query: to.query, hash: to.hash }
  }
})

const pageTitles = {
  movies: 'Movies', tv: 'TV Series', search: 'Search', favorites: 'Favorites',
  person: 'People', collection: 'Collection', library: 'Your Library', calendar: 'Release Calendar',
  'live-tv': 'Live TV', 'live-tv-channel': 'Live TV', 'live-tv-about': 'Broadcaster Details',
  'movie-details': 'Movie Details', 'tv-details': 'TV Series Details', 'tv-season': 'Season Details',
  'tv-episode': 'Episode Details', 'watch-movie': 'Watch Movie', 'watch-episode': 'Watch Episode',
}
router.afterEach((to, _, failure) => {
  if (failure) return
  const title = pageTitles[to.name]
  document.title = title ? title + ' | MovieExplorer' : 'MovieExplorer — Discover Movies & TV Series'
})

export default router
