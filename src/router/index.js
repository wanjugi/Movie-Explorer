import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
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

export default router
