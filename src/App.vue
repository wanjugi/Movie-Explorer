<script setup>
import { RouterView } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'

</script>

<template>
  <div class="flex flex-col min-h-screen bg-gray-300">
    <AppHeader />

    <main class="container mx-auto p-4">
      <RouterView />
    </main>

    <AppFooter />

  </div>
</template>

<style scoped></style>
