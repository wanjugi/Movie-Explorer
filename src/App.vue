<script setup>
import { RouterView } from 'vue-router'
import AppHeader from './components/AppHeader.vue'

</script>

<template>
  <div>
    <AppHeader />

    <main class="container mx-auto p-4">
      <RouterView />
    </main>
    
  </div>
</template>

<style scoped></style>
