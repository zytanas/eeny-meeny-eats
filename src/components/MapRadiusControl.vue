<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useFiltersStore, DISTANCE_OPTIONS } from '@/stores/filters'
import { usePlacesStore } from '@/stores/places'

// Radius chips that float on the map. They edit the same filter as the Distance chips in
// FilterPanel, so the two always agree; ExploreView reruns the search when it changes.
const filters = useFiltersStore()
const places = usePlacesStore()

// Widening can go past the biggest chip (to 10 km); that radius shows as a status pill, not a button
const extraKm = computed(() => (DISTANCE_OPTIONS.includes(places.searchRadiusKm) ? null : places.searchRadiusKm))

// The chips stay on one row. They fit down to 320px wide; if they ever don't (big text
// settings), the row scrolls sideways, and the radius in use is scrolled into view.
const chipsEl = ref(null)
async function revealUsedChip() {
  await nextTick()
  const row = chipsEl.value
  const chip = row?.querySelector('.is-used')
  if (!row || !chip || row.scrollWidth <= row.clientWidth) return
  const left = chip.offsetLeft - row.offsetLeft
  if (left < row.scrollLeft) row.scrollLeft = left - 4
  else if (left + chip.offsetWidth > row.scrollLeft + row.clientWidth) {
    row.scrollLeft = left + chip.offsetWidth - row.clientWidth + 6
  }
}
watch(() => places.searchRadiusKm, revealUsedChip)
onMounted(revealUsedChip)

// Tabbing to a chip scrolls it into view
function revealFocused(event) {
  event.target.scrollIntoView({ block: 'nearest', inline: 'nearest' })
}
</script>

<template>
  <div class="radius-control" role="group" aria-label="Search radius">
    <div ref="chipsEl" class="chips" @focusin="revealFocused">
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
/* Top-right corner: clear of the zoom buttons (top-left) and the attribution (bottom-right).
   Pinned on both sides, so the row has a definite width to fit (or scroll) in. */
.radius-control {
  --chip-gap: 6px;
  --chip-pad: 0.8rem;

  position: absolute;
  /* 10px from the edges once the row's own 6px padding is counted */
  top: 4px;
  right: 4px;
  left: 58px; /* clear of the 44px zoom buttons at 10px */
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0;
  pointer-events: none; /* the empty space beside the chips still drags the map */
}

/* One row, right-aligned while it fits. When it doesn't, it scrolls from its first chip:
   the row itself is right-aligned (align-items above) and its chips start at the left, so
   no chip ends up cut off and out of reach (as justify-content: flex-end would do). */
.chips {
  display: flex;
  flex-wrap: nowrap;
  gap: var(--chip-gap);
  max-width: 100%;
  padding: 6px; /* room for the shadows, focus ring and pop inside the scroll box */
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  pointer-events: auto; /* so the row can be swiped when it scrolls */
}

.chips::-webkit-scrollbar {
  display: none;
}

/* Narrow phones: tighter chips, so 1, 2, 5 and a widened 10 km fit in one row at 320px */
@media (max-width: 420px) {
  .radius-control {
    --chip-gap: 4px;
    --chip-pad: 0.45rem;
    --chip-font: 0.85rem;
  }
}

/* Small sticker chips, same feel as the filter panel's */
.radius-chip {
  flex: none;
  display: inline-flex;
  align-items: center;
  min-height: var(--tap-min);
  padding: 0 var(--chip-pad);
  border: 2px solid var(--color-ink);
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  box-shadow: 2px 2px 0 var(--color-ink);
  color: var(--color-ink);
  font-size: var(--chip-font, 0.9rem);
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
  margin: 0 6px 0 0; /* lines up with the chips (the row's right padding) */
  max-width: min(18rem, 100%);
  padding: 0.3rem 0.65rem;
  border: 2px solid var(--color-ink);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
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
