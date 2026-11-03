<script setup>
import { ref, computed } from 'vue'
import { useLocationStore } from '@/stores/location'
import { DEFAULT_DISTANCE_KM } from '@/stores/filters'

// Shared by Home's location step and Explore's "change location" panel.
// Emits `located` once the store has new coordinates; the parent decides what happens next.
const props = defineProps({
  // Keeps input ids unique if two forms are ever on screen
  idPrefix: { type: String, default: 'location' },
  // Smaller buttons for the Explore panel
  compact: { type: Boolean, default: false },
})

const emit = defineEmits(['located'])

// All text for the form, in one place for easy editing
const copy = {
  useLocation: 'Use my location',
  locating: 'Finding you…',
  divider: 'or',
  areaLabel: 'Type a street, barangay, or landmark',
  areaPlaceholder: 'Tomas Morato, Quezon City',
  areaHint: (km) => `We look within ${km} km of this spot, so be specific: add the city, like a short address.`,
  searchArea: 'Search this area',
  searchingArea: 'Looking it up…',
}

const location = useLocationStore()
const area = ref('')
const busy = computed(() => location.status === 'locating' || location.status === 'geocoding')
const inputId = computed(() => `${props.idPrefix}-area`)

async function useMyLocation() {
  if (busy.value) return
  if (await location.requestBrowserLocation()) emit('located')
}

// Used by the typed input and by any area chips a parent puts in the slot
async function search(text) {
  if (!text.trim() || busy.value) return
  if (await location.setManualArea(text)) {
    area.value = ''
    emit('located')
  }
}
</script>

<template>
  <div class="location-form" :class="{ 'is-compact': compact }">
    <button
      type="button"
      class="btn btn-primary btn-display btn-block locate-btn"
      :disabled="busy"
      @click="useMyLocation"
    >
      <!-- An SVG, not the 📍 emoji, so it takes the button's text color -->
      <svg class="pin" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          fill-rule="evenodd"
          d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 4.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z"
        />
      </svg>
      {{ location.status === 'locating' ? copy.locating : copy.useLocation }}
    </button>
    <slot name="after-locate" />

    <div class="divider"><span>{{ copy.divider }}</span></div>

    <form class="area-form" @submit.prevent="search(area)">
      <label :for="inputId" class="area-label">{{ copy.areaLabel }}</label>
      <input
        :id="inputId"
        v-model="area"
        type="text"
        :placeholder="copy.areaPlaceholder"
        autocomplete="street-address"
        :aria-invalid="location.error ? 'true' : undefined"
        :aria-describedby="location.error ? `${idPrefix}-hint ${idPrefix}-error` : `${idPrefix}-hint`"
      />
      <p :id="`${idPrefix}-hint`" class="area-hint">{{ copy.areaHint(DEFAULT_DISTANCE_KM) }}</p>
      <!-- e.g. area chips; `search` runs the lookup straight away -->
      <slot name="after-input" :search="search" :busy="busy" />
      <button class="btn btn-secondary btn-block area-btn" type="submit" :disabled="!area.trim() || busy">
        <span v-if="location.status === 'geocoding'" class="spinner" aria-hidden="true"></span>
        {{ location.status === 'geocoding' ? copy.searchingArea : copy.searchArea }}
      </button>
    </form>

    <Transition name="fade">
      <p v-if="location.error" :id="`${idPrefix}-error`" class="error" role="alert">{{ location.error }}</p>
    </Transition>
  </div>
</template>

<style scoped>
.location-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.locate-btn {
  min-height: clamp(54px, 50px + 1vw, 62px);
  font-size: clamp(1.2rem, 1.1rem + 0.5vw, 1.45rem);
  box-shadow: var(--shadow);
}

.locate-btn:active:not(:disabled) {
  transform: translate(5px, 5px) scale(0.97, 0.94);
}

.pin {
  flex-shrink: 0;
  width: 1.1em;
  height: 1.1em;
  fill: currentColor;
  stroke: var(--color-ink);
  stroke-width: 1.5;
  stroke-linejoin: round;
}

.divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: var(--font-display);
  font-size: 1rem;
  text-transform: uppercase;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: var(--outline-w);
  border-radius: 2px;
  background: var(--color-ink);
}

.area-form {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.area-label {
  font-weight: 800;
}

.area-form input {
  min-height: 52px;
  padding: 0 1rem;
  border: var(--outline);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  box-shadow: inset 3px 3px 0 color-mix(in srgb, var(--color-ink) 8%, transparent);
  font-weight: 600;
}

.area-form input::placeholder {
  color: var(--color-muted);
  font-weight: 500;
}

.area-hint {
  margin: -0.2rem 0 0;
  color: var(--color-muted);
  font-size: 0.875rem;
  line-height: 1.4;
}

.area-form input[aria-invalid='true'] {
  border-color: var(--color-danger);
}

.area-btn {
  min-height: 52px;
}

.error {
  margin: 0;
  padding: 0.6rem 0.8rem;
  border: 2px solid var(--color-ink);
  border-radius: var(--radius-sm);
  background: var(--color-accent);
  color: var(--color-ink);
}

.spinner {
  width: 1em;
  height: 1em;
  border: 3px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* Compact variant for the Explore panel */
.is-compact {
  gap: 0.8rem;
}

.is-compact .locate-btn {
  min-height: 52px;
  font-size: 1.2rem;
  box-shadow: var(--shadow-sm);
}

.is-compact .locate-btn:active:not(:disabled) {
  transform: translate(3px, 3px) scale(0.97, 0.94);
}

.is-compact .area-form input,
.is-compact .area-btn {
  min-height: 48px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* A static ring instead of a spinning one; the button text still says it's working */
@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
    border-right-color: currentColor;
    opacity: 0.6;
  }
}
</style>
