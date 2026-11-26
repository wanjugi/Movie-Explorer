import { watch } from 'vue'
import { useLatestRequest } from './useLatestRequest.js'

export function useRouteRequest(key, load, options) {
  const request = useLatestRequest(options)
  watch(key, value => {
    if (value) void request.run(signal => load(value, signal))
    else request.cancel()
  }, { immediate: true, flush: 'sync' })
  return request
}
