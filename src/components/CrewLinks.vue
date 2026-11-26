<script setup>
import { computed } from 'vue'
import { isMediaId } from '@/catalogue/mediaIdentity.js'
const props = defineProps({ credits: Array, heading: { type: String, default: 'Crew' } })
const credits = computed(() => {
  const seen = new Set()
  return (props.credits ?? []).filter(entry => {
    if (typeof entry?.name !== 'string' || !entry.name.trim()) return false
    const key = [entry.id ?? entry.name, entry.job].join(':')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
})
</script>
<template>
  <section v-if="credits.length" class="cast-section">
    <h2 class="detail-subheading">{{ heading }}</h2>
    <ul class="flex flex-wrap gap-2">
      <li v-for="(credit, index) in credits" :key="index" class="cast-credit">
        <RouterLink v-if="isMediaId(credit.id)" :to="{ name: 'person', params: { id: credit.id } }" class="ui-focus cinema-accent">{{ credit.name }}</RouterLink>
        <template v-else>{{ credit.name }}</template>
        <span v-if="credit.job">{{ credit.job }}</span>
      </li>
    </ul>
  </section>
</template>
