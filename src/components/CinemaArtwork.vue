<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  path: { type: String, default: '' },
  still: Boolean,
  priority: Boolean,
  wide: Boolean,
})
const failed = ref('')
const image = ref(null)
const path = computed(() => /^\/[\w.-]+\.(?:jpe?g|png|webp)$/i.test(props.path ?? '') ? props.path : '')
const url = size => 'https://image.tmdb.org/t/p/' + size + path.value
const sources = computed(() => url('w780') + ' 780w, ' + url('w1280') + ' 1280w')
watch(path, () => { failed.value = '' }, { flush: 'sync' })
function imageError(event) {
  if (event.currentTarget === image.value && event.currentTarget.dataset.artwork === path.value) failed.value = path.value
}
</script>

<template>
  <div class="cinema-artwork" aria-hidden="true">
    <Transition name="dissolve">
      <picture v-if="path && failed !== path" :key="path">
        <source v-if="wide && !still" media="(min-width: 1700px), (min-width: 1050px) and (min-resolution: 1.75dppx)" :srcset="url('original')">
        <img ref="image" :data-artwork="path" :src="url(still ? 'w300' : 'w1280')" :srcset="still ? undefined : sources"
          sizes="100vw" alt="" decoding="async" :fetchpriority="priority ? 'high' : 'auto'" @error="imageError">
      </picture>
    </Transition>
  </div>
</template>
