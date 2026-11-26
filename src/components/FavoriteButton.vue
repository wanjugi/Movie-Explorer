<script setup>
import { computed, ref } from 'vue'
import { useFavoritesStore } from '@/stores/favoritesStore'
import { mediaCardData } from '@/catalogue/mediaIdentity.js'

const props = defineProps({ item: { type: Object, required: true }, withLabel: Boolean })
const emit = defineEmits(['removed'])
const favoritesStore = useFavoritesStore()
const title = computed(() => mediaCardData(props.item).title)
const isFavorite = computed(() => favoritesStore.checkIsFavorite(props.item.id, props.item.media_type))
const pulse = ref(false)
function toggle(event) {
  const adding = !isFavorite.value
  favoritesStore.toggleFavorite(props.item)
  pulse.value = adding && isFavorite.value
  if (!adding && !isFavorite.value) emit('removed', event)
}
</script>

<template>
  <button type="button" :aria-label="`Favorite: ${title}`" :aria-pressed="isFavorite"
    class="cinema-favorite ui-focus"
    :class="{ 'cinema-favorite--labeled': withLabel }"
    @click="toggle" @animationend="pulse = false">
    <svg aria-hidden="true" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
      class="h-5 w-5" :class="[isFavorite ? 'fill-current' : 'fill-none', { 'favorite-pulse': pulse }]">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
    <span v-if="withLabel">Favorite</span>
  </button>
</template>
