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


export async function searchMovies(query) {
  const url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}&language=en-US&page=1`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data.results; // This is the array of movies
  } catch (error) {
    console.error('Error searching movies:', error);
    return []; // Return an empty array on error
  }
}

export async function discoverMovies(filters) {
  let url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&page=1&sort_by=popularity.desc`;

  // Add filters if they exist
  if (filters.genre) {
    url += `&with_genres=${filters.genre}`;
  }
  if (filters.year) {
    url += `&primary_release_year=${filters.year}`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error discovering movies:', error);
    return [];
  }
}

// Function to get the genre list
export async function fetchGenres() {
  const url = `${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data.genres; // Returns an array like [{id: 28, name: 'Action'}]
  } catch (error) {
    console.error('Error fetching genres:', error);
    return [];
  }
}