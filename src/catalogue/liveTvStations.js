import { liveTvBrands } from './liveTvBrands.js'

const verified = '2026-11-26'
const kbc = 'https://kbc.go.ke/'
const signet = 'https://stream.kbc.go.ke/'
const standard = 'https://www.standardmedia.co.ke/'
const dstv = 'https://www.dstv.com/en-ke/explore/dstv-channels/'

const stations = [
  { slug: 'ntv-kenya', name: 'NTV Kenya', shortName: 'NTV', broadcaster: 'Nation Media Group',
    categories: ['News', 'General entertainment', 'Business'], languages: ['English', 'Kiswahili'],
    description: 'Kenyan news, interviews, business and entertainment, including The Trend and NTV Swahili reporting.',
    website: 'https://ntvkenya.co.ke/', live: 'https://ntvkenya.co.ke/live/', youtube: 'https://www.youtube.com/@ntvkenyaonline',
    videoId: 'Z9Lwmfojd1c', expires: '2026-11-29T00:00:00+03:00', simulcastTitles: ['NTV KENYA LIVE'],
    sources: ['https://ntvkenya.co.ke/collection/ntv-live/', dstv] },
  { slug: 'ktn-home', name: 'KTN', shortName: 'KTN', broadcaster: 'The Standard Group', aliases: ['KTN Home', 'KTN News'],
    categories: ['News', 'General entertainment'], description: 'The Standard Group’s KTN Home carries news and general programming.',
    history: 'The Standard Group reported merging KTN Home and KTN News into a unified KTN brand in 2024.',
    playbackChannels: ['UCKVsdeoHExltrWMuK0hOWmg'],
    videoId: '8ptxgAEhUFM', expires: '2026-12-01T00:00:00+03:00',
    simulcastTitles: ['KTN LIVE STREAM', 'LIVE NOW 🔴 KTN LIVE STREAM', 'KTN Kenya Live – Breaking News, Politics and Current Affairs, 24/7'],
    website: standard, live: standard + 'ktnhome/live', sources: [dstv, standard + 'corporate/assets/reports/SG_ANNUAL_REPORT_2024.pdf'] },
  { slug: 'kbc-channel-1', name: 'KBC Channel 1', shortName: 'KBC 1', broadcaster: 'Kenya Broadcasting Corporation',
    playbackChannels: ['UCypNjM5hP1qcUqQZe57jNfg', 'UCegApUZsuaWaXYf5g9W8Mzw'],
    categories: ['News', 'General entertainment', 'Sports', 'Education and culture'], languages: ['English', 'Kiswahili'],
    description: 'Kenya’s national public television channel covers national news, culture, education and sport.',
    website: kbc, live: 'https://www.kbc.co.ke/live/', sources: [dstv] },
  { slug: 'k24', name: 'K24 TV', shortName: 'K24', broadcaster: 'Mediamax Network',
    categories: ['News', 'General entertainment'], description: 'A Kenyan news and general television station from Mediamax Network.',
    website: 'https://k24.digital/', live: signet, sources: ['https://k24.digital/terms-and-conditions'] },
  { slug: 'tv47', name: 'TV47', shortName: 'TV47', categories: ['News', 'General entertainment', 'Sports'],
    description: 'A Kenyan channel with local news, conversations, entertainment and sports coverage.',
    website: 'https://www.tv47.digital/', live: 'https://www.tv47.digital/tv_video/tv47-live-news-now/',
    sources: ['https://www.tv47.digital/how-to-watch-tv47-live-online-7459/'] },
  { slug: 'citizen-tv', name: 'Citizen TV', shortName: 'Citizen', broadcaster: 'Royal Media Services',
    categories: ['News', 'General entertainment'], languages: ['English', 'Kiswahili'],
    description: 'A Kenyan station carrying news, current affairs, drama and general entertainment.',
    website: 'https://www.citizen.digital/', live: 'https://citizen.digital/tv/citizn-tv-15',
    schedule: 'https://citizen.digital/tv/citizen-tv-15/schedules',
    youtube: 'https://www.youtube.com/@CitizenTVKenya', sources: [dstv, 'https://royalmedia.co.ke/our-programming/'] },
  { slug: 'y254', name: 'Y254', shortName: 'Y254', broadcaster: 'Kenya Broadcasting Corporation',
    categories: ['Youth', 'General entertainment'], description: 'KBC’s youth-focused free-to-air television service.',
    website: kbc, live: signet },
  { slug: 'switch-tv', name: 'Switch TV', shortName: 'Switch', categories: ['Youth', 'News', 'General entertainment'],
    description: 'Switch Media’s digital television offering includes Kenyan news and youth-facing entertainment.',
    website: 'https://www.switchmedia.africa/home', live: 'https://www.switchmedia.africa/africa/article/live' },
  { slug: 'btv', name: 'BTV', shortName: 'BTV', broadcaster: 'The Standard Group',
    description: 'BTV is listed in the Standard Group’s television network. Check its official site for programming and viewing information.',
    website: 'https://www.btvkenya.ke/', sources: [standard + 'ktnhome/live'] },
  { slug: 'ktn-farmers-tv', name: 'KTN Farmers TV', shortName: 'Farmers', broadcaster: 'The Standard Group',
    categories: ['Education and culture'], description: 'A specialist Standard Group service focused on farming and agriculture.',
    viewing: 'The group links to Farmers TV. A current continuous broadcast was not verified.',
    website: 'https://www.farmers.co.ke/', sources: [standard + 'ktnhome/live'] },
  { slug: 'inooro-tv', name: 'Inooro TV', shortName: 'Inooro', broadcaster: 'Royal Media Services',
    categories: ['Vernacular', 'News', 'Education and culture'], languages: ['Kikuyu'],
    description: 'Kikuyu-language television with news, discussions and programming for the Mount Kenya audience.',
    website: 'https://royalmedia.co.ke/brands/inooro-tv/', live: 'https://www.citizen.digital/tv/inooro-tv-14' },
  { slug: 'ramogi-tv', name: 'Ramogi TV', shortName: 'Ramogi', broadcaster: 'Royal Media Services',
    categories: ['Vernacular', 'News', 'Education and culture'], languages: ['Dholuo'],
    description: 'Dholuo-language television with news, interviews, cultural coverage and youth programmes.',
    website: 'https://royalmedia.co.ke/brands/ramogi-tv/', live: signet },
  { slug: 'kameme-tv', name: 'Kameme TV', shortName: 'Kameme', categories: ['Vernacular'], languages: ['Kikuyu'],
    description: 'A Kenyan vernacular station serving Kikuyu-speaking audiences.',
    live: signet, sources: [dstv] },
  { slug: 'kass-tv', name: 'Kass TV', shortName: 'Kass', categories: ['Vernacular', 'News', 'General entertainment'], languages: ['Kalenjin'],
    description: 'Kalenjin-language television carrying news, interviews, music, sport and faith programming.',
    live: signet, sources: [dstv] },
  { slug: 'kbc-heritage-tv', name: 'KBC Heritage TV', shortName: 'Heritage', broadcaster: 'Kenya Broadcasting Corporation',
    categories: ['Education and culture'], description: 'KBC’s free-to-air service focused on preserving and sharing Kenyan culture.',
    website: kbc },
  { slug: 'family-tv', name: 'Family TV', shortName: 'Family', broadcaster: 'Family Media',
    categories: ['Religious'], description: 'Kenyan Christian television with faith and family programming.',
    website: 'https://familymedia.tv/', live: 'https://familymedia.tv/family-tv-live/',
    youtube: 'https://www.youtube.com/channel/UCaezQJtBqkyuNFN8bGmBeMQ', sources: ['https://familymedia.tv/faqs/'] },
  { slug: 'hope-tv', name: 'Hope TV Kenya', shortName: 'Hope TV', broadcaster: 'Hope Media (CITAM)', categories: ['Religious'],
    description: 'Kenyan faith-based television. Consult the broadcaster for its current programming and viewing options.',
    website: 'https://hopemediakenya.org/', live: 'https://hopemediakenya.org/hope-tv/', sources: ['https://hopemediakenya.org/hope-media/'] },
  { slug: 'al-jazeera-english', name: 'Al Jazeera English', shortName: 'Al Jazeera', regionGroup: 'international',
    country: 'Qatar', headquarters: 'Doha, Qatar', broadcaster: 'Al Jazeera Media Network', categories: ['News'], languages: ['English'],
    description: 'An English-language international news service with rolling coverage, interviews and documentaries.',
    website: 'https://www.aljazeera.com/', live: 'https://www.aljazeera.com/video/live/', schedule: 'https://www.aljazeera.com/schedule/',
    youtube: 'https://www.youtube.com/@aljazeeraenglish', videoId: 'gCNeDWCI0vo',
    history: 'Al Jazeera began broadcasting from Doha in 1996. This profile covers the network’s English-language television service.' },
  { slug: 'bbc-news', name: 'BBC News (International)', shortName: 'BBC News', regionGroup: 'international',
    playbackChannels: ['UC16niRr50-MSBwiO3YDb3RA'],
    videoId: 'sc21UUjyLaw', videoRegions: ['KE', 'NG', 'PL'], rollingFeedOnly: true,
    simulcastTitles: ['Watch BBC News LIVE'],
    country: 'United Kingdom', broadcaster: 'BBC', categories: ['News'], languages: ['English'],
    description: 'The international BBC News television service, formerly branded BBC World News, provides rolling news and current affairs.',
    website: 'https://www.bbc.com/news', live: 'https://help.bbc.com/hc/en-us/sections/39027390550163-Live-BBC-News-Channel-Stream',
    viewing: 'This BBC News live feed is available in Kenya, Nigeria and Poland, subject to YouTube’s current regional restrictions. Elsewhere, check BBC viewing guidance or an authorized local TV provider.',
    sources: [dstv, 'https://blog.youtube/news-and-events/bbc-news-live-youtube-launch/', 'https://help.bbc.com/hc/en-us/articles/42343579768851-Can-I-watch-the-BBC-News-channel-online-via-BBC-com-and-or-BBC-app'] },
  { slug: 'cnn-international', name: 'CNN International', shortName: 'CNN', regionGroup: 'international',
    country: 'United States', broadcaster: 'CNN', categories: ['News', 'Business'], languages: ['English'],
    description: 'CNN’s international television feed offers global news, business coverage and reporting.',
    website: 'https://edition.cnn.com/', live: 'https://help.cnn.com/Answer/Detail/000001022',
    viewing: 'Use an authorized TV provider carrying CNN International. Package and authentication requirements vary by region.', sources: [dstv] },
  { slug: 'cgtn-africa', name: 'CGTN Africa', shortName: 'CGTN Africa', regionGroup: 'international',
    playbackChannels: ['UCMeYPU1YfXjxsUa6QXWsfjg'],
    country: 'China', headquarters: 'Nairobi, Kenya', broadcaster: 'CGTN', categories: ['News', 'Business'], languages: ['English'],
    description: 'CGTN’s Nairobi-based African production operation publishes African coverage and programmes such as Africa Live.',
    website: 'https://africa.cgtn.com/', youtube: 'https://www.youtube.com/@cgtnafrica',
    viewing: 'Check the official Africa channel for scheduled programmes. A continuous Africa-only feed was not verified.',
    sources: ['https://www.cgtn.com/channel/documentary/program-list.html'] },
  { slug: 'france-24-english', name: 'France 24 English', shortName: 'France 24', regionGroup: 'international',
    country: 'France', broadcaster: 'France Médias Monde', categories: ['News'], languages: ['English'],
    description: 'The English-language France 24 feed broadcasts international news and analysis from France.',
    website: 'https://www.france24.com/en/', live: 'https://www.france24.com/en/live',
    youtube: 'https://www.youtube.com/channel/UCQfwfsi5VrQ8yKZ-UWmAEFg', videoId: 'HvZt-nh9sGg',
    sources: ['https://howtowatch.france24.com/en/country/kenya/'] },
]

export const liveTvStations = Object.freeze(stations.map(station => Object.freeze({
  id: 'channel:' + station.slug, country: 'Kenya', regionGroup: 'kenya', categories: [], languages: [],
  channelId: liveTvBrands[station.slug]?.[0],
  discovery: station.slug !== 'cnn-international',
  ...station,
  youtube: station.slug !== 'cnn-international' && liveTvBrands[station.slug]?.[0]
    ? 'https://www.youtube.com/channel/' + liveTvBrands[station.slug][0] : station.youtube,
  verified, sources: [...new Set([station.website, station.live, ...(station.sources ?? [])].filter(Boolean))],
})))
const bySlug = new Map(liveTvStations.map(station => [station.slug, station]))
export const findStation = slug => bySlug.get(slug) ?? null

export function filterStations({ region = 'all', category = '', language = '', search = '' } = {}) {
  const words = search.trim().toLocaleLowerCase('en').split(/\s+/).filter(Boolean)
  return liveTvStations.filter(station => {
    const terms = [station.name, station.shortName, station.slug, ...(station.aliases ?? []), ...station.categories, ...station.languages].join(' ').toLocaleLowerCase('en')
    return (region === 'all' || station.regionGroup === region)
      && (!category || station.categories.includes(category)) && (!language || station.languages.includes(language))
      && words.every(word => terms.includes(word))
  })
}

export const viewingUrl = station => station.live || station.youtube || station.website
export const viewingLabel = station => station.live ? 'Official viewing' : station.youtube ? 'Official channel' : 'Official website'
export const stationPlaybackLabel = station => liveEmbed(station, '') || (station.channelId && station.discovery)
  ? 'Check live availability' : 'Official viewing options'
export function getStationArtwork(station) {
  if (findStation(station?.slug) !== station) return null
  const [channelId, url] = liveTvBrands[station.slug] ?? []
  return url && /^https:\/\/yt3\.googleusercontent\.com\/[\w/=-]+$/.test(url)
    ? { url, source: 'https://www.youtube.com/channel/' + channelId } : null
}
export const playbackChannels = station => station.playbackChannels ?? [station.channelId]

export function fixedLiveSources(station) {
  const primary = station.videoId ? [{
    id: station.videoId, channelId: playbackChannels(station)[0], expires: station.expires, regions: station.videoRegions,
  }] : []
  return [...primary, ...(station.secondarySources ?? [])]
}

export function fixedLiveSource(station, excluded = [], now = Date.now()) {
  return fixedLiveSources(station).find(({ id, expires }) =>
    /^[\w-]{11}$/.test(id) && !excluded.includes(id) && (!expires || now < Date.parse(expires)))
}

export function liveEmbed(station, origin, now = Date.now()) {
  if (findStation(station?.slug) !== station) return null
  return youtubeLiveEmbed(fixedLiveSource(station, [], now)?.id, origin)
}

export function youtubeLiveEmbed(videoId, origin) {
  if (!/^[\w-]{11}$/.test(videoId ?? '')) return null
  return 'https://www.youtube-nocookie.com/embed/' + videoId + '?' +
    new URLSearchParams({ enablejsapi: '1', origin, playsinline: '1', controls: '1', autoplay: '0' })
}
