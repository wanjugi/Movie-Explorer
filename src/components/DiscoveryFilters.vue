<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { DISCOVER_FIELDS, hasInvertedRange, MOVIE_LANGUAGES, MOVIE_SORTS } from '@/catalogue/movieFilters.js'
import { TV_SORTS } from '@/catalogue/tvFilters.js'

const props = defineProps({ active: { type: Object, required: true }, television: Boolean })
const emit = defineEmits(['apply'])

const movieFields = [
  { key: 'from', label: 'Release year from', hint: '1000–9999' },
  { key: 'to', label: 'Release year to', hint: '1000–9999' },
  { key: 'rating', label: 'Minimum average rating', hint: '0.1–10', inputmode: 'decimal' },
  { key: 'votes', label: 'Minimum vote count', hint: '1–2147483647' },
  { key: 'runtimeMin', label: 'Minimum runtime (minutes)', hint: '1–1440' },
  { key: 'runtimeMax', label: 'Maximum runtime (minutes)', hint: '1–1440' },
]
const fields = props.television
  ? movieFields.slice(0, 4).map(field => ({ ...field, label: field.label.replace('Release year', 'First-air year') }))
  : movieFields

const languageOptions = Object.entries(MOVIE_LANGUAGES).sort((a, b) => a[1].localeCompare(b[1], 'en'))
const sortOptions = Object.entries(props.television ? TV_SORTS : MOVIE_SORTS).filter(([key]) => key !== 'popular')
const keys = [...fields.map(field => field.key), 'language', 'sort']
const draft = reactive({})
const attempted = ref(false)

watch(() => keys.map(key => props.active[key] ?? '').join('|'), () => {
  for (const key of keys) draft[key] = props.active[key] ?? ''
  attempted.value = false
}, { immediate: true })

const errors = computed(() => {
  const problems = {}
  for (const { key, hint } of fields) {
    if (draft[key] && !DISCOVER_FIELDS[key][0](draft[key])) problems[key] = 'Enter a value from ' + hint + '.'
  }
  if (!problems.from && !problems.to && hasInvertedRange(draft.from, draft.to)) {
    problems.to = 'The final year must be at least the starting year.'
  }
  if (!problems.runtimeMin && !problems.runtimeMax && hasInvertedRange(draft.runtimeMin, draft.runtimeMax)) {
    problems.runtimeMax = 'The maximum must be at least the minimum.'
  }
  return problems
})

function apply() {
  attempted.value = true
  if (Object.keys(errors.value).length) return
  emit('apply', { ...draft })
  attempted.value = false
}

function resetDraft() {
  for (const key of keys) draft[key] = ''
  apply()
}
</script>

<template>
  <details class="cinema-filter mb-5">
    <summary class="ui-focus min-h-11 cursor-pointer rounded-xl px-4 py-2.5 font-semibold cinema-ink">
      Advanced filters and sort
    </summary>
    <form class="space-y-4 border-t cinema-line p-4" @submit.prevent="apply">
      <p class="text-sm cinema-muted">
        Apply a year range to replace an exact year. Set a minimum vote count to exclude titles with few votes.
      </p>
      <div class="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <div v-for="field in fields" :key="field.key" class="min-w-0">
          <label :for="'discover-' + field.key" class="block text-sm font-medium">{{ field.label }}</label>
          <input :id="'discover-' + field.key" v-model.trim="draft[field.key]" class="catalogue-filter-control"
            :inputmode="field.inputmode ?? 'numeric'" :placeholder="field.hint"
            :aria-invalid="attempted && Boolean(errors[field.key]) || undefined"
            :aria-describedby="attempted && errors[field.key] ? 'filter-error-' + field.key : undefined">
          <p v-if="attempted && errors[field.key]" :id="'filter-error-' + field.key" class="mt-1 text-sm cinema-error">
            {{ errors[field.key] }}
          </p>
        </div>
        <div class="min-w-0">
          <label for="discover-language" class="block text-sm font-medium">Original language</label>
          <select id="discover-language" v-model="draft.language" class="catalogue-filter-control">
            <option value="">All languages</option>
            <option v-for="[code, label] in languageOptions" :key="code" :value="code">{{ label }}</option>
          </select>
        </div>
        <div class="min-w-0">
          <label for="discover-sort" class="block text-sm font-medium">Sort discovery</label>
          <select id="discover-sort" v-model="draft.sort" class="catalogue-filter-control">
            <option value="">Most popular</option>
            <option v-for="[key, [label]] in sortOptions" :key="key" :value="key">
              {{ label }}
            </option>
          </select>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <button class="state-action" type="submit">Apply filters</button>
        <button class="catalogue-page-link" type="button" @click="resetDraft">Reset advanced filters</button>
      </div>
    </form>
  </details>
</template>
