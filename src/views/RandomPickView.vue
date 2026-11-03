<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { gsap } from 'gsap'
import { usePlacesStore } from '@/stores/places'
import { prefersReducedMotion, celebrate } from '@/utils/motion'
import PlaceCard from '@/components/PlaceCard.vue'
import MarqueeStrip from '@/components/MarqueeStrip.vue'
import { pickMarqueeItems } from '@/content/marquee'
import slotSvg from '@/assets/stickers/slot.svg'

const props = defineProps({
  id: { type: String, required: true },
})

const copy = {
  spinning: 'Eeny, meeny, miny…',
  landed: 'The randomizer picked…',
  tapToSkip: 'Tap to skip',
  accept: "Let's go!",
  reroll: 'Re-roll',
  back: 'Back to exploring',
  unavailable: 'That pick is no longer available.',
  hint: (n) => `Picked from ${n} places matching your filters.`,
}

const REEL_LENGTH = 22 // names shown before landing
const SPIN_SECONDS = 2.4

const router = useRouter()
const places = usePlacesStore()
const place = computed(() => places.getById(props.id))
const canReroll = computed(() => places.filteredPlaces.length > 1)

// idle -> spinning -> landed. Refreshes and reduced motion go straight to landed.
const phase = ref('idle')
const reelItems = ref([])
const stageEl = ref(null)
const rerolling = ref(false)
let timeline = null
let rerollTween = null

onMounted(async () => {
  await places.loadNearby()
  startReveal()
})

watch(() => props.id, startReveal)

onBeforeUnmount(() => {
  timeline?.kill()
  rerollTween?.kill()
})

function startReveal() {
  timeline?.kill()
  const shouldSpin = places.consumeReveal() && place.value && !prefersReducedMotion()
  if (!shouldSpin) {
    phase.value = 'landed'
    return
  }
  reelItems.value = buildReel(place.value.name)
  phase.value = 'spinning' // the reel's <Transition @enter> starts the spin
}

// Random names from the current filtered pool, never the same twice in a row, ending on the pick
function buildReel(pickName) {
  const names = places.filteredPlaces.map((p) => p.name)
  const items = []
  while (items.length < REEL_LENGTH - 1) {
    const name = names[Math.floor(Math.random() * names.length)]
    if (names.length > 1 && name === items.at(-1)) continue
    items.push(name)
  }
  if (names.length > 1 && items.at(-1) === pickName) {
    items[items.length - 1] = names.find((n) => n !== pickName)
  }
  items.push(pickName)
  return items
}

// Slot-machine spin: scroll the strip to the last item, easing out, then a landing bump
function spin(reelEl) {
  const strip = reelEl.querySelector('.reel-strip')
  const itemHeight = strip.firstElementChild.offsetHeight
  const distance = itemHeight * (reelItems.value.length - 1)

  timeline = gsap
    .timeline({ onComplete: land })
    .fromTo(strip, { y: 0 }, { y: -distance, duration: SPIN_SECONDS, ease: 'power3.out' })
    .fromTo(strip, { filter: 'blur(2px)' }, { filter: 'blur(0px)', duration: SPIN_SECONDS * 0.7, ease: 'power2.in' }, 0)
    .to(reelEl, { scale: 1.08, rotate: -2, duration: 0.12, yoyo: true, repeat: 1, ease: 'power1.inOut' })
    .to({}, { duration: 0.25 }) // brief beat on the winning name
}

function onReelEnter(el) {
  if (phase.value === 'spinning') spin(el)
}

function land() {
  phase.value = 'landed'
  celebrate()
}

// Let impatient users jump to the result
function skipSpin() {
  timeline?.progress(1)
}

function accept() {
  router.push({ name: 'place', params: { id: props.id } })
}

function reroll() {
  if (rerolling.value) return
  const next = places.pickRandom()
  if (!next) return
  // replace so the back button returns to explore, not through every re-roll
  const go = () => router.replace({ name: 'pick', params: { id: next.id } })
  if (prefersReducedMotion()) return go()

  // Quick shake of the current pick (and a dice spin in CSS) before the next reel
  rerolling.value = true
  rerollTween = gsap.to(stageEl.value, {
    keyframes: { x: [0, -14, 12, -8, 5, 0], rotate: [0, -4, 3, -2, 1, 0] },
    duration: 0.32,
    ease: 'power1.inOut',
    clearProps: 'transform',
    onComplete: () => {
      rerolling.value = false
      go()
    },
  })
}
</script>

<template>
  <div class="pick-view">
    <MarqueeStrip :items="pickMarqueeItems" tone="accent" reverse />

    <section class="container pick">
      <Transition name="fade" mode="out-in">
        <p :key="phase" class="eyebrow display">
          {{ phase === 'spinning' ? copy.spinning : copy.landed }}
        </p>
      </Transition>

      <div ref="stageEl" class="stage">
        <!-- Same slot sticker as the "Bahala na!" step on Home, perched on the reel's corner -->
        <Transition name="pop">
          <img
            v-if="phase === 'spinning'"
            :src="slotSvg"
            alt=""
            aria-hidden="true"
            draggable="false"
            width="512"
            height="512"
            class="slot-sticker"
          />
        </Transition>

        <Transition name="pop" mode="out-in" @enter="onReelEnter">
          <button
            v-if="phase === 'spinning'"
            key="reel"
            type="button"
            class="reel"
            :aria-label="copy.tapToSkip"
            @click="skipSpin"
          >
            <ul class="reel-strip" aria-hidden="true">
              <li v-for="(name, i) in reelItems" :key="i">{{ name }}</li>
            </ul>
          </button>

          <PlaceCard v-else-if="phase === 'landed' && place" :key="`card-${place.id}`" :place="place" class="pick-card" />
          <p v-else-if="places.loading" key="loading" class="muted">Loading…</p>
          <p v-else-if="phase === 'landed'" key="missing" class="muted">{{ copy.unavailable }}</p>
        </Transition>
      </div>

      <!-- Screen readers hear the result once it lands, not every name on the reel -->
      <p class="visually-hidden" aria-live="polite">
        {{ phase === 'landed' && place ? `${copy.landed} ${place.name}` : '' }}
      </p>

      <div class="actions">
        <button class="btn btn-primary btn-display btn-block btn-big" :disabled="!place || phase !== 'landed'" @click="accept">
          {{ copy.accept }}
        </button>
        <button
          class="btn btn-highlight btn-block reroll"
          :class="{ 'is-rolling': rerolling }"
          :disabled="!canReroll || phase !== 'landed'"
          @click="reroll"
        >
          <span class="dice" aria-hidden="true">🎲</span> {{ copy.reroll }}
        </button>
        <RouterLink :to="{ name: 'explore' }" class="btn btn-secondary btn-block">
          {{ copy.back }}
        </RouterLink>
      </div>

      <p class="muted hint">{{ copy.hint(places.filteredPlaces.length) }}</p>
    </section>
  </div>
</template>

<style scoped>
/* A focused single column at every size; wide screens just get more breathing room */
.pick {
  display: flex;
  flex-direction: column;
  gap: clamp(1rem, 0.8rem + 1vw, 1.5rem);
  max-width: 600px;
  padding-top: clamp(1.25rem, 3dvh, 2.5rem);
  padding-bottom: calc(clamp(1.5rem, 4dvh, 3rem) + env(safe-area-inset-bottom));
}

.eyebrow {
  margin: 0;
  font-size: clamp(1.7rem, 1.3rem + 2vw, 2.6rem);
  text-align: center;
}

/* Min-height stage so the buttons don't jump between reel and card */
.stage {
  display: grid;
  align-items: center;
  position: relative;
  min-height: 132px;
}

/* Big slot-machine sticker overlapping the reel's top-right corner */
.slot-sticker {
  position: absolute;
  top: clamp(-64px, -40px - 3vw, -48px);
  right: clamp(-16px, -1vw, -8px);
  z-index: 3;
  width: clamp(96px, 80px + 6vw, 140px);
  height: auto;
  filter: drop-shadow(4px 4px 0 var(--color-ink));
  rotate: 8deg;
  pointer-events: none;
  user-select: none;
}

/* ---------- Slot-machine reel ---------- */
.reel {
  --reel-item: clamp(92px, 80px + 3vw, 120px);
  position: relative;
  display: block;
  width: 100%;
  height: var(--reel-item);
  padding: 0;
  overflow: hidden;
  border: var(--outline-thick);
  border-radius: var(--radius-lg);
  background: var(--color-primary);
  color: var(--color-ink);
  box-shadow: var(--shadow-lg);
  cursor: pointer;
}

/* Shading at the top and bottom edges, like a real reel window */
.reel::before,
.reel::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  z-index: 1;
  height: 26px;
  pointer-events: none;
}
.reel::before {
  top: 0;
  background: linear-gradient(color-mix(in srgb, var(--color-ink) 28%, transparent), transparent);
}
.reel::after {
  bottom: 0;
  background: linear-gradient(transparent, color-mix(in srgb, var(--color-ink) 28%, transparent));
}

.reel-strip {
  margin: 0;
  padding: 0;
  list-style: none;
  will-change: transform;
}

.reel-strip li {
  display: block;
  height: var(--reel-item);
  padding: 0 1rem;
  overflow: hidden;
  font-family: var(--font-display);
  font-size: clamp(1.7rem, 1.2rem + 2.5vw, 2.8rem);
  line-height: var(--reel-item);
  text-align: center;
  text-transform: uppercase;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* ---------- Result ---------- */
.pick-card {
  border-width: var(--outline-w-thick);
  box-shadow: var(--shadow-lg);
  transform: rotate(-1deg);
}

/* Shorter art on short screens so the buttons stay in view */
.pick-card :deep(.art) {
  height: clamp(130px, min(30vw, 24dvh), 210px);
}

.pick-card :deep(.name) {
  font-size: clamp(1.7rem, 1.3rem + 2vw, 2.5rem);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn-big {
  min-height: clamp(56px, 52px + 1vw, 64px);
  font-size: clamp(1.3rem, 1.15rem + 0.6vw, 1.6rem);
}

/* Tablet up: the two secondary actions sit side by side under the main one */
@media (min-width: 640px) {
  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .btn-big {
    grid-column: 1 / -1;
  }
}

.dice {
  display: inline-block;
  font-size: 1.25rem;
}

/* Re-roll: the dice spins while the current pick shakes */
.reroll.is-rolling .dice {
  animation: dice-spin var(--dur-pop) var(--ease-out);
}

.hint {
  margin: 0;
  text-align: center;
  font-size: 0.875rem;
}

@keyframes dice-spin {
  from { transform: rotate(0) scale(1); }
  50% { transform: rotate(240deg) scale(1.35); }
  to { transform: rotate(360deg) scale(1); }
}
</style>
