<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { loadYouTubePlayer } from '@/services/youtubePlayer.js'
import { isActiveYouTubeAsset } from '@/services/youtubeResume.js'
import { youtubeLiveEmbed } from '@/catalogue/liveTvStations.js'

const props = defineProps({ station: { type: Object, required: true }, videoId: { type: String, required: true } })
const emit = defineEmits(['played', 'close', 'failed'])
const frame = ref(null)
const state = ref('Connecting to the broadcaster…')
const url = youtubeLiveEmbed(props.videoId, location.origin)
let player, timer
let disposed = false
let reported = false

function dispose() {
  disposed = true
  clearTimeout(timer)
  try { player?.destroy() } catch { /* Provider may already have removed the frame. */ }
}
function fail(message) {
  if (disposed) return
  dispose()
  emit('failed', message)
}
function onVisibility() {
  if (!document.hidden || disposed) return
  dispose()
  emit('close')
}
onMounted(async () => {
  if (!url) return fail('This broadcast is no longer available in the embedded player.')
  document.addEventListener('visibilitychange', onVisibility)
  timer = setTimeout(() => fail('The broadcaster player did not connect in time.'), 12_000)
  try {
    const youtube = await loadYouTubePlayer()
    if (disposed) return
    player = new youtube.Player(frame.value, { events: {
      onReady() {
        if (disposed) return
        clearTimeout(timer)
        state.value = 'Player ready. Use Play to start the broadcast.'
      },
      onError() { fail('Playback unavailable. The stream may have ended or the provider may restrict playback.') },
      onStateChange({ data, target }) {
        if (disposed) return
        if (data === youtube.PlayerState.ENDED) return fail('This broadcast has ended.')
        if (data !== youtube.PlayerState.PLAYING) return
        if (document.hidden) return onVisibility()
        if (!isActiveYouTubeAsset(target, props.videoId)) return fail('The player changed to a different video.')
        state.value = 'Playing broadcaster video.'
        if (!reported) { reported = true; emit('played') }
      },
    } })
  } catch { fail('The broadcaster player could not be loaded.') }
})
onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisibility)
  if (!disposed) dispose()
})
</script>

<template>
  <div>
    <div class="trailer-frame">
      <iframe v-if="url" ref="frame" :src="url" :title="station.name + ' broadcaster player'"
        allow="encrypted-media; fullscreen; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen />
    </div>
    <p class="trailer-status" role="status">{{ state }}</p>
  </div>
</template>
