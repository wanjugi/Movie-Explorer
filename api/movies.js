import { handleMovieRequest } from '../server/movies.js'

export default {
  fetch(request) {
    return handleMovieRequest(request)
  },
}
