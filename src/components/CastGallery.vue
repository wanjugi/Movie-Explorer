<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import MediaPoster from './MediaPoster.vue'
import { isMediaId } from '@/catalogue/mediaIdentity.js'

const props = defineProps({ people: { type: Array, required: true }, heading: String })
const visible = computed(() => props.people.filter(person => typeof person?.name === 'string' && person.name.trim()))
</script>

<template>
  <section v-if="visible.length" class="cast-section">
    <h2 class="detail-subheading">{{ heading || 'Cast' }}</h2>
    <ul class="cast-gallery">
      <li v-for="(person, index) in visible" :key="person.credit_id ?? (person.id + ':' + index)" class="cast-person">
        <component :is="isMediaId(person.id) ? RouterLink : 'div'"
          :to="isMediaId(person.id) ? { name: 'person', params: { id: person.id } } : undefined" class="block rounded-lg ui-focus">
          <MediaPoster :path="typeof person.profile_path === 'string' ? person.profile_path : undefined" portrait sizes="(max-width: 599px) 27vw, 128px" />
          <p class="mt-2 break-words font-semibold">{{ person.name }}</p>
        </component>
        <p v-if="typeof person.character === 'string' && person.character.trim()" class="break-words text-sm cinema-muted">{{ person.character }}</p>
      </li>
    </ul>
  </section>
</template>
