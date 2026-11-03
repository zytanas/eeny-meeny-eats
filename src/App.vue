<script setup>
import { RouterLink, RouterView } from 'vue-router'
import BrandWordmark from '@/components/BrandWordmark.vue'
</script>

<template>
  <header class="app-header">
    <RouterLink to="/" class="brand" aria-label="Eeny Meeny Eats, home">
      <BrandWordmark />
    </RouterLink>
  </header>
  <main class="app-main">
    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </main>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 1000; /* above Leaflet panes */
  display: flex;
  align-items: center;
  height: var(--header-total);
  padding: env(safe-area-inset-top) var(--pad-right) 0 var(--pad-left);
  background: var(--color-bg);
  border-bottom: var(--outline);
}

.brand {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0.25rem 0.1rem;
  border-radius: var(--radius-sm);
  color: var(--color-ink);
  text-decoration: none;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
