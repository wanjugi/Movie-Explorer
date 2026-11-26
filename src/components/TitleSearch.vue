<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGlobalSearch } from '@/composables/useMovieBrowseControls.js'

defineProps({ prominent: Boolean })
const { draft, invalid, submit, clear } = useGlobalSearch(useRoute(), useRouter())
const element = ref(null)
function clearAndFocus() {
  clear()
  element.value?.focus()
}
</script>

<template>
  <form role="search" :aria-label="prominent ? 'Discover a title' : 'Global search'" class="title-search" :class="{ 'title-search--prominent': prominent }"
    @submit.prevent="submit()">
    <div class="title-search__field">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg>
      <input ref="element" v-model="draft" aria-label="Search movies and TV series" :aria-invalid="invalid || undefined"
        :aria-describedby="invalid ? (prominent ? 'discover-input-error' : 'header-input-error') : undefined"
        :placeholder="prominent ? 'Search titles' : 'Search movies & TV series'" autocomplete="off">
      <button v-if="draft" type="button" class="title-search__clear ui-focus" aria-label="Clear global search" @click="clearAndFocus">×</button>
      <button v-if="prominent" type="submit" class="state-action">Search</button>
    </div>
    <p v-if="invalid" :id="prominent ? 'discover-input-error' : 'header-input-error'" class="mt-2 text-xs cinema-error" role="status">
      Use up to 160 characters without control characters.
    </p>
  </form>
</template>
