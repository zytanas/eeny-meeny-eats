<script setup>
import { computed } from 'vue'
import { useFiltersStore, DISTANCE_OPTIONS } from '@/stores/filters'
import { usePlacesStore } from '@/stores/places'

// Radius chips that float on the map. They edit the same filter as the Distance chips in
// FilterPanel, so the two always agree; ExploreView reruns the search when it changes.
const filters = useFiltersStore()
const places = usePlacesStore()

// Widening can go past the biggest chip (to 10 km); that radius shows as a status pill, not a button
const extraKm = computed(() => (DISTANCE_OPTIONS.includes(places.searchRadiusKm) ? null : places.searchRadiusKm))
</script>

<template>
  <div class="radius-control" role="group" aria-label="Search radius">
    <div class="chips">
      <button
        v-for="km in DISTANCE_OPTIONS"
        :key="km"
        type="button"
        class="radius-chip"
        :class="{
          'is-used': places.searchRadiusKm === km,
          'is-picked': filters.maxDistanceKm === km && places.searchRadiusKm !== km,
        }"
        :aria-pressed="filters.maxDistanceKm === km"
        :aria-describedby="places.widened && places.searchRadiusKm === km ? 'radius-note' : undefined"
        @click="filters.maxDistanceKm = km"
      >
        {{ km }} km
      </button>
      <span v-if="extraKm" class="radius-chip is-used">{{ extraKm }} km</span>
    </div>

    <Transition name="fade">
      <p v-if="places.widened" id="radius-note" class="radius-note">
        Widened to {{ places.radiusKm }} km to find more places.
      </p>
    </Transition>
  </div>
</template>

<style scoped>
/* Top-right corner: clear of the zoom buttons (top-left) and the attribution (bottom-right) */
.radius-control {
  position: absolute;
  top: 10px;
  right: 10px;
  max-width: calc(100% - 76px); /* never reaches the 44px zoom buttons */
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  pointer-events: none; /* the gaps between chips still drag the map */
}

.chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

/* Small sticker chips, same feel as the filter panel's */
.radius-chip {
  display: inline-flex;
  align-items: center;
  min-height: var(--tap-min);
  padding: 0 0.8rem;
  border: 2px solid var(--color-ink);
  border-radius: var(--radius-pill);
  background: var(--color-card);
  box-shadow: 2px 2px 0 var(--color-ink);
  color: var(--color-ink);
  font-size: 0.9rem;
  font-weight: 800;
  white-space: nowrap;
  pointer-events: auto;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform var(--dur-press) ease-out,
    box-shadow var(--dur-press) ease-out,
    background-color var(--dur-fast);
}

button.radius-chip:active {
  transform: translate(2px, 2px) scale(0.95);
  box-shadow: 0 0 0 var(--color-ink);
}

/* The radius actually searched: mango with a check, and pops */
.radius-chip.is-used {
  background: var(--color-accent);
  animation: chip-pop var(--dur-pop) var(--ease-pop);
}

.radius-chip.is-used::before {
  content: '✓\00a0';
}

span.radius-chip {
  cursor: default;
}

/* The user's pick, when the search had to go wider than it */
.radius-chip.is-picked {
  border-style: dashed;
  box-shadow: none;
}

.radius-chip:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

.radius-note {
  margin: 0;
  max-width: 18rem;
  padding: 0.3rem 0.65rem;
  border: 2px solid var(--color-ink);
  border-radius: var(--radius-sm);
  background: var(--color-card);
  box-shadow: 2px 2px 0 var(--color-ink);
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1.3;
  text-align: right;
  pointer-events: auto;
}

@keyframes chip-pop {
  0% { transform: scale(1); }
  40% { transform: scale(1.15) rotate(-4deg); }
  100% { transform: scale(1); }
}
</style>
