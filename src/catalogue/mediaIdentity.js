export const isMediaId = value => Number.isInteger(value) && value > 0 && value <= 2_147_483_647
export const isTvNumber = value => Number.isInteger(value) && value >= 0 && value <= 2_147_483_647
export const isMovieSummary = value => isMediaId(value?.id) && typeof value.title === 'string'
  && (typeof value.poster_path === 'string' || value.poster_path == null)
export const isTvSummary = value => isMediaId(value?.id) && typeof value.name === 'string'
  && (typeof value.poster_path === 'string' || value.poster_path == null)

export function mediaKey({ media_type: type = 'movie', id }) {
  return (type === 'movie' || type === 'tv') && isMediaId(id) ? type + ':' + id : ''
}

export function mediaCardData(item) {
  const type = item.media_type ?? 'movie'
  const television = type === 'tv'
  const date = television ? item.first_air_date : item.release_date
  return {
    type,
    title: (television ? item.name : item.title) || (television ? 'Untitled series' : 'Untitled movie'),
    date: typeof date === 'string' && /^\d{4}(?:-|$)/.test(date) ? date : '',
    poster: item.poster_path,
    location: { name: television ? 'tv-details' : 'movie-details', params: { id: item.id } },
  }
}

export function readTvRouteParams(params) {
  function part(value, valid) {
    return typeof value === 'string' && /^(?:0|[1-9]\d{0,9})$/.test(value) && valid(Number(value))
      ? value : null
  }
  return {
    id: part(params.id, isMediaId),
    season: part(params.seasonNumber, isTvNumber),
    episode: part(params.episodeNumber, isTvNumber),
  }
}
