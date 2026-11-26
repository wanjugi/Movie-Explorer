import { resumePosition } from '../catalogue/libraryData.js'

export function isActiveYouTubeAsset(player, asset) {
  try {
    const url = new URL(player.getVideoUrl())
    return url.origin === 'https://www.youtube.com'
      && url.pathname === '/watch' && url.searchParams.get('v') === asset
  } catch { return false }
}

// YouTube can report a zero duration after PLAYING and applies seeks asynchronously.
export function createYouTubeResume(record, asset, onUnavailable, now = Date.now) {
  let deadline
  let requested
  let settled = false

  return {
    get settled() { return settled },
    update(player) {
      if (settled) return
      const time = now()
      deadline ??= time + 8000
      try {
        if (requested === undefined && isActiveYouTubeAsset(player, asset)) {
          const duration = player.getDuration()
          if (Number.isFinite(duration) && duration > 0) {
            const position = resumePosition(record, asset, duration)
            if (!position) {
              settled = true
              onUnavailable()
              return
            }
            player.seekTo(position, true)
            requested = position
          }
        }
        if (requested !== undefined && isActiveYouTubeAsset(player, asset) && player.getCurrentTime() >= requested - 1) {
          settled = true
          return
        }
      } catch { /* wait for a subsequent provider update */ }
      if (time >= deadline) {
        settled = true
        onUnavailable()
      }
    },
  }
}
