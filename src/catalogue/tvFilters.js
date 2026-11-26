import { DISCOVER_FIELDS, MOVIE_SORTS } from './movieFilters.js'

export const TV_FEEDS = {
  discover: 'Discover', popular: 'Popular', trending: 'Trending', 'top-rated': 'Top Rated',
  'airing-today': 'Airing Today', 'on-the-air': 'On the Air',
}

export const TV_SORTS = {
  popular: MOVIE_SORTS.popular,
  rating: MOVIE_SORTS.rating,
  votes: MOVIE_SORTS.votes,
  newest: ['Newest first air date', 'first_air_date.desc'],
  oldest: ['Oldest first air date', 'first_air_date.asc'],
}

export const TV_FIELDS = {
  genre: DISCOVER_FIELDS.genre,
  year: [DISCOVER_FIELDS.year[0], 'first_air_date_year'],
  from: [DISCOVER_FIELDS.from[0], 'first_air_date.gte', DISCOVER_FIELDS.from[2]],
  to: [DISCOVER_FIELDS.to[0], 'first_air_date.lte', DISCOVER_FIELDS.to[2]],
  language: DISCOVER_FIELDS.language,
  rating: DISCOVER_FIELDS.rating,
  votes: DISCOVER_FIELDS.votes,
  sort: [value => typeof value === 'string' && Object.hasOwn(TV_SORTS, value), 'sort_by', value => TV_SORTS[value][1]],
}
