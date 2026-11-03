<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import L from 'leaflet'
import { cssVar } from '@/utils/motion'

const props = defineProps({
  center: { type: Object, required: true }, // { lat, lon }
  places: { type: Array, default: () => [] },
})

const emit = defineEmits(['select'])

const mapEl = ref(null)
let map = null
let markersLayer = null
let userMarker = null
let resizeObserver = null
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

  markersLayer = L.layerGroup().addTo(map)
  renderUser()
  renderMarkers()

  // Any size change (window resize, List/Map toggle, breakpoint layout swap) would
  // otherwise leave gray gaps where Leaflet hasn't drawn tiles
  resizeObserver = new ResizeObserver(invalidateSize)
  resizeObserver.observe(mapEl.value)
})

onBeforeUnmount(() => {
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
  if (pendingFit) fitToPlaces()
}

// Keep every visible place (and the user) in view
function fitToPlaces() {
  if (!isVisible()) {
    pendingFit = true
    return
  }
  pendingFit = false
  if (!props.places.length) return
  const bounds = L.latLngBounds(props.places.map((p) => [p.lat, p.lon]))
  bounds.extend([props.center.lat, props.center.lon])
  map.fitBounds(bounds, { padding: [24, 24], maxZoom: 16 })
}

defineExpose({ invalidateSize })

watch(() => props.places, renderMarkers)
watch(
  () => props.center,
  () => {
    renderUser()
    map?.setView([props.center.lat, props.center.lon])
  },
)

function renderUser() {
  if (!map) return
  userMarker?.remove()
  userMarker = L.circleMarker([props.center.lat, props.center.lon], {
    radius: 8,
    color: cssVar('--ink'),
    weight: 3,
    fillColor: cssVar('--accent'),
    fillOpacity: 1,
  })
    .bindTooltip('You are here')
    .addTo(map)
}

// Circle markers avoid Leaflet's default icon images, which break under Vite bundling
function renderMarkers() {
  if (!map) return
  markersLayer.clearLayers()

  props.places.forEach((place) => {
    L.circleMarker([place.lat, place.lon], {
      radius: 9,
      color: cssVar('--ink'),
      weight: 3,
      // Grey only when known to be closed; unknown hours stay orange
      fillColor: place.openNow === false ? cssVar('--stone') : cssVar('--orange'),
      fillOpacity: 0.95,
    })
      .bindTooltip(place.name)
      .on('click', () => emit('select', place.id))
      .addTo(markersLayer)
  })

  fitToPlaces()
}
</script>

<template>
  <div ref="mapEl" class="map" role="region" aria-label="Map of nearby places"></div>
</template>

<style scoped>
.map {
  width: 100%;
  z-index: 0; /* keep Leaflet panes below the sticky header */
}
</style>
