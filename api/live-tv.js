import { handleLiveTvRequest } from '../server/live-tv.js'

export default { fetch: request => handleLiveTvRequest(request) }
