export const MAX_MOVIE_PAGE = 500

export function isMoviePage(value) {
  return Number.isInteger(value) && value >= 1 && value <= MAX_MOVIE_PAGE
}

export function parseMoviePage(value) {
  if (typeof value !== 'string' || !/^[1-9]\d{0,2}$/.test(value)) return null
  const page = Number(value)
  return isMoviePage(page) ? page : null
}

export function isMoviePageEnvelope(value) {
  return isMoviePage(value?.page) && Array.isArray(value.results)
    && Number.isSafeInteger(value.total_pages) && value.total_pages >= 0
    && Number.isSafeInteger(value.total_results) && value.total_results >= 0
}

export function pageItems(page, last) {
  if (last < 1 || page < 1 || page > last) return []
  const nearby = [...new Set([1, page - 1, page, page + 1, last])]
    .filter(number => number >= 1 && number <= last)
    .sort((left, right) => left - right)
  const items = []
  for (const number of nearby) {
    const previous = items.at(-1)
    if (number - previous === 2) items.push(previous + 1)
    else if (number - previous > 2) items.push(null)
    items.push(number)
  }
  return items
}
