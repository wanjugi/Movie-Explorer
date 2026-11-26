import { isMediaId, mediaKey } from './mediaIdentity.js'

export function filmography(credits, type = 'all', role = 'all', order = 'newest') {
  const grouped = new Map()
  for (const field of ['cast', 'crew']) {
    for (const credit of Array.isArray(credits?.[field]) ? credits[field] : []) {
      if (!isMediaId(credit?.id) || credit.adult === true || !['movie', 'tv'].includes(credit.media_type)) continue
      if (type !== 'all' && credit.media_type !== type) continue
      const title = credit.media_type === 'movie' ? credit.title : credit.name
      if (typeof title !== 'string' || !title.trim()) continue
      const category = field === 'cast' ? 'Acting' : ['Directing', 'Writing', 'Production'].includes(credit.department) ? credit.department : 'Other crew'
      if (role !== 'all' && role !== category) continue
      const label = field === 'cast' ? (credit.character ? 'Acting: ' + credit.character : 'Acting') : (credit.job || category)
      const key = mediaKey(credit)
      if (!grouped.has(key)) grouped.set(key, { ...credit, roles: new Set() })
      grouped.get(key).roles.add(label)
    }
  }
  const date = item => [item.release_date, item.first_air_date].find(value => typeof value === 'string') ?? ''
  return [...grouped.values()].sort((a, b) => order === 'popular'
    ? (Number(b.popularity) || 0) - (Number(a.popularity) || 0) : date(b).localeCompare(date(a)))
}
