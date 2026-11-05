<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
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

// Layout by breakpoint:
//   mobile   list OR map, picked with the sticky List/Map toggle (list first)
//   tablet   map on top (~40% of the screen), 2-column card grid below
//   desktop  map on the left, list column on the right; each scrolls on its own
const copy = {
  viewToggle: 'Show as',
  list: 'List',
  map: 'Map',
}

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
}

function openLocationPanel() {
  locationPanel.value.open(changeLocationBtn.value)
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
            <!-- Two lines: "183 places within 2 km" / "of <location> ✎ Change". "of" sits inside the
                 button because a button always wraps as one box; outside, it would strand on its own line.
                 The nbsp keeps "2 km" together. -->
            <span class="summary-line">
              <span class="summary-count">{{ places.filteredPlaces.length }}</span>
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
                @click="openLocationPanel"
              >
                {{ places.radiusKm ? 'of' : 'near' }}
                <span class="location-name">{{ location.label }}</span>{{ ' ' }}<span class="change-tag"><span aria-hidden="true">✎</span> Change</span>
              </button>
            </span>
          </h1>
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

        <Transition name="fade" mode="out-in">
          <p v-if="places.loading" key="loading" class="muted status">Loading nearby places…</p>
          <p v-else-if="places.error" key="error" class="error status" role="alert">
            {{ places.error }}
            <button class="btn btn-secondary" @click="places.loadNearby({ force: true })">Retry</button>
          </p>
          <PlaceList v-else key="list" :places="places.filteredPlaces" />
        </Transition>
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
  margin: 0 0 0.25rem;
  font-size: clamp(1.6rem, 1.3rem + 1.5vw, 2.2rem);
  overflow-wrap: anywhere; /* long area names can't push the page sideways */
}

.summary-line {
  display: block;
}

.summary-where {
  margin-top: 0.15em;
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

/* The location name is a button that opens the "change location" panel.
   Vertical padding on an inline box grows the tap area without moving the text. */
.change-location {
  display: inline;
  padding: 0.4em 0;
  border: 0;
  background: none;
  font: inherit;
  text-align: left;
  text-transform: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.location-name {
  text-decoration: underline;
  text-decoration-thickness: 4px;
  text-decoration-color: var(--color-primary);
  text-underline-offset: 5px;
}

.change-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25em;
  margin-left: 0.4em;
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
  vertical-align: 0.3em;
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

  /* Centered at the bottom of the map, lifted clear of its attribution line */
  .randomizer-dock {
    left: calc((100vw - var(--list-col)) / 2);
    bottom: calc(var(--dock-gap) + 24px + env(safe-area-inset-bottom));
  }
}
</style>
