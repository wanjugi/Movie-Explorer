import { createRouter, createWebHistory } from 'vue-router'
import { DISCOVER_FIELDS } from '../catalogue/movieFilters.js'
import { isMovieBrowseRoute, movieBrowseCriteria, readMovieBrowseQuery } from './movieBrowseQuery.js'
import { readGlobalSearchQuery, readTvBrowseQuery, tvBrowseRequest } from './mediaBrowseQuery.js'

const tvDetail = () => import('../views/TvDetailView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
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

export default router
