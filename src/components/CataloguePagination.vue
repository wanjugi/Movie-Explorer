<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { pageItems, parseMoviePage } from '@/catalogue/moviePages.js'

const props = defineProps({
  page: { type: Number, required: true },
  last: { type: Number, required: true },
  locationForPage: { type: Function, required: true },
})

const router = useRouter()
const draft = ref('')
const items = computed(() => pageItems(props.page, props.last))
const jumpPage = computed(() => parseMoviePage(draft.value))
const invalidJump = computed(() => Boolean(draft.value) && (!jumpPage.value || jumpPage.value > props.last))

watch(() => props.page, () => { draft.value = '' })

function jump() {
  if (!jumpPage.value || invalidJump.value || jumpPage.value === props.page) return
  return router.push(props.locationForPage(jumpPage.value))
}
</script>

<template>
  <nav v-if="last > 1" aria-label="Results pages" class="mt-6 space-y-3">
    <ul class="flex flex-wrap items-center justify-center gap-1.5">
      <li v-for="[label, target] in [['First', 1], ['Previous', page - 1]]" :key="label">
        <RouterLink v-if="target >= 1 && target !== page" :to="locationForPage(target)"
          class="catalogue-page-link" :aria-current-value="null" :aria-label="label + ' page'">{{ label }}</RouterLink>
        <span v-else class="catalogue-page-link opacity-55" aria-disabled="true">{{ label }}</span>
      </li>
      <li v-for="(item, index) in items" :key="index">
        <span v-if="item === null" aria-hidden="true" class="px-1 cinema-muted">…</span>
        <span v-else-if="item === page" aria-current="page" class="catalogue-page-link">{{ item }}</span>
        <RouterLink v-else :to="locationForPage(item)" class="catalogue-page-link" :aria-current-value="null" :aria-label="'Page ' + item">
          {{ item }}
        </RouterLink>
      </li>
      <li v-for="[label, target] in [['Next', page + 1], ['Last', last]]" :key="label">
        <RouterLink v-if="target <= last && target !== page" :to="locationForPage(target)"
          class="catalogue-page-link" :aria-current-value="null" :aria-label="label + ' page'">{{ label }}</RouterLink>
        <span v-else class="catalogue-page-link opacity-55" aria-disabled="true">{{ label }}</span>
      </li>
    </ul>
    <form class="flex flex-wrap items-center justify-center gap-2 text-sm" @submit.prevent="jump">
      <label for="catalogue-jump">Go to page</label>
      <input id="catalogue-jump" v-model.trim="draft" inputmode="numeric"
        class="catalogue-filter-control !mt-0 !w-20"
        :aria-invalid="invalidJump || undefined" :aria-describedby="invalidJump ? 'catalogue-jump-error' : undefined">
      <button type="submit" class="state-action" :disabled="!jumpPage || invalidJump || jumpPage === page">Go</button>
      <p v-if="invalidJump" id="catalogue-jump-error" class="w-full text-center cinema-muted">Enter a page from 1 to {{ last }}.</p>
    </form>
  </nav>
</template>
