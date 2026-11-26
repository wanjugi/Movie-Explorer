import { ref, shallowRef } from 'vue'

export function createTrailerSession() {
  const active = shallowRef(null)
  function open(session) {
    if (session.preview && active.value) return false
    active.value = session
    return true
  }
  function close(owner = active.value, restoreFocus = true) {
    if (!owner || owner !== active.value) return
    active.value = null
    if (restoreFocus && !owner.preview) requestAnimationFrame(() => {
      if (!active.value && owner.trigger?.isConnected) owner.trigger.focus({ preventScroll: true })
    })
  }
  return { active, open, close }
}

export const trailerSession = createTrailerSession()
const key = 'movieExplorer.trailerPreviews'
function readPreference() {
  try { return globalThis.localStorage.getItem(key) === 'true' } catch { return false }
}
export const autoPreview = ref(readPreference())
export function setAutoPreview(value) {
  autoPreview.value = value
  try { globalThis.localStorage.setItem(key, String(value)) } catch { /* keep the session preference */ }
  if (!value && trailerSession.active.value?.preview) trailerSession.close()
}
