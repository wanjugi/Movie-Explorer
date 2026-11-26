export const TRAILER_LOCALE = 'en-US'
export const MAX_TRAILER_CHOICES = 3

export function isTrailerChoice(item) {
  return typeof item?.key === 'string' && /^[A-Za-z0-9_-]{11}$/.test(item.key)
    && (item.type === 'Trailer' || item.type === 'Teaser')
}

export function isTrailerEnvelope(data) {
  return Array.isArray(data?.results) && data.results.length <= MAX_TRAILER_CHOICES
    && data.results.every(isTrailerChoice)
}

export function selectTrailerChoices(results) {
  const choices = results.filter(item => item?.site === 'YouTube' && isTrailerChoice(item)
    && (item.type !== 'Teaser' || item.official === true))
  const rank = item => (item.type === 'Teaser' ? 8 : 0) + (item.official === true ? 0 : 4)
    + (item.iso_639_1 === 'en' ? item.iso_3166_1 === 'US' ? 0 : 1 : 2)
  choices.sort((a, b) => rank(a) - rank(b))
  const unique = new Map()
  for (const { key, type } of choices) {
    if (!unique.has(key)) unique.set(key, { key, type })
    if (unique.size === MAX_TRAILER_CHOICES) break
  }
  return [...unique.values()]
}
