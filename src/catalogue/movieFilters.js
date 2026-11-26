export const MOVIE_FEEDS = {
  discover: 'Discover',
  popular: 'Popular',
  trending: 'Trending',
  'top-rated': 'Top Rated',
  'now-playing': 'Now Playing',
  upcoming: 'Upcoming',
}

export const MOVIE_SORTS = {
  popular: ['Most popular', 'popularity.desc'],
  rating: ['Highest rated', 'vote_average.desc'],
  votes: ['Most voted', 'vote_count.desc'],
  newest: ['Newest release date', 'primary_release_date.desc'],
  oldest: ['Oldest release date', 'primary_release_date.asc'],
  revenue: ['Highest revenue', 'revenue.desc'],
}

export const MOVIE_LANGUAGES = {
  ar: 'Arabic', bn: 'Bengali', zh: 'Chinese', cs: 'Czech', da: 'Danish', nl: 'Dutch', en: 'English',
  fa: 'Persian', fi: 'Finnish', fr: 'French', de: 'German', el: 'Greek', he: 'Hebrew', hi: 'Hindi',
  hu: 'Hungarian', id: 'Indonesian', it: 'Italian', ja: 'Japanese', ko: 'Korean', ml: 'Malayalam',
  no: 'Norwegian', pl: 'Polish', pt: 'Portuguese', ro: 'Romanian', ru: 'Russian', es: 'Spanish',
  sw: 'Swahili', sv: 'Swedish', tl: 'Tagalog', ta: 'Tamil', te: 'Telugu', th: 'Thai', tr: 'Turkish',
  uk: 'Ukrainian', ur: 'Urdu', vi: 'Vietnamese',
}

const integer = (value, max) => typeof value === 'string' && /^[1-9]\d{0,9}$/.test(value) && Number(value) <= max
export const isReleaseYear = value => typeof value === 'string' && /^[1-9]\d{3}$/.test(value)

// Each public Discover key has its own validator and explicit upstream mapping.
export const DISCOVER_FIELDS = {
  genre: [value => integer(value, 2_147_483_647), 'with_genres'],
  year: [isReleaseYear, 'primary_release_year'],
  from: [isReleaseYear, 'primary_release_date.gte', value => value + '-01-01'],
  to: [isReleaseYear, 'primary_release_date.lte', value => value + '-12-31'],
  language: [value => typeof value === 'string' && Object.hasOwn(MOVIE_LANGUAGES, value), 'with_original_language'],
  rating: [value => typeof value === 'string' && /^(?:[0-9](?:\.[0-9])?|10(?:\.0)?)$/.test(value)
    && Number(value) > 0, 'vote_average.gte', value => String(Number(value))],
  votes: [value => integer(value, 2_147_483_647), 'vote_count.gte'],
  runtimeMin: [value => integer(value, 1440), 'with_runtime.gte'],
  runtimeMax: [value => integer(value, 1440), 'with_runtime.lte'],
  sort: [value => typeof value === 'string' && Object.hasOwn(MOVIE_SORTS, value), 'sort_by', value => MOVIE_SORTS[value][1]],
}

export function hasInvertedRange(min, max) {
  return Boolean(min && max && Number(min) > Number(max))
}
