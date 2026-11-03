<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { useLocationStore } from '@/stores/location'
import { MEDIA } from '@/utils/breakpoints'
import LocationForm from './LocationForm.vue'

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

function open(triggerEl) {
  trigger = triggerEl
  location.clearError()
  placeUnderTrigger()
  dialogEl.value.showModal()
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
  // On short screens (landscape tablets) keep the panel's top on screen; its height is capped in CSS
  const top = Math.round(Math.max(16, Math.min(rect.bottom + 10, window.innerHeight - 260)))
  position.value = {
    top: `${top}px`,
    maxHeight: `calc(100dvh - ${top + 16}px)`,
    left: `${Math.round(Math.max(16, Math.min(rect.left, maxLeft)))}px`,
  }
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
      <LocationForm id-prefix="panel" compact @located="close" />
    </div>
  </dialog>
</template>

<style scoped>
.location-panel {
  padding: 0;
  border: var(--outline-thick);
  background: var(--paper);
  color: var(--ink);
  overflow: visible;
}

.location-panel::backdrop {
  background: rgb(20 20 20 / 0.45);
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
  box-shadow: 0 -6px 0 var(--ink);
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
  background: var(--ink);
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
  background: rgb(20 20 20 / 0.15);
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
  background: var(--cream);
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
  color: var(--ink);
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
