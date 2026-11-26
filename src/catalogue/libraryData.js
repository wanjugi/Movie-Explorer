import { isMediaId, isTvNumber, mediaKey } from './mediaIdentity.js'

export function contentKey(item) {
  if (item && (item.season !== undefined || item.episode !== undefined)) {
    return item.media_type === 'tv' && isMediaId(item.id) && isTvNumber(item.season) && isTvNumber(item.episode)
      ? 'tv:' + item.id + ':' + item.season + ':' + item.episode : ''
  }
  return item ? mediaKey(item) : ''
}

export function snapshot(item) {
  if (!item || !contentKey(item)) return null
  const media_type = item.media_type ?? 'movie'
  const title = media_type === 'movie' ? item.title : item.name
  if (typeof title !== 'string' || !title.trim()) return null
  const path = typeof item.poster_path === 'string' && /^\/[\w.-]+\.(?:jpg|jpeg|png|webp)$/i.test(item.poster_path) ? item.poster_path : null
  const date = media_type === 'movie' ? item.release_date : item.first_air_date
  const result = { media_type, id: item.id, poster_path: path, [media_type === 'movie' ? 'title' : 'name']: title.trim().slice(0, 300) }
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) result[media_type === 'movie' ? 'release_date' : 'first_air_date'] = date
  if (media_type === 'tv' && isTvNumber(item.season) && isTvNumber(item.episode)) {
    Object.assign(result, { season: item.season, episode: item.episode })
    if (typeof item.seriesTitle === 'string') result.seriesTitle = item.seriesTitle.slice(0, 300)
  }
  return result
}

export function validProgress(record) {
  return snapshot(record?.item) && Number.isFinite(record.position) && record.position >= 0
    && Number.isFinite(record.duration) && record.duration > 0 && record.duration >= record.position && record.duration <= 172800
    && typeof record.source === 'string' && /^[\w:-]{1,120}$/.test(record.source)
    && Number.isFinite(record.lastPlayed) && record.lastPlayed >= 0 && typeof record.completed === 'boolean'
}

export function resumePosition(record, source, duration) {
  if (!validProgress(record) || record.completed || record.source !== source || !Number.isFinite(duration) || duration <= 0) return 0
  if (Math.abs(duration - record.duration) > Math.max(3, duration * 0.01)) return 0
  return record.position < duration - 2 ? record.position : 0
}

export function createLibraryStorage(storage, key, validate, limit) {
  let raw = null
  let blocked = false
  let initial = []
  try {
    raw = storage.getItem(key)
    if (raw !== null) {
      const data = JSON.parse(raw)
      if (data?.version !== 1 || !Array.isArray(data.items) || !data.items.every(validate)) blocked = true
      else {
        const seen = new Set()
        for (const item of data.items) {
          const identity = contentKey(item.item ?? item)
          if (seen.has(identity)) continue
          seen.add(identity)
          initial.push(item)
          if (initial.length === limit) break
        }
      }
    }
  } catch { blocked = true }
  return {
    initial,
    get blocked() { return blocked },
    write(items) {
      if (blocked) return false
      try {
        if (storage.getItem(key) !== raw) return false
        const next = JSON.stringify({ version: 1, items: items.slice(0, limit) })
        storage.setItem(key, next)
        raw = next
        return true
      } catch { return false }
    },
  }
}
