<script setup>
import { computed, ref } from 'vue'
import CinemaRail from './CinemaRail.vue'
import { mediaKey } from '@/catalogue/mediaIdentity.js'
import { fetchDiscovery } from '@/services/discoveryApi.js'
const props = defineProps({ type: String, id: Number })
const shown = ref([])
const source = computed(() => props.type + ':' + props.id)
const recommendations = computed(() => ({
  title: props.type === 'tv' ? 'Recommended series' : 'Recommended movies',
  category: 'recommendations', type: props.type, exclude: [source.value],
  async load(signal) {
    const page = await fetchDiscovery(props.type, 'recommendations', { id: props.id }, signal)
    signal.throwIfAborted()
    shown.value = [...new Set(page.results.map(mediaKey).filter(key => key !== source.value))].slice(0, 10)
    return page
  },
}))
const similar = computed(() => ({
  title: props.type === 'tv' ? 'Similar series' : 'Similar movies',
  category: 'similar', type: props.type, exclude: [source.value, ...shown.value],
  load: signal => fetchDiscovery(props.type, 'similar', { id: props.id }, signal),
}))
</script>
<template>
  <div class="mt-10">
    <CinemaRail :feed="recommendations" />
    <CinemaRail :feed="similar" />
  </div>
</template>
