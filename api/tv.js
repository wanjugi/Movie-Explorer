import { handleTvRequest } from '../server/tv.js'

export default {
  fetch(request) {
    return handleTvRequest(request)
  },
}
