<script setup>
import { ref } from 'vue'

const preference = window.movieExplorerTheme
const light = ref(preference?.value === 'light')

function toggle() {
  const theme = light.value ? 'dark' : 'light'
  if (preference) preference.set(theme)
  else document.documentElement.dataset.theme = theme
  light.value = theme === 'light'
}
</script>

<template>
  <button type="button" class="theme-toggle cinema-icon ui-focus" aria-label="Light mode"
    :title="light ? 'Switch to dark mode' : 'Switch to light mode'" :aria-pressed="light" @click="toggle">
    <Transition name="theme-icon" mode="out-in">
      <svg v-if="light" key="moon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6">
        <path d="M20.7 15.1A8.9 8.9 0 0 1 8.9 3.3a9 9 0 1 0 11.8 11.8Z"/>
      </svg>
      <svg v-else key="sun" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6">
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>
      </svg>
    </Transition>
  </button>
</template>
