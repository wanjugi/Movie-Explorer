import { computed, onScopeDispose, ref, shallowRef } from 'vue'

const idle = () => ({ status: 'idle', data: null, error: null })
const MAX_TIMER_DELAY = 2_147_483_647

export function useLatestRequest() {
  const state = shallowRef(idle())
  const retryBlocked = ref(false)
  let controller
  let retryTimer
  let load

  function clearRetryDelay() {
    clearTimeout(retryTimer)
    retryBlocked.value = false
  }

  function updateRetryDelay() {
    const remaining = (state.value.error?.retryAt ?? 0) - Date.now()
    retryBlocked.value = remaining > 0
    if (remaining > 0) {
      retryTimer = setTimeout(updateRetryDelay, Math.min(remaining, MAX_TIMER_DELAY))
    }
  }

  function cancel() {
    controller?.abort()
    controller = undefined
    clearRetryDelay()
    load = undefined
    state.value = idle()
  }

  async function run(request) {
    controller?.abort()
    clearRetryDelay()
    const owner = new AbortController()
    controller = owner
    load = request
    state.value = { status: 'loading', data: null, error: null }

    try {
      const data = await request(owner.signal)
      if (controller !== owner) return
      const empty = Array.isArray(data) && data.length === 0
      state.value = { status: empty ? 'empty' : 'success', data, error: null }
    } catch (error) {
      if (controller !== owner) return
      if (owner.signal.aborted || error?.name === 'AbortError') {
        state.value = idle()
      } else {
        state.value = { status: 'error', data: null, error }
        updateRetryDelay()
      }
    } finally {
      if (controller === owner) controller = undefined
    }
  }

  const canRetry = computed(() =>
    state.value.status === 'error' && !retryBlocked.value && state.value.error?.retryable !== false)

  function retry() {
    if (canRetry.value && load) return run(load)
  }

  onScopeDispose(cancel)

  return { state, retryBlocked, canRetry, run, retry, cancel }
}
