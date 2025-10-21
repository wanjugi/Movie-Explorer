import axios from 'axios';

// Get the API key from our .env.local file
const apiKey = import.meta.env.VITE_TMDB_API_KEY;

// Create a "base instance" of axios
const api = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  params: {
    api_key: apiKey,
    language: 'en-US'
  }
});

// to get the list of popular movies
export const getPopularMovies = () => {
  return api.get('/movie/popular');
};

// add more functions here later...
export const searchMovies = (query) => {
  return api.get('/search/movie', {
    params: {
      query
    }
  });
};
