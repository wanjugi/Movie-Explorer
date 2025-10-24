import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useSearchStore = defineStore('search', () => {

    const searchQuery = ref('')
    
    return {
        //state
        searchQuery,
        
    }
})