<script setup>
import { computed, ref } from 'vue'
import { useRouteRequest } from '@/composables/useRouteRequest.js'
import { fetchDiscovery } from '@/services/discoveryApi.js'
import ContentState from './ContentState.vue'
const props = defineProps({ type: String, id: Number })
const opened = ref(false)
const defaultCountry = 'KE'
const key = 'movieExplorer.providerCountry:v1'
function readCountry() {
  try { const value = localStorage.getItem(key); return /^[A-Z]{2}$/.test(value ?? '') ? value : defaultCountry }
  catch { return defaultCountry }
}
const country = ref(readCountry())
function choose() { try { localStorage.setItem(key, country.value) } catch { /* session choice is retained */ } }
const { state, retry, retryBlocked } = useRouteRequest(computed(() => opened.value ? props.type + ':' + props.id : ''), (_, signal) =>
  fetchDiscovery(props.type, 'providers', { id: props.id }, signal))
const names = new Intl.DisplayNames(['en'], { type: 'region' })
const countries = computed(() => [...new Set([defaultCountry, country.value, ...Object.keys(state.value.data?.results ?? {})])]
  .filter(code => /^[A-Z]{2}$/.test(code)).sort((a, b) => names.of(a).localeCompare(names.of(b))))
const entry = computed(() => state.value.data?.results[country.value])
const groups = [['flatrate', 'Subscription'], ['free', 'Free'], ['ads', 'Advertising-supported'], ['rent', 'Rent'], ['buy', 'Buy']]
const destination = computed(() => {
  try {
    const url = new URL(entry.value?.link)
    const match = /^\/(movie|tv)\/(\d+)(?:-[^/]*)?\/watch\/?$/.exec(url.pathname)
    if (url.origin === 'https://www.themoviedb.org' && match?.[1] === props.type && Number(match[2]) === props.id) return url.href
  } catch { /* invalid provider destination */ }
  return null
})
</script>
<template>
  <details class="cinema-filter mt-8" @toggle="opened = $event.target.open">
    <summary class="ui-focus cursor-pointer p-4 font-semibold">Where to watch</summary>
    <div class="space-y-3 p-4 pt-0">
      <label class="block max-w-xs text-sm">Availability country (default Kenya)
        <select v-model="country" class="catalogue-filter-control mt-1" @change="choose">
          <option v-for="code in countries" :key="code" :value="code">{{ names.of(code) }}</option>
        </select>
      </label>
      <p v-if="state.status === 'loading'" role="status">Loading availability…</p>
      <ContentState v-else-if="state.status === 'error'" kind="error" compact title="Availability could not be loaded">
        <template #action><button class="catalogue-page-link" :disabled="retryBlocked" @click="retry">Retry</button></template>
      </ContentState>
      <template v-else-if="state.status === 'success'">
        <p v-if="!groups.some(([field]) => entry?.[field]?.length)">Availability information is unavailable for this country.</p>
        <dl v-else class="detail-facts">
          <div v-for="[field, title] in groups.filter(([field]) => Array.isArray(entry?.[field]) && entry[field].length)" :key="field">
            <dt>{{ title }}</dt><dd>{{ entry[field].map(provider => provider?.provider_name).filter(Boolean).join(', ') }}</dd>
          </div>
        </dl>
        <a v-if="destination" :href="destination" class="shelf-link ui-focus" target="_blank" rel="noopener">View availability on TMDB ↗</a>
      </template>
      <p class="text-sm cinema-muted">Availability data provided by <a class="shelf-link ui-focus" href="https://www.justwatch.com/" target="_blank" rel="noopener">JustWatch</a>.</p>
    </div>
  </details>
</template>
