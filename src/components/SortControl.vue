<script setup>
import { computed } from 'vue'
import { useFiltersStore, SORT_OPTIONS } from '@/stores/filters'
import { usePlacesStore } from '@/stores/places'

const filters = useFiltersStore()
const places = usePlacesStore()

// "Top rated" only makes sense when the places have ratings
const options = computed(() => SORT_OPTIONS.filter((opt) => opt.value !== 'rating' || places.hasRatings))
</script>

<template>
  <label v-if="options.length > 1" class="sort">
    <span class="visually-hidden">Sort by</span>
    <select v-model="filters.sortBy">
      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
  </label>
</template>

<style scoped>
.sort select {
  min-height: max(42px, var(--tap-min));
  max-width: 100%;
  padding: 0 2.25rem 0 1rem;
  border: var(--outline);
  border-radius: var(--radius-pill);
  background: var(--color-card)
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%23141414' stroke-width='2.5'/%3E%3C/svg%3E")
    no-repeat right 0.9rem center;
  box-shadow: var(--shadow-sm);
  font-weight: 700;
  appearance: none;
  cursor: pointer;
}
</style>
