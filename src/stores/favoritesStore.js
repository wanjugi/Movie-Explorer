import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// This helper function saves the favorites list to localStorage
function saveToLocalStorage(favorites) {
  localStorage.setItem('favoritesList', JSON.stringify(favorites))
}

export const useFavoritesStore = defineStore('favorites', () => {

  // 1. STATE: The main list of favorite movies.
  // It is loaded from the browser's memory (localStorage).
  // If it's not there (||), it starts with an empty array [].
  const favorites = ref(JSON.parse(localStorage.getItem('favoritesList')) || [])

  // 2. ACTIONS: The functions that change the state.
  //This function adds or removes a movie from the favorites list.
   
  function toggleFavorite(movie) {
    // Check if the movie is already in the list.
    // .findIndex() will give the movie's position, or -1 if it's not found.
    const index = favorites.value.findIndex(item => item.id === movie.id)
    if (index === -1) {
      // The movie is NOT in the list, so it is added.
      favorites.value.push(movie)
    } else {
      // The movie is in the list, so it is removed.
      favorites.value.splice(index, 1)
    }

    // After adding or removing, save the new list back to localStorage.
    localStorage.setItem('favoritesList', JSON.stringify(favorites.value))
  }

  // This function just checks if a movie is in the list.
  function checkIsFavorite(movieId) {
    return favorites.value.some(movie => movie.id === movieId)
  }

  // 3. RETURN: We must return the state and functions so other components can use them.
  return {
    //state
    favorites,
    //actions
    toggleFavorite,
    checkIsFavorite
  }

})
