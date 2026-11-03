<script setup>
import { ref, watch, onMounted } from 'vue'
import { usePlacesStore } from '@/stores/places'
import FilterPanel from './FilterPanel.vue'

// Filters below the desktop breakpoint: a bottom sheet on phones, a side panel on tablets.
// Like LocationPanel, it's a native modal <dialog> (focus trap, Escape, inert page behind,
// stacks above the Leaflet map). Desktop shows FilterPanel inline instead (see ExploreView).

const copy = {
  title: 'Filters',
  close: 'Close',
  done: (n) => `Show ${n} ${n === 1 ? 'place' : 'places'}`,
}

const props = defineProps({
  open: { type: Boolean, default: false },
})
const emit = defineEmits(['update:open'])

const places = usePlacesStore()
const dialogEl = ref(null)

function sync(isOpen) {
  const el = dialogEl.value
  if (!el) return
  if (isOpen && !el.open) el.showModal()
  if (!isOpen && el.open) el.close()
}

watch(() => props.open, sync)
// Mounting while open happens when the window shrinks below desktop with filters showing
onMounted(() => sync(props.open))

function close() {
  dialogEl.value?.close()
}

// Taps on the backdrop land on the <dialog> element itself
function onDialogClick(event) {
  if (event.target === dialogEl.value) close()
}
</script>

<template>
  <dialog
    ref="dialogEl"
    class="filter-sheet"
    aria-labelledby="filter-sheet-title"
    @click="onDialogClick"
    @close="emit('update:open', false)"
  >
    <div class="sheet">
      <span class="grabber" aria-hidden="true"></span>
      <div class="sheet-head">
        <h2 id="filter-sheet-title" class="title display">{{ copy.title }}</h2>
        <button type="button" class="close-btn" :aria-label="copy.close" @click="close">✕</button>
      </div>

      <div class="sheet-body">
        <FilterPanel class="sheet-panel" />
      </div>

      <div class="sheet-foot">
        <button type="button" class="btn btn-ink btn-display btn-block" @click="close">
          {{ copy.done(places.filteredPlaces.length) }}
        </button>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
/* ---------- Bottom sheet (phones) ---------- */
.filter-sheet {
  width: 100%;
  max-width: 100%;
  max-height: 88dvh;
  margin: auto 0 0;
  padding: 0;
  border: var(--outline-thick);
  border-bottom: 0;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  background: var(--paper);
  box-shadow: 0 -6px 0 var(--ink);
  color: var(--ink);
  overflow: hidden;
}

.filter-sheet::backdrop {
  background: rgb(20 20 20 / 0.45);
}

.filter-sheet[open] {
  animation: sheet-up var(--dur-pop) var(--ease-out);
}

/* Head and foot stay put; only the filters scroll */
.sheet {
  display: flex;
  flex-direction: column;
  max-height: inherit;
}

.grabber {
  display: block;
  flex-shrink: 0;
  width: 44px;
  height: 5px;
  margin: 0.75rem auto 0;
  border-radius: var(--radius-pill);
  background: var(--ink);
  opacity: 0.35;
}

.sheet-head {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem var(--pad-right) 0.5rem var(--pad-left);
}

.title {
  margin: 0;
  font-size: clamp(1.5rem, 1.3rem + 1vw, 1.9rem);
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

.sheet-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0.25rem var(--pad-right) 0.5rem var(--pad-left);
}

/* Inside the sheet the panel drops its own card look */
.sheet-body .sheet-panel {
  margin: 0;
  padding: 0;
  border: 0;
  box-shadow: none;
  background: none;
}

.sheet-foot {
  flex-shrink: 0;
  padding: 0.75rem var(--pad-right) calc(0.75rem + env(safe-area-inset-bottom)) var(--pad-left);
  border-top: var(--outline);
  background: var(--paper);
}

/* ---------- Side panel (tablets) ---------- */
@media (min-width: 640px) {
  .filter-sheet {
    width: min(420px, 90vw);
    height: 100dvh;
    max-height: 100dvh;
    margin: 0 0 0 auto;
    border: 0;
    border-left: var(--outline-thick);
    border-radius: 0;
    box-shadow: -6px 0 0 var(--ink);
  }

  .filter-sheet[open] {
    animation-name: panel-in;
  }

  .sheet {
    height: 100%;
    padding-top: env(safe-area-inset-top);
  }

  .grabber {
    display: none;
  }

  .sheet-head {
    padding-top: 1rem;
    padding-left: var(--gutter);
  }

  .sheet-body,
  .sheet-foot {
    padding-left: var(--gutter);
  }
}

@keyframes sheet-up {
  from { transform: translateY(100%); }
  to { transform: none; }
}

@keyframes panel-in {
  from { transform: translateX(100%); }
  to { transform: none; }
}
</style>
