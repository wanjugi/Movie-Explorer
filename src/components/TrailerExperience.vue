<script setup>
import { computed, nextTick, onMounted, onScopeDispose, ref } from 'vue'
import { trailerSession } from '@/composables/trailerSession.js'
import { useLatestRequest } from '@/composables/useLatestRequest.js'
import { lookupTrailers } from '@/services/trailerLookup.js'
import TrailerPlayer from './TrailerPlayer.vue'

const props = defineProps({ session: { type: Object, required: true } })
const shell = ref(null)
const previewTop = ref(null)
const selected = ref(0)
const consent = ref(props.session.preview)
const { state, retry, retryBlocked, run } = useLatestRequest()
const video = computed(() => state.value.data?.[selected.value])
const close = () => trailerSession.close(props.session)
let grace
let observer
let motion
let entered = false

function checkVisibility() {
  if (document.hidden) close()
}
function onEscape(event) {
  if (event.key === 'Escape' && props.session.preview) close()
}
function scheduleDismiss() {
  clearTimeout(grace)
  grace = setTimeout(() => {
    if (!shell.value?.matches(':hover, :focus-within') && !props.session.trigger?.matches(':hover')) close()
  }, entered ? 450 : 1150)
}
function enterPreview() {
  entered = true
  clearTimeout(grace)
}

async function loadPlayer() {
  consent.value = true
  await nextTick()
  shell.value?.querySelector('.trailer-player')?.focus()
}

onMounted(() => {
  if (document.hidden) {
    trailerSession.close(props.session, false)
    return
  }
  if (!props.session.preview) shell.value.showModal()
  else {
    const trigger = props.session.trigger
    const hero = trigger?.closest('.feature-hero')?.getBoundingClientRect()
    if (hero) previewTop.value = Math.max(16, Math.min(hero.top + 40, innerHeight - 390)) + 'px'
    trigger?.addEventListener('pointerleave', scheduleDismiss)
    window.addEventListener('scroll', close, { passive: true })
    window.addEventListener('resize', close)
    window.addEventListener('keydown', onEscape)
    motion = matchMedia('(prefers-reduced-motion: reduce)')
    motion.addEventListener('change', close)
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.intersectionRatio <= 0.5)) close()
      }, { threshold: 0.5 })
      observer.observe(shell.value)
    }
    scheduleDismiss()
  }
  document.addEventListener('visibilitychange', checkVisibility)
  void run(signal => lookupTrailers(props.session.type, props.session.id, signal))
})
onScopeDispose(() => {
  clearTimeout(grace)
  observer?.disconnect()
  motion?.removeEventListener('change', close)
  props.session.trigger?.removeEventListener('pointerleave', scheduleDismiss)
  window.removeEventListener('scroll', close)
  window.removeEventListener('resize', close)
  window.removeEventListener('keydown', onEscape)
  document.removeEventListener('visibilitychange', checkVisibility)
})
</script>

<template>
  <Teleport to="body">
    <component :is="session.preview ? 'aside' : 'dialog'" ref="shell" class="trailer-shell"
      :class="session.preview ? 'trailer-preview' : 'trailer-dialog'" aria-labelledby="active-trailer-heading"
      :style="previewTop ? { top: previewTop } : undefined"
      @cancel.prevent="close" @close="close" @pointerenter="enterPreview" @pointerleave="scheduleDismiss"
      @focusout="session.preview && scheduleDismiss()">
      <div class="trailer-heading">
        <div>
          <p class="text-xs cinema-muted">{{ video?.type ?? 'Trailer' }}</p>
          <h2 id="active-trailer-heading">{{ session.title }}</h2>
        </div>
        <button class="cinema-icon ui-focus shrink-0" type="button" aria-label="Close trailer" :autofocus="!session.preview" @click="close">×</button>
      </div>
      <div v-if="state.status === 'loading'" class="trailer-placeholder" role="status">Finding trailers…</div>
      <div v-else-if="state.status === 'empty'" class="trailer-placeholder" role="status">No supported trailer is available for this title.</div>
      <div v-else-if="state.status === 'error'" class="trailer-placeholder" role="alert">
        <p>{{ state.error?.message ?? 'Could not find trailers.' }}</p>
        <button v-if="state.error?.retryable !== false" class="catalogue-page-link" type="button" :disabled="retryBlocked" @click="retry">Retry</button>
      </div>
      <template v-else-if="video">
        <TrailerPlayer v-if="consent" :key="video.key" :video="video" :title="session.title" :autoplay="session.preview" @invisible="close" />
        <div v-else class="trailer-placeholder">
          <p>Playing this {{ video.type.toLowerCase() }} loads a third-party YouTube player.</p>
          <button class="state-action" type="button" @click="loadPlayer">Load YouTube {{ video.type.toLowerCase() }}</button>
          <a class="shelf-link ui-focus" :href="'https://www.youtube.com/watch?v=' + video.key" target="_blank" rel="noopener">Open on YouTube ↗</a>
        </div>
        <div v-if="state.data.length > 1" class="mt-3 flex flex-wrap gap-2" aria-label="Video options" role="group">
          <button v-for="(choice, index) in state.data" :key="choice.key" type="button" class="catalogue-page-link"
            :aria-pressed="selected === index" @click="selected = index">{{ choice.type }} {{ index + 1 }}</button>
        </div>
      </template>
    </component>
  </Teleport>
</template>
