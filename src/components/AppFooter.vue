<script setup>
const year = new Date().getFullYear()
</script>

<template>
  <footer class="cinema-footer">
    <p class="content-frame flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-center text-sm leading-relaxed">
      <span class="whitespace-nowrap">
        <strong class="font-semibold cinema-ink">Movie<span class="cinema-accent">Explorer</span></strong>
        © {{ year }} ·
      </span>
      <span class="whitespace-nowrap">Made by Ahmed Wanjugi</span>
    </p>
  </footer>
</template>

<style scoped>
.cinema-footer {
  padding-block: 1rem;
}
</style>
