import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { movieApiPlugin } from './server/vite-movie-api.js'

// https://vite.dev/config/
export default defineConfig({
  // The client uses only Vite's built-in variables, including BASE_URL.
  envPrefix: [],
  plugins: [
    movieApiPlugin(),
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
