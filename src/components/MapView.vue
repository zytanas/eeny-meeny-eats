<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import L from 'leaflet'
// Plugin that adds L.markerClusterGroup to the global L that Leaflet sets up
import 'leaflet.markercluster'
import { cssVar, prefersReducedMotion } from '@/utils/motion'

const props = defineProps({
  center: { type: Object, required: true }, // { lat, lon }
  places: { type: Array, default: () => [] },
  radiusKm: { type: Number, required: true }, // search radius drawn around the center
  centerLabel: { type: String, default: 'You are here' },
  bottomInset: { type: Number, default: 0 }, // px covered by something floating over the map's bottom
})

const emit = defineEmits(['select'])

const RESIZE_MS = 450
const FLY_SECONDS = 0.6
// Room for the radius chips across the top, and the attribution at the bottom
const FIT_PADDING_TOP_LEFT = [24, 64]
const FIT_PADDING_BOTTOM = 28
// The whole world, as the outer ring of the dimming mask (the search circle is its hole)
const WORLD_RING = [
  [-85, -540],
  [-85, 540],
  [85, 540],
  [85, -540],
]

const mapEl = ref(null)
let map = null
let markersLayer = null
let searchCircle = null
let outsideMask = null
let radiusLabel = null
let centerMarker = null
let resizeObserver = null
let resizeFrame = null
let shownRadiusM = 0
let hasFitted = false
// fitBounds on a hidden (0×0) map picks a nonsense zoom, so it waits until the map is visible
let pendingFit = false

onMounted(() => {
  map = L.map(mapEl.value, { zoomControl: true }).setView([props.center.lat, props.center.lon], 14)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    // Place data is from Geoapify (OpenStreetMap); tiles are from OpenStreetMap
    attribution:
      'Powered by <a href="https://www.geoapify.com/">Geoapify</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map)

  outsideMask = L.polygon([WORLD_RING], {
    stroke: false,
    fillColor: cssVar('--color-ink'),
    fillOpacity: 0.14,
    interactive: false,
  }).addTo(map)

  searchCircle = L.circle([props.center.lat, props.center.lon], {
    radius: 0,
    color: cssVar('--color-primary-strong'),
    weight: 2.5,
    dashArray: '8 6',
    fillColor: cssVar('--color-primary'),
    fillOpacity: 0.1,
    interactive: false,
  }).addTo(map)

  radiusLabel = L.marker([props.center.lat, props.center.lon], {
    icon: L.divIcon({ className: 'map-radius-label', html: '<span></span>', iconSize: [0, 0] }),
    interactive: false,
    keyboard: false,
    zIndexOffset: 900,
  }).addTo(map)

  centerMarker = L.marker([props.center.lat, props.center.lon], {
    icon: L.divIcon({ className: 'map-center-pin', html: centerPinHtml(), iconSize: [0, 0] }),
    interactive: false,
    keyboard: false,
    zIndexOffset: 1000,
  }).addTo(map)

  markersLayer = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 48,
    // Close in, every place gets its own marker again
    disableClusteringAtZoom: 17,
    animate: !prefersReducedMotion(),
    iconCreateFunction: clusterIcon,
  }).addTo(map)
  // Clusters are keyboard-focusable markers; Enter zooms in like a click does
  markersLayer.on('clusterkeypress', (e) => {
    if (e.originalEvent.key === 'Enter') e.layer.zoomToBounds({ padding: [24, 24] })
  })

  setSearchArea(props.radiusKm * 1000)
  renderMarkers()
  fitToSearchArea()

  // Any size change (window resize, List/Map toggle, breakpoint layout swap) would
  // otherwise leave gray gaps where Leaflet hasn't drawn tiles
  resizeObserver = new ResizeObserver(invalidateSize)
  resizeObserver.observe(mapEl.value)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(resizeFrame)
  resizeObserver?.disconnect()
  map?.remove()
  map = null
})

function isVisible() {
  return mapEl.value.clientWidth > 0 && mapEl.value.clientHeight > 0
}

function invalidateSize() {
  if (!map || !isVisible()) return
  map.invalidateSize()
  if (pendingFit) fitToSearchArea()
}

defineExpose({ invalidateSize })

// Zooms so the whole search circle shows. The first fit (and reduced motion) jumps there.
function fitToSearchArea() {
  if (!isVisible()) {
    pendingFit = true
    return
  }
  pendingFit = false
  const bounds = L.latLngBounds(circleRing(props.center, props.radiusKm * 1000, 16))
  const padding = {
    paddingTopLeft: FIT_PADDING_TOP_LEFT,
    paddingBottomRight: [24, Math.max(FIT_PADDING_BOTTOM, props.bottomInset)],
  }
  if (!hasFitted || prefersReducedMotion()) {
    map.fitBounds(bounds, { ...padding, animate: false })
  } else {
    map.flyToBounds(bounds, { ...padding, duration: FLY_SECONDS })
  }
  hasFitted = true
}

watch(
  () => [props.center.lat, props.center.lon, props.radiusKm],
  ([lat, lon], [oldLat, oldLon]) => {
    if (!map) return
    const moved = lat !== oldLat || lon !== oldLon
    centerMarker.setLatLng([lat, lon])
    searchCircle.setLatLng([lat, lon])
    // A new place jumps straight to its circle; a new radius grows or shrinks the current one
    if (moved || prefersReducedMotion()) setSearchArea(props.radiusKm * 1000)
    else animateRadius(props.radiusKm * 1000)
    fitToSearchArea()
  },
)

watch(
  () => props.centerLabel,
  () => centerMarker?.setIcon(L.divIcon({ className: 'map-center-pin', html: centerPinHtml(), iconSize: [0, 0] })),
)

watch(() => props.places, renderMarkers)

// Draws the circle, the dimmed outside and the edge label for a radius in meters
function setSearchArea(radiusM) {
  shownRadiusM = radiusM
  searchCircle.setRadius(radiusM)
  outsideMask.setLatLngs([WORLD_RING, circleRing(props.center, radiusM)])
  // The label sits on the lower-right edge, away from the chips and the center label
  radiusLabel.setLatLng(destination(props.center, radiusM, 135))
  radiusLabel.getElement().firstChild.textContent = `${props.radiusKm} km`
}

function animateRadius(toM) {
  cancelAnimationFrame(resizeFrame)
  const fromM = shownRadiusM
  const start = performance.now()
  const step = (now) => {
    const t = Math.min((now - start) / RESIZE_MS, 1)
    const eased = 1 - (1 - t) ** 3
    setSearchArea(fromM + (toM - fromM) * eased)
    if (t < 1) resizeFrame = requestAnimationFrame(step)
  }
  resizeFrame = requestAnimationFrame(step)
}

// Built as elements so an area name is shown as text, never parsed as HTML
function centerPinHtml() {
  const pin = document.createElement('span')
  pin.className = 'map-center-pin__inner'
  const dot = document.createElement('span')
  dot.className = 'map-center-pin__dot'
  const label = document.createElement('span')
  label.className = 'map-center-pin__label'
  label.textContent = props.centerLabel
  pin.append(dot, label)
  return pin
}

function clusterIcon(cluster) {
  const count = cluster.getChildCount()
  const size = count < 10 ? 36 : count < 50 ? 44 : 52
  return L.divIcon({
    className: 'map-cluster',
    html: `<span aria-hidden="true">${count}</span><span class="visually-hidden">${count} places, zoom in</span>`,
    iconSize: [size, size],
  })
}

// Div icons avoid Leaflet's default icon images, which break under Vite bundling
function renderMarkers() {
  if (!map) return
  markersLayer.clearLayers()

  const markers = props.places.map((place) =>
    L.marker([place.lat, place.lon], {
      // Muted only when known to be closed; unknown hours stay strawberry
      icon: L.divIcon({
        className: place.openNow === false ? 'map-place-pin is-closed' : 'map-place-pin',
        iconSize: [22, 22],
      }),
      title: place.name,
    })
      .bindTooltip(place.name)
      .on('click', () => emit('select', place.id))
      .on('keypress', (e) => e.originalEvent.key === 'Enter' && emit('select', place.id)),
  )
  markersLayer.addLayers(markers)
}

// Points on a circle around { lat, lon }, for the mask's hole and the fit bounds
function circleRing(center, radiusM, steps = 96) {
  return Array.from({ length: steps }, (_, i) => destination(center, radiusM, (i / steps) * 360))
}

// The point radiusM meters from center along a compass bearing (degrees)
function destination(center, radiusM, bearingDeg) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const toDeg = (rad) => (rad * 180) / Math.PI
  const d = radiusM / 6378137 // Leaflet's Earth radius, so this lines up with L.circle
  const lat1 = toRad(center.lat)
  const bearing = toRad(bearingDeg)
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(bearing))
  const lon2 =
    toRad(center.lon) +
    Math.atan2(Math.sin(bearing) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2))
  return [toDeg(lat2), toDeg(lon2)]
}
</script>

<template>
  <div class="map-wrap">
    <div ref="mapEl" class="map" role="region" aria-label="Map of nearby places"></div>
    <!-- Controls that float over the map (the radius chips) -->
    <slot />
  </div>
</template>

<style scoped>
.map-wrap {
  position: relative;
  z-index: 0; /* keep Leaflet panes below the sticky header */
}

.map {
  position: absolute;
  inset: 0;
  z-index: 0; /* own stacking context, so the slotted controls sit above every pane */
}
</style>

<!-- Leaflet builds these elements itself, outside Vue's scoped styles -->
<style>
/* Place markers: strawberry dots with a chocolate outline */
.map-place-pin {
  border: 3px solid var(--color-ink);
  border-radius: 50%;
  background: var(--color-primary);
}

.map-place-pin.is-closed {
  background: var(--color-closed);
}

/* Clusters: a bigger strawberry sticker with the count */
.map-cluster {
  display: grid;
  place-items: center;
  border: 3px solid var(--color-ink);
  border-radius: 50%;
  background: var(--color-primary-strong);
  box-shadow: 2px 2px 0 var(--color-ink);
  color: var(--color-on-primary);
  font-family: var(--font-display);
  font-size: 1rem;
  letter-spacing: 0.02em;
  transition: transform var(--dur-fast) var(--ease-pop);
}

@media (hover: hover) {
  .map-cluster:hover {
    transform: scale(1.1);
  }
}

.map-place-pin:focus-visible,
.map-cluster:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

/* The searched spot: a mango dot with a pulse, and a label above it */
.map-center-pin__inner {
  position: absolute;
  left: 0;
  top: 0;
}

.map-center-pin__dot {
  position: absolute;
  left: -10px;
  top: -10px;
  width: 20px;
  height: 20px;
  border: 3px solid var(--color-ink);
  border-radius: 50%;
  background: var(--color-accent);
  box-sizing: border-box;
}

.map-center-pin__dot::after {
  content: '';
  position: absolute;
  inset: -3px;
  border: 3px solid var(--color-primary-strong);
  border-radius: 50%;
  animation: map-pulse 1.8s var(--ease-out) infinite;
}

.map-center-pin__label {
  position: absolute;
  left: 0;
  bottom: 16px;
  transform: translateX(-50%) rotate(-2deg);
  max-width: 11rem;
  padding: 0.15rem 0.55rem;
  overflow: hidden;
  border: 2px solid var(--color-ink);
  border-radius: var(--radius-pill);
  background: var(--color-ink);
  color: var(--color-bg);
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* "2 km" on the circle's edge */
.map-radius-label span {
  position: absolute;
  transform: translate(-50%, -50%);
  padding: 0.1rem 0.5rem;
  border: 2px solid var(--color-primary-strong);
  border-radius: var(--radius-pill);
  background: var(--color-card);
  color: var(--color-primary-strong);
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 800;
  white-space: nowrap;
}

@keyframes map-pulse {
  0% { transform: scale(1); opacity: 0.9; }
  100% { transform: scale(2.6); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .map-center-pin__dot::after {
    animation: none;
    opacity: 0;
  }
}
</style>
