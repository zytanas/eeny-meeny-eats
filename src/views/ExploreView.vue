<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useLocationStore } from '@/stores/location'
import { usePlacesStore } from '@/stores/places'
import { useFiltersStore } from '@/stores/filters'
import { MEDIA, useMediaQuery } from '@/utils/breakpoints'
import MapView from '@/components/MapView.vue'
import MapRadiusControl from '@/components/MapRadiusControl.vue'
import PlaceList from '@/components/PlaceList.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import FilterSheet from '@/components/FilterSheet.vue'
import SortControl from '@/components/SortControl.vue'
import RandomizerButton from '@/components/RandomizerButton.vue'
import LocationPanel from '@/components/LocationPanel.vue'
import PlaceCardSkeleton from '@/components/PlaceCardSkeleton.vue'

// Layout by breakpoint:
//   mobile   list OR map, picked with the sticky List/Map toggle (list first)
//   tablet   map on top (~40% of the screen), 2-column card grid below
//   desktop  map on the left, list column on the right; each scrolls on its own
const copy = {
  viewToggle: 'Show as',
  list: 'List',
  map: 'Map',
  otherMatches: 'Not the right spot?',
  dismissMatches: 'Dismiss other matches',
  loading: 'Loading nearby places…',
  near: 'near',
  of: 'of',
  change: 'Change',
}

// Enough placeholder cards to fill the visible list; CSS shows 2 on mobile, 4 on tablet, 3 on desktop
const SKELETON_COUNT = 4

const router = useRouter()
const location = useLocationStore()
const places = usePlacesStore()
const filters = useFiltersStore()

// Filters drop open inline on desktop, and open as a sheet / side panel below that
const isDesktop = useMediaQuery(MEDIA.desktop)

const mobileView = ref('list') // 'list' | 'map' (ignored from tablet up, where both show)
const mapView = ref(null)
const showFilters = ref(false)
const locationPanel = ref(null)
const changeLocationBtn = ref(null)
const panelOpen = ref(false)
const announcement = ref('')

onMounted(() => places.loadNearby())

// A new location (from the panel) or distance (from the filters or the map's radius chips) reloads
// the list; the map redraws its search circle and zooms to it. Other filters live in their own store, so they carry over untouched.
watch(
  () => [location.center, filters.maxDistanceKm],
  async () => {
    await places.loadNearby()
    if (places.error) {
      announcement.value = ''
      return
    }
    const widened = places.widened ? `Widened to ${places.radiusKm} km to find more places. ` : ''
    announcement.value = `${widened}Showing ${places.filteredPlaces.length} places within ${places.radiusKm} km of ${location.label}`
  },
)

// The map was hidden or resized, so Leaflet needs to re-measure it (MapView also
// does this on any resize; this makes the List/Map switch immediate)
async function setMobileView(view) {
  mobileView.value = view
  await nextTick()
  mapView.value?.invalidateSize()
  updateDymFade() // the chip row can't be measured while the list is hidden
}

function openLocationPanel() {
  locationPanel.value.open(changeLocationBtn.value)
}

// Picking or dismissing removes the chips, including the focused button, so hand focus to the
// location button instead of dropping it back to the page
function chooseAlternative(alt) {
  location.chooseAlternative(alt)
  changeLocationBtn.value?.focus()
}

// "Not the right spot?" row: on touch screens it scrolls sideways, with a fade on the right
// while there's more to see. (On mouse screens it wraps, never overflows, so no fade.)
const dymChips = ref(null)
const dymHasMore = ref(false)
function updateDymFade() {
  const el = dymChips.value
  dymHasMore.value = !!el && el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}
watch(() => location.alternatives, async () => {
  await nextTick()
  updateDymFade()
})
onMounted(() => {
  updateDymFade()
  window.addEventListener('resize', updateDymFade)
})
onBeforeUnmount(() => window.removeEventListener('resize', updateDymFade))

// Tabbing to a chip scrolls it fully into view, clear of the fade (scroll-padding in CSS)
function revealDymChip(event) {
  event.target.scrollIntoView({ block: 'nearest', inline: 'nearest' })
}

function dismissAlternatives() {
  location.alternatives = []
  changeLocationBtn.value?.focus()
}

function openPlace(id) {
  router.push({ name: 'place', params: { id } })
}
</script>

<template>
  <div class="explore" :class="`show-${mobileView}`">
    <div class="view-toggle" role="group" :aria-label="copy.viewToggle">
      <button
        v-for="view in ['list', 'map']"
        :key="view"
        type="button"
        class="view-btn"
        :aria-pressed="mobileView === view"
        @click="setMobileView(view)"
      >
        <span aria-hidden="true">{{ view === 'list' ? '☰' : '📍' }}</span>
        {{ copy[view] }}
      </button>
    </div>

    <MapView
      ref="mapView"
      class="explore-map"
      :center="location.center"
      :places="places.filteredPlaces"
      :radius-km="places.searchRadiusKm"
      :center-label="location.area || (location.hasLocation ? 'You are here' : location.label)"
      :bottom-inset="isDesktop ? 104 : 0"
      @select="openPlace"
    >
      <MapRadiusControl />
    </MapView>

    <div class="explore-side">
      <section class="explore-panel">
        <div class="toolbar">
          <h1 class="summary display">
            <!-- Two lines: "183 places within 2 km" / "of <location> ✎ Change". The second line never
                 wraps: the name truncates with an ellipsis between "of" and the Change tag. The full name
                 stays in the DOM (so screen readers read all of it) and in the title for mouse users. -->
            <span class="summary-line">
              <!-- No stale count while loading; a placeholder pill holds its place -->
              <span v-if="places.loading" class="summary-count summary-count--skeleton" aria-hidden="true"></span>
              <span v-else class="summary-count">{{ places.filteredPlaces.length }}</span>
              {{ places.radiusKm ? `places within ${places.radiusKm} km` : 'places' }}
            </span>
            <span class="summary-line summary-where">
              <button
                ref="changeLocationBtn"
                type="button"
                class="change-location"
                aria-haspopup="dialog"
                aria-controls="location-panel"
                :aria-expanded="panelOpen"
                :title="location.label"
                @click="openLocationPanel"
              >
                <span class="where-of">{{ places.radiusKm ? copy.of : copy.near }}</span>{{ ' ' }}<span class="location-name">{{ location.label }}</span>{{ ' ' }}<span class="change-tag"><span aria-hidden="true">✎</span> {{ copy.change }}</span>
              </button>
            </span>
          </h1>
          <!-- One sideways-scrolling row, so the chips never push the place list down -->
          <div v-if="location.alternatives.length" class="did-you-mean">
            <span id="dym-label" class="dym-label">{{ copy.otherMatches }}</span>
            <div class="dym-row">
              <ul
                ref="dymChips"
                class="dym-chips"
                :class="{ 'has-more': dymHasMore }"
                aria-labelledby="dym-label"
                @scroll.passive="updateDymFade"
                @focusin="revealDymChip"
              >
                <li v-for="alt in location.alternatives" :key="`${alt.lat},${alt.lon}`">
                  <button type="button" class="dym-chip" :title="alt.shortLabel" @click="chooseAlternative(alt)">
                    <span class="dym-chip-text">{{ alt.shortLabel }}</span>
                  </button>
                </li>
              </ul>
              <button type="button" class="dym-dismiss" :aria-label="copy.dismissMatches" @click="dismissAlternatives">
                <span aria-hidden="true">×</span>
              </button>
            </div>
          </div>
          <LocationPanel ref="locationPanel" @open-change="panelOpen = $event" />
          <p class="visually-hidden" aria-live="polite">{{ announcement }}</p>
          <SortControl />
          <button
            class="btn btn-secondary filter-toggle"
            :class="{ 'is-open': showFilters }"
            :aria-expanded="showFilters"
            aria-controls="filter-panel"
            :aria-haspopup="isDesktop ? undefined : 'dialog'"
            @click="showFilters = !showFilters"
          >
            Filters
            <span v-if="filters.activeCount" class="badge">{{ filters.activeCount }}</span>
          </button>
        </div>

        <Transition name="drop">
          <FilterPanel v-if="isDesktop && showFilters" id="filter-panel" />
        </Transition>
        <FilterSheet v-if="!isDesktop" id="filter-panel" v-model:open="showFilters" />

        <div class="results" :aria-busy="places.loading ? 'true' : 'false'">
          <Transition name="fade" mode="out-in">
            <div v-if="places.loading" key="loading">
              <p class="visually-hidden" role="status">{{ copy.loading }}</p>
              <ul class="skeleton-list" aria-hidden="true">
                <li v-for="n in SKELETON_COUNT" :key="n"><PlaceCardSkeleton /></li>
              </ul>
            </div>
            <p v-else-if="places.error" key="error" class="error status" role="alert">
              {{ places.error }}
              <button class="btn btn-secondary" @click="places.loadNearby({ force: true })">Retry</button>
            </p>
            <PlaceList v-else key="list" :places="places.filteredPlaces" />
          </Transition>
        </div>
      </section>

      <div class="randomizer-dock">
        <RandomizerButton />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ==========================================================================
   Mobile (default): list or map, switched with the sticky toggle
   ========================================================================== */
.explore {
  /* Room the floating "Pick for me" button needs at the bottom of the screen:
     button + its offset shadow + gap above and below + the home-indicator area */
  --randomizer-height: clamp(54px, 50px + 0.8vw, 60px); /* read by RandomizerButton */
  --dock-gap: 16px;
  --dock-space: calc(var(--randomizer-height) + 8px + var(--dock-gap) * 2 + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  flex: 1;
}

.view-toggle {
  position: sticky;
  top: var(--header-total);
  z-index: 900; /* below the header, above the list */
  display: flex;
  gap: 0.4rem;
  padding: 0.6rem var(--pad-right) 0.6rem var(--pad-left);
  background: var(--color-bg);
  border-bottom: var(--outline);
}

/* Segmented sticker buttons; the active one flips to ink */
.view-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 44px;
  border: var(--outline);
  border-radius: var(--radius-pill);
  background: var(--color-card);
  box-shadow: var(--shadow-sm);
  font-family: var(--font-display);
  font-size: 1.15rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform var(--dur-press) ease-out,
    box-shadow var(--dur-press) ease-out,
    background-color var(--dur-fast);
}

.view-btn[aria-pressed='true'] {
  background: var(--color-ink);
  color: var(--color-bg);
  box-shadow: 3px 3px 0 var(--color-ink);
}

.view-btn:active {
  transform: translate(3px, 3px) scale(0.97);
  box-shadow: none;
}

.explore-map {
  display: none;
}

/* Map view: the map fills the screen above a reserved strip for "Pick for me",
   so the button never sits on top of the map or its attribution */
.show-map {
  flex: none; /* a flex-basis would override the height */
  height: calc(100dvh - var(--header-total));
  padding-bottom: var(--dock-space);
}

.show-map .explore-map {
  display: block;
  flex: 1;
  min-height: 0;
  border-bottom: var(--outline);
}

.show-map .explore-panel {
  display: none;
}

.explore-panel {
  flex: 1;
  padding: var(--gutter) var(--pad-right) var(--dock-space) var(--pad-left);
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.summary {
  flex: 1 1 100%;
  min-width: 0; /* lets the location line shrink and truncate instead of widening the toolbar */
  margin: 0 0 0.25rem;
  font-size: clamp(1.6rem, 1.3rem + 1.5vw, 2.2rem);
}

.summary-line {
  display: block;
}

/* Smaller than the count line; long names ("Legazpi Village, Makati, Metro Manila") truncate */
.summary-where {
  margin-top: 0.15em;
  font-size: 0.75em;
}

/* Count as a strawberry sticker */
.summary-count {
  display: inline-block;
  margin-right: 0.15em;
  padding: 0 0.4em;
  border: var(--outline);
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  color: var(--color-ink);
  box-shadow: var(--shadow-sm);
  transform: rotate(-3deg);
}

/* The same sticker, empty, while the count loads */
.summary-count--skeleton {
  width: 2.2em;
  height: 1em;
  vertical-align: -0.1em;
  background: color-mix(in srgb, var(--color-primary) 35%, var(--color-card));
  animation: count-pulse 1.2s ease-in-out infinite alternate;
}

@keyframes count-pulse {
  to { background: color-mix(in srgb, var(--color-primary) 15%, var(--color-card)); }
}

@media (prefers-reduced-motion: reduce) {
  .summary-count--skeleton {
    animation: none;
  }
}

/* "of <name> ✎ Change" is one button, on one line, that opens the "change location" panel.
   "of" and the tag keep their size; only the name shrinks, with an ellipsis. */
.change-location {
  display: flex;
  align-items: center;
  gap: 0.3em;
  max-width: 100%;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  text-transform: inherit;
  white-space: nowrap;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.where-of {
  flex: none;
}

.location-name {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  /* Room inside the clipped box for the offset underline */
  padding-bottom: 10px;
  margin-bottom: -10px;
  text-decoration: underline;
  text-decoration-thickness: 4px;
  text-decoration-color: var(--color-primary);
  text-underline-offset: 5px;
}
/* Other matches for the typed area, as stickers like .change-tag */
.did-you-mean {
  flex: 1 1 100%;
  min-width: 0; /* lets the chip row scroll instead of widening the page */
  margin-top: -0.25rem;
}

.dym-label {
  display: block;
  margin-bottom: 0.2rem;
  font-weight: 800;
  font-size: 0.875rem;
}

.dym-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.dym-chips {
  display: flex;
  flex: 1;
  gap: 0.4rem;
  min-width: 0;
  margin: 0;
  padding: 3px 4px 5px 3px; /* room for the sticker shadow and hover tilt inside the scroll box */
  list-style: none;
  overflow-x: auto;
  scrollbar-width: thin;
  scroll-padding-inline: 3px 2.5rem; /* a chip tabbed into view clears the fade */
}

/* More to scroll: fade the right edge so the cut-off chip reads as "keep going" */
.dym-chips.has-more {
  -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 2.5rem), transparent);
  mask-image: linear-gradient(to right, #000 calc(100% - 2.5rem), transparent);
}

.dym-chips li {
  flex: none;
  min-width: 0;
}

/* Capped width, so a long name ("Petron TPLEX - KM 134 Southbound, …") never fills the row
   and the next chip always peeks in; the full name is in the title */
.dym-chip {
  display: inline-flex;
  align-items: center;
  max-width: min(16rem, 62vw);
  min-height: max(44px, var(--tap-min)); /* --tap-min is only 40px on mouse screens */
  padding: 0.3em 0.8em;
  border: 2px solid var(--color-ink);
  border-radius: var(--radius-pill);
  background: var(--color-card);
  box-shadow: 2px 2px 0 var(--color-ink);
  color: inherit;
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform var(--dur-press) ease-out,
    box-shadow var(--dur-press) ease-out;
}

.dym-chip-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Touch screens: swipe sideways, no scrollbar (the fade shows there's more) */
@media (hover: none) {
  .dym-chips {
    scrollbar-width: none;
  }

  .dym-chips::-webkit-scrollbar {
    display: none;
  }
}

/* Mouse screens: no sideways scrolling; the chips wrap onto rows, the × stays top right */
@media (hover: hover) and (pointer: fine) {
  .dym-row {
    align-items: flex-start;
  }

  .dym-chips {
    flex-wrap: wrap;
    overflow-x: visible;
  }

  .dym-chips.has-more {
    -webkit-mask-image: none;
    mask-image: none;
  }
}

@media (hover: hover) {
  .dym-chip:hover {
    transform: rotate(-3deg) scale(1.04);
  }
}

.dym-chip:active {
  transform: translate(2px, 2px) scale(0.96);
  box-shadow: none;
}

.dym-dismiss {
  flex: none;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 2px solid var(--color-ink);
  border-radius: 50%;
  background: transparent;
  color: inherit;
  font-family: var(--font-body);
  font-size: 1.4rem;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.dym-dismiss:active {
  transform: scale(0.92);
}

.change-tag {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 0.25em;
  margin-left: 0.15em;
  padding: 0.15em 0.6em;
  border: 2px solid var(--color-ink);
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  box-shadow: 2px 2px 0 var(--color-ink);
  font-family: var(--font-body);
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: none;
  white-space: nowrap;
  transition:
    transform var(--dur-press) ease-out,
    box-shadow var(--dur-press) ease-out;
}

@media (hover: hover) {
  .change-location:hover .change-tag {
    transform: rotate(-4deg) scale(1.06);
  }
}

.change-location:active .change-tag {
  transform: translate(2px, 2px) scale(0.94);
  box-shadow: none;
}

.filter-toggle {
  min-height: max(42px, var(--tap-min));
  padding: 0 1rem;
}

.filter-toggle.is-open {
  background: var(--color-ink);
  color: var(--color-bg);
}

.badge {
  display: grid;
  place-items: center;
  min-width: 22px;
  height: 22px;
  border: 2px solid var(--color-ink);
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  color: var(--color-ink);
  font-size: 0.75rem;
  font-weight: 800;
}

/* Placeholder cards in the same grid as PlaceList: 2 on mobile, 4 on tablet, 3 on desktop */
.skeleton-list {
  display: grid;
  gap: 1.1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.skeleton-list li:nth-child(n + 3) {
  display: none;
}

@media (min-width: 640px) {
  .skeleton-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .skeleton-list li:nth-child(n + 3) {
    display: block;
  }
}

@media (min-width: 1024px) {
  .skeleton-list {
    grid-template-columns: minmax(0, 1fr);
  }

  .skeleton-list li:nth-child(n + 4) {
    display: none;
  }
}

.status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

/* Fixed to the bottom of the screen, clear of the notch/home indicator.
   Positioning lives on a wrapper so the button's press transform doesn't fight it. */
.randomizer-dock {
  position: fixed;
  left: 50%;
  bottom: calc(var(--dock-gap) + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 1000;
}

/* ==========================================================================
   Tablet: map on top, card grid below, no toggle
   ========================================================================== */
@media (min-width: 640px) {
  .view-toggle {
    display: none;
  }

  .show-map {
    flex: 1;
    height: auto;
    padding-bottom: 0;
  }

  .explore-map,
  .show-map .explore-map {
    display: block;
    flex: none;
    height: clamp(200px, 40dvh, 520px);
    border-bottom: var(--outline);
  }

  .show-map .explore-panel {
    display: block;
  }
}

/* ==========================================================================
   Desktop: map fills the left, fixed-width list column on the right,
   each scrolling on its own (the page itself doesn't scroll)
   ========================================================================== */
@media (min-width: 1024px) {
  .explore,
  .show-map {
    /* 420px at 1024 wide, growing to 480px at 1440 */
    --list-col: clamp(420px, 14.4vw + 272px, 480px);
    display: grid;
    grid-template-columns: minmax(0, 1fr) var(--list-col);
    grid-template-rows: minmax(0, 1fr);
    flex: none; /* a flex-basis would override the height */
    height: calc(100dvh - var(--header-total));
    overflow: hidden;
  }

  .explore-map,
  .show-map .explore-map {
    height: auto; /* stretches to the grid row */
    border-right: var(--outline);
    border-bottom: 0;
  }

  .explore-side {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .explore-panel {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-left: var(--gutter);
  }

  /* The list column is narrow, so a smaller location line fits more of the name
     before the ellipsis kicks in */
  .summary-where {
    font-size: 0.62em;
  }

  /* Centered at the bottom of the map, lifted clear of its attribution line */
  .randomizer-dock {
    left: calc((100vw - var(--list-col)) / 2);
    bottom: calc(var(--dock-gap) + 24px + env(safe-area-inset-bottom));
  }
}
</style>
