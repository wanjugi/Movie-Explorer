<script setup>
defineProps({
  title: { type: String, required: true },
  message: { type: String, default: '' },
  kind: { type: String, default: 'empty' },
  compact: Boolean,
})
</script>

<template>
  <div
    class="cinema-state"
    :class="compact ? 'mt-2 p-3 text-sm' : 'mx-auto max-w-2xl px-6 py-12 text-center sm:px-12'"
  >
    <svg
      v-if="!compact"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      class="mx-auto mb-3 h-7 w-7 cinema-accent"
    >
      <path v-if="kind === 'error'" stroke-linecap="round" d="M12 8v4m0 4h.01" />
      <circle v-if="kind === 'error'" cx="12" cy="12" r="9" />
      <template v-else>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M7 5v14m10-14v14M3 10h4m10 0h4M3 14h4m10 0h4" />
      </template>
    </svg>
    <div :role="kind === 'error' ? (compact ? 'status' : 'alert') : undefined">
      <component :is="compact ? 'p' : 'h2'" class="font-semibold" :class="compact ? '' : 'text-lg'">
        {{ title }}
      </component>
      <p v-if="message" class="mt-1 cinema-quiet">{{ message }}</p>
    </div>
    <div v-if="$slots.action" :class="compact ? 'mt-2' : 'mt-4'">
      <slot name="action" />
    </div>
  </div>
</template>
