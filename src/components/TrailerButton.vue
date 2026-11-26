<script setup>
import { onScopeDispose, ref, watch } from 'vue'
import { autoPreview, trailerSession } from '@/composables/trailerSession.js'

const props = defineProps({
  type: { type: String, required: true },
  id: { type: Number, required: true },
  title: { type: String, required: true },
  hoverPreview: Boolean,
})
const trigger = ref(null)
let timer
let owner

function activate(preview = false) {
  clearTimeout(timer)
  const session = { key: Symbol(), type: props.type, id: props.id, title: props.title, trigger: trigger.value, preview }
  if (trailerSession.open(session)) owner = session
}

function hover(event) {
  const allowed = () => matchMedia('(min-width: 1400px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches
  if (!props.hoverPreview || !autoPreview.value || event.pointerType !== 'mouse'
      || !allowed() || document.hidden) return
  clearTimeout(timer)
  timer = setTimeout(() => {
    if (autoPreview.value && allowed() && !document.hidden && trigger.value?.matches(':hover')) activate(true)
  }, 1000)
}

function leave() {
  clearTimeout(timer)
  // The preview owns its closing grace period once it appears.
}

function reset() {
  clearTimeout(timer)
  if (owner) trailerSession.close(owner)
}
watch(() => [props.type, props.id], reset)
onScopeDispose(reset)
</script>

<template>
  <button ref="trigger" class="catalogue-page-link trailer-action" type="button" aria-haspopup="dialog"
    @click="activate()" @pointerenter="hover" @pointerleave="leave">
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7">
      <path d="M8 5v14l11-7z"/>
    </svg>
    Watch trailer
  </button>
</template>
