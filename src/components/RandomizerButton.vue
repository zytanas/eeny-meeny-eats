<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlacesStore } from '@/stores/places'

const router = useRouter()
const places = usePlacesStore()

// Only picks from places matching the current filters
const count = computed(() => places.filteredPlaces.length)

function randomize() {
  const pick = places.pickRandom()
  if (pick) router.push({ name: 'pick', params: { id: pick.id } })
}
</script>

<template>
  <button class="btn btn-ink randomizer-btn" :disabled="!count" @click="randomize">
    <span class="dice" aria-hidden="true">🎲</span>
    Pick for me
    <span v-if="count" class="count" :aria-label="`from ${count} places`">{{ count }}</span>
  </button>
</template>

<style scoped>
.randomizer-btn {
  /* Height comes from the page (Explore reserves room for it at the bottom) */
  min-height: var(--randomizer-height, 60px);
  padding: 0 clamp(1.1rem, 0.9rem + 1vw, 1.5rem) 0 clamp(0.9rem, 0.75rem + 0.8vw, 1.25rem);
  border-width: 4px;
  font-family: var(--font-display);
  font-size: clamp(1.2rem, 1.05rem + 0.6vw, 1.4rem);
  font-weight: 400;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  box-shadow: 5px 5px 0 var(--orange), 5px 5px 0 3px var(--ink);
  white-space: nowrap;
}

.randomizer-btn:active:not(:disabled) {
  transform: translate(5px, 5px) scale(0.97, 0.93);
}

.dice {
  display: inline-block;
  font-size: 1.5rem;
}

.randomizer-btn:not(:disabled):hover .dice {
  animation: roll 0.5s var(--ease-pop);
}

/* Filter count as a little sticker badge */
.count {
  display: grid;
  place-items: center;
  min-width: 30px;
  height: 30px;
  padding: 0 0.4rem;
  border: 2px solid var(--ink);
  border-radius: var(--radius-pill);
  background: var(--orange);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 800;
}

@keyframes roll {
  0% { transform: rotate(0) scale(1); }
  50% { transform: rotate(200deg) scale(1.2); }
  100% { transform: rotate(360deg) scale(1); }
}
</style>
