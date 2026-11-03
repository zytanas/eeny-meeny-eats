<script setup>
import { computed } from 'vue'
import { useFiltersStore, DISTANCE_OPTIONS, PRICE_LEVELS } from '@/stores/filters'
import { usePlacesStore } from '@/stores/places'
import { formatPrice } from '@/utils/format'

const filters = useFiltersStore()
const places = usePlacesStore()

// Filters survive a location change, so keep selected cuisines visible (and untickable)
// even when the new area has none of them
const cuisineChips = computed(() => [...new Set([...places.availableCuisines, ...filters.cuisines])].sort())
</script>

<template>
  <div class="filter-panel">
    <fieldset>
      <legend>Cuisine</legend>
      <div class="chips">
        <button
          v-for="cuisine in cuisineChips"
          :key="cuisine"
          type="button"
          class="chip"
          :aria-pressed="filters.cuisines.includes(cuisine)"
          @click="filters.toggleCuisine(cuisine)"
        >
          {{ cuisine }}
        </button>
      </div>
    </fieldset>

    <fieldset>
      <legend>Distance</legend>
      <div class="chips">
        <button
          v-for="km in DISTANCE_OPTIONS"
          :key="km"
          type="button"
          class="chip"
          :aria-pressed="filters.maxDistanceKm === km"
          @click="filters.maxDistanceKm = km"
        >
          ≤ {{ km }} km
        </button>
      </div>
    </fieldset>

    <fieldset v-if="places.hasPrices">
      <legend>Price</legend>
      <div class="chips">
        <button
          v-for="level in PRICE_LEVELS"
          :key="level"
          type="button"
          class="chip"
          :aria-pressed="filters.priceLevels.includes(level)"
          @click="filters.togglePrice(level)"
        >
          {{ formatPrice(level) }}
        </button>
      </div>
    </fieldset>

    <div class="footer">
      <label class="toggle">
        <input v-model="filters.openNow" type="checkbox" class="visually-hidden" />
        <span class="switch" aria-hidden="true"></span>
        Open now
      </label>

      <button type="button" class="btn btn-secondary reset" @click="filters.reset()">
        Clear filters
      </button>
    </div>
  </div>
</template>

<style scoped>
.filter-panel {
  display: grid;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: var(--gutter);
  background: var(--color-card);
  border: var(--outline);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

fieldset {
  margin: 0;
  padding: 0;
  border: 0;
}

legend {
  margin-bottom: 0.5rem;
  font-family: var(--font-display);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Sticker chips: press down on tap, pop when switched on */
.chip {
  min-height: var(--tap-min);
  padding: 0 0.9rem;
  border: 2px solid var(--color-ink);
  border-radius: var(--radius-pill);
  background: var(--color-card);
  box-shadow: 2px 2px 0 var(--color-ink);
  font-weight: 700;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform var(--dur-press) ease-out,
    box-shadow var(--dur-press) ease-out,
    background-color 0.12s;
}

.chip:active {
  transform: translate(2px, 2px) scale(0.95);
  box-shadow: 0 0 0 var(--color-ink);
}

/* Selected: flips to an ink sticker with a check, and pops */
.chip[aria-pressed='true'] {
  background: var(--color-accent);
  color: var(--color-ink);
  box-shadow: 2px 2px 0 var(--color-ink);
  animation: chip-pop var(--dur-pop) var(--ease-pop);
}

.chip[aria-pressed='true']::before {
  content: '✓ ';
  color: var(--color-ink);
}

/* Custom switch for "Open now" (the real checkbox stays for accessibility) */
.footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 44px;
  font-weight: 700;
  cursor: pointer;
}

.switch {
  position: relative;
  width: 48px;
  height: 28px;
  border: 2px solid var(--color-ink);
  border-radius: var(--radius-pill);
  background: var(--color-bg);
  box-shadow: 2px 2px 0 var(--color-ink);
  transition: background-color 0.15s;
}

.switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-ink);
  border-radius: 50%;
  background: var(--color-card);
  transition: transform 0.2s var(--ease-pop);
}

.toggle input:checked + .switch {
  background: var(--color-primary);
}

.toggle input:checked + .switch::after {
  transform: translateX(20px);
}

.toggle input:focus-visible + .switch {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

.reset {
  min-height: var(--tap-min);
  padding: 0 1rem;
  font-size: 0.9rem;
}

@keyframes chip-pop {
  0% { transform: scale(1); }
  40% { transform: scale(1.18) rotate(-4deg); }
  100% { transform: scale(1); }
}
</style>
