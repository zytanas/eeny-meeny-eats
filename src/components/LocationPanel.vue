<script setup>
import { ref, nextTick, onBeforeUnmount } from 'vue'
import { useLocationStore } from '@/stores/location'
import { MEDIA } from '@/utils/breakpoints'
import LocationForm from './LocationForm.vue'
import AreaChips from './AreaChips.vue'

// "Change location" panel for Explore: a dropdown under the trigger on wider screens,
// a bottom sheet on phones. Built on a native modal <dialog>, which gives us a focus trap,
// Escape to close, an inert page behind it, and stacking above the Leaflet map for free.

const copy = {
  title: 'Change location',
  current: 'Now showing',
  close: 'Close',
}

const emit = defineEmits(['open-change'])

const DROPDOWN_QUERY = MEDIA.tablet
const PANEL_WIDTH = 380

const location = useLocationStore()
const dialogEl = ref(null)
const position = ref(null)
let trigger = null

async function open(triggerEl) {
  trigger = triggerEl
  location.clearError()
  placeUnderTrigger()
  dialogEl.value.showModal()
  // The dropdown class and width are on now, so the panel's real height can be measured
  // (this runs before the next paint, so the panel never shows in the wrong spot)
  await nextTick()
  makeRoomBelowTrigger()
  window.addEventListener('resize', placeUnderTrigger)
  window.addEventListener('scroll', placeUnderTrigger, { passive: true })
  emit('open-change', true)
}

function close() {
  dialogEl.value?.close()
}

// Runs for every way of closing: button, Escape, backdrop tap, successful search
function onClose() {
  window.removeEventListener('resize', placeUnderTrigger)
  window.removeEventListener('scroll', placeUnderTrigger)
  emit('open-change', false)
  trigger?.focus()
}

// Taps on the backdrop land on the <dialog> element itself (the content fills it otherwise)
function onDialogClick(event) {
  if (event.target === dialogEl.value) close()
}

// Dropdown mode: pin the panel just below the trigger, kept inside the viewport
function placeUnderTrigger() {
  if (!trigger || !window.matchMedia(DROPDOWN_QUERY).matches) {
    position.value = null // bottom sheet, positioned by CSS
    return
  }
  const rect = trigger.getBoundingClientRect()
  const maxLeft = window.innerWidth - PANEL_WIDTH - 16
  // If the whole panel still can't fit under the trigger, lift it so it does (covering the trigger).
  // Taller than the screen: top at 16px, and its height is capped (it scrolls inside).
  const height = dialogEl.value?.open ? panelHeight() : 244
  const top = Math.round(Math.max(16, Math.min(rect.bottom + 10, window.innerHeight - height - 16)))
  position.value = {
    top: `${top}px`,
    maxHeight: `calc(100dvh - ${top + 16}px)`,
    left: `${Math.round(Math.max(16, Math.min(rect.left, maxLeft)))}px`,
  }
}

// Full height of the panel's content plus the dialog's border, whatever max-height it has now
function panelHeight() {
  const dialog = dialogEl.value
  return dialog.firstElementChild.offsetHeight + (dialog.offsetHeight - dialog.clientHeight)
}

// Tablets: the trigger sits below the map, so a tall panel (with recent chips) would run off the
// bottom. Scroll the page up just enough that the whole panel fits under its trigger, stopping
// before the trigger slides under the sticky header. placeUnderTrigger handles what's left over.
function makeRoomBelowTrigger() {
  if (!position.value) return
  const rect = trigger.getBoundingClientRect()
  const overflow = rect.bottom + 10 + panelHeight() + 16 - window.innerHeight
  const headerBottom = document.querySelector('.app-header')?.getBoundingClientRect().bottom ?? 0
  const room = rect.top - headerBottom - 12
  if (overflow > 0 && room > 0) window.scrollBy({ top: Math.min(overflow, room), behavior: 'instant' })
  placeUnderTrigger()
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', placeUnderTrigger)
  window.removeEventListener('scroll', placeUnderTrigger)
})

defineExpose({ open, close })
</script>

<template>
  <dialog
    id="location-panel"
    ref="dialogEl"
    class="location-panel"
    :class="position ? 'is-dropdown' : 'is-sheet'"
    :style="position ?? undefined"
    aria-labelledby="location-panel-title"
    @click="onDialogClick"
    @close="onClose"
  >
    <div class="panel">
      <span v-if="!position" class="grabber" aria-hidden="true"></span>
      <div class="panel-head">
        <h2 id="location-panel-title" class="title display">{{ copy.title }}</h2>
        <button type="button" class="close-btn" :aria-label="copy.close" @click="close">✕</button>
      </div>
      <p class="current">
        {{ copy.current }}: <strong>{{ location.label }}</strong>
      </p>
      <LocationForm id-prefix="panel" compact @located="close">
        <!-- Recent searches only; a chip searches like typing, so a match closes the panel too -->
        <template #after-input="{ search }">
          <AreaChips :search="search" id-prefix="panel" />
        </template>
      </LocationForm>
    </div>
  </dialog>
</template>

<style scoped>
.location-panel {
  padding: 0;
  border: var(--outline-thick);
  background: var(--color-card);
  color: var(--color-ink);
  overflow: visible;
}

.location-panel::backdrop {
  background: var(--color-scrim);
}

.panel {
  padding: 1rem var(--pad-right) var(--gutter) var(--pad-left);
}

/* ---------- Bottom sheet (phones) ---------- */
.is-sheet {
  width: 100%;
  max-width: 100%;
  max-height: 90dvh;
  margin: auto 0 0;
  border-bottom: 0;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  box-shadow: 0 -6px 0 var(--color-ink);
  overflow-y: auto;
}

.is-sheet .panel {
  padding-bottom: calc(var(--gutter) + env(safe-area-inset-bottom));
}

.is-sheet[open] {
  animation: sheet-up var(--dur-pop) var(--ease-out);
}

.grabber {
  display: block;
  width: 44px;
  height: 5px;
  margin: 0 auto 0.75rem;
  border-radius: var(--radius-pill);
  background: var(--color-ink);
  opacity: 0.35;
}

/* ---------- Dropdown (tablet and up) ---------- */
.is-dropdown {
  position: fixed;
  width: 380px; /* keep in sync with PANEL_WIDTH */
  max-width: calc(100vw - 32px);
  margin: 0;
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  overflow-y: auto;
}

.is-dropdown .panel {
  padding-inline: var(--gutter);
}

.is-dropdown::backdrop {
  background: color-mix(in srgb, var(--color-ink) 15%, transparent);
}

.is-dropdown[open] {
  animation: drop-in var(--dur-fast) var(--ease-out);
  transform-origin: top left;
}

/* ---------- Content ---------- */
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.title {
  margin: 0;
  font-size: clamp(1.5rem, 1.3rem + 1vw, 1.8rem);
}

.close-btn {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border: var(--outline);
  border-radius: 50%;
  background: var(--color-bg);
  box-shadow: var(--shadow-sm);
  font-weight: 800;
  cursor: pointer;
  transition:
    transform var(--dur-press) ease-out,
    box-shadow var(--dur-press) ease-out;
}

.close-btn:active {
  transform: translate(3px, 3px) scale(0.92);
  box-shadow: none;
}

.current {
  margin: 0.4rem 0 1rem;
  font-size: 0.95rem;
  color: var(--color-muted);
}

.current strong {
  color: var(--color-ink);
}

@keyframes sheet-up {
  from { transform: translateY(100%); }
  to { transform: none; }
}

@keyframes drop-in {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
