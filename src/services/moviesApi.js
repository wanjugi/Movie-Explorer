async function requestMovies(operation, parameters, field) {
  const query = new URLSearchParams({ operation, ...parameters })
  const fallback = field ? [] : null

  try {
    const response = await fetch(`/api/movies?${query}`)
    if (!response.ok) return fallback

    const data = await response.json()
    return field ? data[field] : data
  } catch {
    return fallback
  }
}

export function fetchPopularMovies() {
  return requestMovies('popular', {}, 'results')
}

export function fetchMovieById(movieId) {
  return requestMovies('details', { id: movieId })
}

export function searchMovies(query) {
  return requestMovies('search', { query }, 'results')
}

export function discoverMovies(filters) {
  const parameters = {}
  if (filters.genre) parameters.genre = filters.genre
  if (filters.year) parameters.year = filters.year
  return requestMovies('discover', parameters, 'results')
}

export function fetchGenres() {
  return requestMovies('genres', {}, 'genres')
}
