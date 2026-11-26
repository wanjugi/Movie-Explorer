<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { loadYouTubePlayer } from '@/services/youtubePlayer.js'

const props = defineProps({ video: { type: Object, required: true }, title: String, autoplay: Boolean })
const emit = defineEmits(['invisible'])
const frame = ref(null)
const state = ref('loading')
const query = new URLSearchParams({ enablejsapi: '1', origin: location.origin, playsinline: '1', controls: '1' })
const url = 'https://www.youtube-nocookie.com/embed/' + props.video.key + '?' + query
let player
let readyTimeout
let startTimeout
let visibility
let disposed = false

function failed() {
  if (disposed) return
  clearTimeout(readyTimeout)
  clearTimeout(startTimeout)
  state.value = 'error'
  try { player?.stopVideo() } catch { /* provider unavailable */ }
}

onMounted(async () => {
  readyTimeout = setTimeout(failed, 10_000)
  try {
    const yt = await loadYouTubePlayer()
    if (disposed || state.value === 'error') return
    if (props.autoplay && 'IntersectionObserver' in window) {
      visibility = new IntersectionObserver(entries => {
        if (!disposed && entries.some(entry => entry.intersectionRatio <= 0.5)) emit('invisible')
      }, { threshold: 0.5 })
      visibility.observe(frame.value)
    }
    player = new yt.Player(frame.value, {
      events: {
        onReady({ target }) {
          if (disposed || state.value === 'error') return
          clearTimeout(readyTimeout)
          state.value = 'ready'
          if (!props.autoplay || document.hidden) return
          const rect = frame.value?.getBoundingClientRect()
          const panel = frame.value?.closest('.trailer-preview')?.getBoundingClientRect()
          if (!rect || rect.width < 200 || rect.height < 200 || rect.top < 0 || rect.bottom > innerHeight
              || rect.left < 0 || rect.right > innerWidth || (panel && (rect.top < panel.top || rect.bottom > panel.bottom))) return
          try {
            target.mute()
            target.playVideo()
            startTimeout = setTimeout(() => { if (!disposed && state.value === 'ready') state.value = 'blocked' }, 4500)
          } catch { if (!disposed) state.value = 'blocked' }
        },
        onStateChange({ data }) {
          if (!disposed && state.value !== 'error' && data === yt.PlayerState.PLAYING) {
            clearTimeout(startTimeout)
            state.value = 'playing'
          }
        },
        onAutoplayBlocked() {
          if (disposed || state.value === 'error') return
          clearTimeout(startTimeout)
          state.value = 'blocked'
        },
        onError: failed,
      },
    })
  } catch { failed() }
})

onBeforeUnmount(() => {
  disposed = true
  visibility?.disconnect()
  clearTimeout(readyTimeout)
  clearTimeout(startTimeout)
  try { player?.destroy() } catch { /* the iframe will also unmount */ }
})
</script>

<template>
  <div class="trailer-player" tabindex="-1">
    <div v-if="state !== 'error'" class="trailer-frame">
      <iframe ref="frame" :src="url" :title="video.type + ' for ' + title"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen></iframe>
    </div>
    <p v-if="state === 'loading'" class="trailer-status" role="status">Loading the YouTube player…</p>
    <p v-else-if="state === 'blocked'" class="trailer-status" role="status">Autoplay was unavailable. Press Play in the player.</p>
    <p v-else-if="state === 'error'" class="trailer-status" role="status">This video could not play here. Try opening it on YouTube.</p>
    <a class="shelf-link ui-focus" :href="'https://www.youtube.com/watch?v=' + video.key" target="_blank" rel="noopener">Open on YouTube ↗</a>
  </div>
</template>
