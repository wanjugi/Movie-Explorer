<script setup>
import { RouterView, useRouter } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import { defineAsyncComponent, onScopeDispose } from 'vue'
import { trailerSession } from './composables/trailerSession.js'

const TrailerExperience = defineAsyncComponent(() => import('./components/TrailerExperience.vue'))
const { active: trailer } = trailerSession
const removeRouteGuard = useRouter().beforeEach(() => { trailerSession.close(trailer.value, false) })
onScopeDispose(removeRouteGuard)

</script>

<template>
  <div class="app-shell">
    <a href="#main-content" class="skip-link">Skip to content</a>
    <AppHeader />

    <main id="main-content" tabindex="-1" class="app-main">
      <RouterView v-slot="{ Component, route }">
        <Transition name="route-reveal">
          <div :key="route.name" :class="route.name === 'home' ? '' : 'content-frame route-frame'">
            <component :is="Component" />
          </div>
        </Transition>
      </RouterView>
    </main>

    <AppFooter />
    <TrailerExperience v-if="trailer" :key="trailer.key" :session="trailer" />

  </div>
</template>
