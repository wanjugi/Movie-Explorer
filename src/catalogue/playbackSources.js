import { contentKey } from './libraryData.js'
import { readTvRouteParams } from './mediaIdentity.js'

const entries = new Map([
  ['movie:10378', Object.freeze({
    provider: 'youtube', asset: 'YE7VzlLtp-4', contentType: 'movie', title: 'Big Buck Bunny',
    attribution: '© 2008 Blender Foundation / www.bigbuckbunny.org',
    provenance: 'https://studio.blender.org/projects/big-buck-bunny/',
    permission: 'Creative Commons Attribution 3.0', territories: null,
  })],
  ['tv:33050:1:1', Object.freeze({
    provider: 'youtube', asset: '68RD46kl8ng', contentType: 'episode', title: 'Earthfall (Pilot)',
    attribution: 'Pioneer One by Josh Bernhard and Bracey Smith • official pioneeronetv upload',
    provenance: 'https://www.youtube.com/channel/UC7nNt1foz_OtCVqVRDwjlBA',
    permission: 'Creator-published episode through the official YouTube embed', territories: null,
  })],
])

export function sourceFor(item) {
  return entries.get(contentKey(item)) ?? null
}

export function watchIdentity(route) {
  if (!['watch-movie', 'watch-episode'].includes(route.name)) return null
  const { id, season, episode } = readTvRouteParams(route.params)
  if (!id) return null
  if (route.name === 'watch-movie') return { media_type: 'movie', id: Number(id) }
  return season === null || episode === null ? null : { media_type: 'tv', id: Number(id), season: Number(season), episode: Number(episode) }
}

export function watchLocation(item) {
  return item.media_type === 'movie' ? { name: 'watch-movie', params: { id: item.id } }
    : { name: 'watch-episode', params: { id: item.id, seasonNumber: item.season, episodeNumber: item.episode } }
}

export function detailLocation(item) {
  if (item.media_type === 'movie') return { name: 'movie-details', params: { id: item.id } }
  return Number.isInteger(item.episode)
    ? { name: 'tv-episode', params: { id: item.id, seasonNumber: item.season, episodeNumber: item.episode } }
    : { name: 'tv-details', params: { id: item.id } }
}

export function youtubeEmbed(source, origin) {
  if (![...entries.values()].includes(source) || source.provider !== 'youtube' || !/^[\w-]{11}$/.test(source.asset)) return null
  return 'https://www.youtube-nocookie.com/embed/' + source.asset + '?' + new URLSearchParams({ origin, enablejsapi: '1', playsinline: '1', controls: '1' })
}

export const playbackCatalogue = Object.freeze([...entries].map(([key, source]) => {
  const [media_type, id, season, episode] = key.split(':')
  return Object.freeze({ media_type, id: Number(id), ...(media_type === 'tv' ? { season: Number(season), episode: Number(episode) } : {}), source })
}))
