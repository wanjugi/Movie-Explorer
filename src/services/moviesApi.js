// API key from the .env file
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

// Function to fetch popular movies
export async function fetchPopularMovies() {
  const url = BASE_URL + '/movie/popular?api_key=' + API_KEY + '&language=en-US&page=1';
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data.results; // The array of movies
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    return []; // Return an empty array on error
  }
}

export async function fetchMovieById(movieId) {
  const url = `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US&append_to_response=credits`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data; // Return the full movie object
  } catch (error) {
    console.error(`Error fetching movie with id ${movieId}:`, error);
    return null; // Return null on error
  }
}

// More functions here later (searchMovies, fetchMovieById)