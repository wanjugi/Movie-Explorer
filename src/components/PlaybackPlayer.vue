<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { loadYouTubePlayer } from '@/services/youtubePlayer.js'
import { youtubeEmbed } from '@/catalogue/playbackSources.js'
import { createYouTubeResume, isActiveYouTubeAsset } from '@/services/youtubeResume.js'

const props = defineProps({ source: Object, previous: Object, resume: Boolean })
const emit = defineEmits(['progress', 'resume-unavailable'])
const frame = ref(null)
const status = ref('loading')
const url = computed(() => youtubeEmbed(props.source, location.origin))
let player, timer, timeout, resumeTimer
let disposed = false
let played = false
let finished = false
let saved
const resume = props.resume ? createYouTubeResume(props.previous, props.source.asset, () => emit('resume-unavailable')) : null

function stopTimer() { clearInterval(timer); timer = null }
function stopResumeTimer() { clearInterval(resumeTimer); resumeTimer = null }
function save(completed = false) {
  if (!played || !player || !isActiveYouTubeAsset(player, props.source.asset)) return
  try {
    const duration = player.getDuration()
    const position = player.getCurrentTime()
    if (Number.isFinite(duration) && duration > 0 && Number.isFinite(position) && position > 0 && (!resume || resume.settled)) {
      const value = [Math.min(position, duration), duration, completed || finished]
      if (!saved || value.some((part, index) => part !== saved[index])) {
        saved = value
        emit('progress', ...value)
      }
    }
  } catch { /* provider is unavailable */ }
}
function hidden() {
  if (!document.hidden) return
  save()
  stopTimer()
  stopResumeTimer()
  try { player?.pauseVideo() } catch { /* provider is unavailable */ }
}
function fail() {
  if (disposed) return
  save()
  stopTimer()
  stopResumeTimer()
  clearTimeout(timeout)
  status.value = 'error'
  try { player?.destroy() } catch { /* provider is unavailable */ }
  player = undefined
}
onMounted(async () => {
  document.addEventListener('visibilitychange', hidden)
  timeout = setTimeout(fail, 12_000)
  try {
    const youtube = await loadYouTubePlayer()
    if (disposed || status.value === 'error') return
    player = new youtube.Player(frame.value, {
      events: {
        onReady() { if (!disposed) { clearTimeout(timeout); status.value = 'ready' } },
        onError: fail,
        onStateChange({ data, target }) {
          if (disposed || status.value !== 'ready') return
          const states = youtube.PlayerState
          if (data === states.PLAYING) {
            if (document.hidden) { target.pauseVideo(); return }
            finished = false
            played = true
            if (resume && !resume.settled && !resumeTimer) {
              const check = () => {
                resume.update(target)
                if (resume.settled) stopResumeTimer()
              }
              resumeTimer = setInterval(check, 250)
              check()
            }
            stopTimer()
            timer = setInterval(() => save(), 10_000)
          } else if (data === states.PAUSED || data === states.ENDED) {
            finished ||= data === states.ENDED
            stopTimer()
            stopResumeTimer()
            save(finished)
          }
        },
      },
    })
  } catch { fail() }
})
onBeforeUnmount(() => {
  disposed = true
  save()
  stopTimer()
  stopResumeTimer()
  clearTimeout(timeout)
  document.removeEventListener('visibilitychange', hidden)
  try { player?.destroy() } catch { /* provider is unavailable */ }
})
</script>
<template>
  <div>
    <div v-if="url && status !== 'error'" class="trailer-frame">
      <iframe ref="frame" :src="url" :title="source.title + ' – full content'" allow="encrypted-media; fullscreen; picture-in-picture"
        referrerpolicy="strict-origin-when-cross-origin" allowfullscreen />
    </div>
    <p v-if="status === 'loading'" class="trailer-status" role="status">Loading the YouTube player…</p>
    <p v-if="status === 'error'" class="trailer-status" role="alert">This video could not play here. The provider may restrict embedding or playback in your region.</p>
    <a class="shelf-link ui-focus" :href="'https://www.youtube.com/watch?v=' + source.asset" target="_blank" rel="noopener">Open on YouTube ↗</a>
  </div>
</template>
