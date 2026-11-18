<script setup>
import { ref, computed, nextTick } from 'vue'
import { useLocationStore } from '@/stores/location'

// Area chips for LocationForm's `after-input` slot: the user's recent searches and, optionally,
// a set of quick picks. A recent chip runs the form's `search` straight away, so it behaves
// exactly like typing the area; a quick pick runs `choose` with its preset coordinates, with no
// lookup (the form emits `located` either way).
// Used by Home (recents + quick picks) and Explore's "change location" panel (recents only).
const props = defineProps({
  // The `search` and `choose` functions LocationForm passes to its slot
  search: { type: Function, required: true },
  choose: { type: Function, default: null }, // required with quickPicks
  // Keeps label ids unique if two forms are ever on screen
  idPrefix: { type: String, default: 'location' },
  quickPicks: { type: Boolean, default: false },
})

// All text for the chips, in one place for easy editing
const copy = {
  recentLabel: 'Recent',
  clearRecent: 'Clear',
  clearRecentLabel: 'Clear recent searches',
  quickPicksLabel: 'Quick picks',
  moreAreas: 'More areas',
}

// The search covers ~2 km, so these are specific spots ("place, city"), not whole cities.
// Preset central points, so tapping one is instant, uses no Geoapify credits, and can't land on
// the wrong spot ("BGC, Taguig" geocodes to a bus stop). `label` is the chip text and becomes the
// location's name. Ordered Luzon, then Visayas, then Mindanao.
const quickPickAreas = [
  { label: 'Tomas Morato, Quezon City', lat: 14.6335, lon: 121.0345 },
  { label: 'Legazpi Village, Makati', lat: 14.5548, lon: 121.0177 },
  { label: 'BGC, Taguig', lat: 14.5508, lon: 121.051 },
  { label: 'Kapitolyo, Pasig', lat: 14.5716, lon: 121.0597 },
  { label: 'Session Road, Baguio', lat: 16.412, lon: 120.5985 },
  { label: 'Tagaytay Rotonda', lat: 14.1063, lon: 120.9624 },
  { label: 'Urbiztondo, San Juan, La Union', lat: 16.6715, lon: 120.3328 },
  { label: 'Calle Crisologo, Vigan', lat: 17.5713, lon: 120.3886 },
  { label: 'IT Park, Cebu City', lat: 10.33, lon: 123.9058 },
  { label: 'Smallville, Iloilo City', lat: 10.709, lon: 122.549 },
  { label: 'Lacson Street, Bacolod', lat: 10.6815, lon: 122.9553 },
  { label: 'Lanang, Davao City', lat: 7.099, lon: 125.631 },
  { label: 'Divisoria, Cagayan de Oro', lat: 8.4776, lon: 124.6459 },
]
// Only the first few show until "More areas" is tapped, so the card stays short
const QUICK_PICKS_SHOWN = 6

const location = useLocationStore()
const rootEl = ref(null)
const quickPicksEl = ref(null)

// The Clear button disappears with the recents, so hand focus to the first quick pick,
// or back to the area input when there are none (the panel)
async function clearRecent() {
  const input = rootEl.value?.closest('form')?.querySelector('input')
  location.clearRecentAreas()
  await nextTick()
  ;(quickPicksEl.value?.querySelector('button') ?? input)?.focus()
}

// "More areas" removes itself, so focus moves to the first newly shown chip
const showAllAreas = ref(false)
const visibleQuickPicks = computed(() =>
  showAllAreas.value ? quickPickAreas : quickPickAreas.slice(0, QUICK_PICKS_SHOWN),
)
async function expandQuickPicks() {
  showAllAreas.value = true
  await nextTick()
  quickPicksEl.value?.querySelectorAll('.chips button')[QUICK_PICKS_SHOWN]?.focus()
}
</script>

<template>
  <div ref="rootEl" class="area-chips">
    <div
      v-if="location.recentAreas.length"
      class="chip-group"
      role="group"
      :aria-labelledby="`${props.idPrefix}-recent-label`"
    >
      <div class="chip-group-head">
        <span :id="`${props.idPrefix}-recent-label`" class="chip-group-label">{{ copy.recentLabel }}</span>
        <button type="button" class="clear-link" :aria-label="copy.clearRecentLabel" @click="clearRecent">
          {{ copy.clearRecent }}
        </button>
      </div>
      <ul class="chips chips--stack">
        <li v-for="area in location.recentAreas" :key="area">
          <button type="button" class="chip chip--recent" :title="area" @click="search(area)">
            <svg class="chip-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3.5 2" />
            </svg>
            <span class="chip-text">{{ area }}</span>
          </button>
        </li>
      </ul>
    </div>

    <div
      v-if="quickPicks"
      ref="quickPicksEl"
      class="chip-group"
      role="group"
      :aria-labelledby="`${props.idPrefix}-picks-label`"
    >
      <span :id="`${props.idPrefix}-picks-label`" class="chip-group-label">{{ copy.quickPicksLabel }}</span>
      <ul class="chips chips--fill">
        <li v-for="area in visibleQuickPicks" :key="area.label">
          <button type="button" class="chip" @click="choose(area)">{{ area.label }}</button>
        </li>
        <li v-if="!showAllAreas">
          <button type="button" class="chip chip--more" @click="expandQuickPicks">
            {{ copy.moreAreas }}
            <span class="chip-more-icon" aria-hidden="true">+</span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
/* Same spacing as the form around it; collapses to nothing when there's nothing to show */
.area-chips {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.area-chips:empty {
  display: none;
}

.chip-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 0.15rem;
}

.chip-group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.chip-group-label {
  font-size: var(--text-sm);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-muted);
}

/* Small text link, with an invisible padded box so it's still easy to tap */
.clear-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin: -0.75rem -0.5rem;
  padding: 0 0.5rem;
  border: 0;
  background: none;
  color: var(--color-link);
  font-size: var(--text-sm);
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}

/* Wrap onto more lines rather than scroll sideways */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Quick picks: chips grow to fill each row, so every row ends flush with the input */
.chips--fill li {
  display: flex;
  flex: 1 1 auto;
}

.chips--fill .chip {
  flex: 1;
  justify-content: center;
  text-align: center;
}

/* Recents: one full-width row each, clock on the left, long names cut with an ellipsis */
.chips--stack {
  flex-direction: column;
  flex-wrap: nowrap;
}

.chips--stack .chip {
  width: 100%;
  justify-content: flex-start;
  text-align: left;
}

.chip-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: max(44px, var(--tap-min)); /* --tap-min is only 40px on mouse screens */
  padding: 0 0.9rem;
  border: 2px solid var(--color-ink);
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  box-shadow: 2px 2px 0 var(--color-ink);
  color: inherit;
  font-size: var(--text-sm);
  font-weight: 800;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform var(--dur-press) ease-out,
    box-shadow var(--dur-press) ease-out,
    background-color var(--dur-fast);
}

.chip:hover {
  background: var(--color-accent);
}

.chip:active {
  transform: translate(2px, 2px);
  box-shadow: 0 0 0 var(--color-ink);
}

/* Recent searches: strawberry tint with a clock, so they read as "yours".
   The pink is only ~1.2:1 against the cream surface, so the 2px ink outline, shadow
   and clock are what make it stand out; keep them. */
.chip--recent {
  background: var(--color-hero);
}

/* Dashed outline and a "+" so it reads as "show more", not another area */
.chip--more {
  border-style: dashed;
  background: transparent;
  box-shadow: none;
}

.chip-more-icon {
  font-size: 1.15em;
  line-height: 1;
}

.chip-icon {
  flex-shrink: 0;
  width: 1.1em;
  height: 1.1em;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
