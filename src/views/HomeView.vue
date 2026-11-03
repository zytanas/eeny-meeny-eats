<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { gsap } from 'gsap'
import { useLocationStore } from '@/stores/location'
import { prefersReducedMotion } from '@/utils/motion'
import MarqueeStrip from '@/components/MarqueeStrip.vue'
import LocationForm from '@/components/LocationForm.vue'

// All headline, subline and button text for this screen, in one place for easy editing
const copy = {
  intro: {
    // Beat 1 (one line each), then beat 2 lands as the punchline
    headlineSetup: ['‘Kahit saan.’', '‘Ikaw bahala.’'],
    headlinePunch: 'Sound familiar?',
    subline: "Explore what's near you, or let us pick for you.",
    cta: 'Bahala na!',
    skip: 'Skip',
    scrollHint: 'or scroll down',
  },
  location: {
    headline: "Can't decide where to eat?",
    subline: 'Explore restaurants and cafes near you. Still stuck? Let the randomizer pick for you.',
    // The form's own text lives in components/LocationForm.vue
    resume: (label) => `Continue exploring ${label} →`,
  },
}
const fullHeadline = [...copy.intro.headlineSetup, copy.intro.headlinePunch].join(' ')

// Decorative food stickers floating around the hero
const stickers = ['🍜', '🍕', '🥟', '🧋', '🍔']

const INTRO_SEEN_KEY = 'eme:introSeen'
// Visiting /?intro=1 shows the intro again (handy while developing)
const INTRO_RESET_PARAM = 'intro'

// localStorage can throw (private mode, blocked storage); treat that as "not seen"
function hasSeenIntro() {
  try {
    return localStorage.getItem(INTRO_SEEN_KEY) === '1'
  } catch {
    return false
  }
}

function markIntroSeen() {
  try {
    localStorage.setItem(INTRO_SEEN_KEY, '1')
  } catch {
    // Intro will just show again next visit
  }
}

const route = useRoute()
const router = useRouter()
const location = useLocationStore()

// Intro shows only until it has been seen once (or when forced with ?intro=1)
const showIntro = ref(route.query[INTRO_RESET_PARAM] === '1' || !hasSeenIntro())
const introEl = ref(null)
const locationStep = ref(null)
const locationHeading = ref(null)
let observer = null
let gsapCtx = null

onMounted(() => {
  if (!showIntro.value) return

  playIntro()

  // Scrolling the location step into view counts as having seen the intro
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        markIntroSeen()
        locationStep.value?.classList.add('is-visible')
        observer.disconnect()
      }
    },
    { threshold: 0.35 },
  )
  observer.observe(locationStep.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  gsapCtx?.revert()
})

// Two-beat headline: the familiar excuses drop in, a pause, then the punchline slams down
function playIntro() {
  if (prefersReducedMotion()) return

  gsapCtx = gsap.context(() => {
    gsap
      .timeline()
      .from('.setup-line', {
        y: 48,
        rotate: -4,
        opacity: 0,
        duration: 0.35,
        stagger: 0.2,
        ease: 'back.out(2)',
      })
      .from(
        '.punch',
        {
          scale: 2.2,
          rotate: 10,
          opacity: 0,
          duration: 0.35,
          ease: 'power4.in',
          clearProps: 'all',
        },
        '+=0.55', // the comedic beat before the punchline
      )
      // Landing thud: the whole headline bumps when the punchline hits
      .to('.intro-headline', { y: 6, duration: 0.08, yoyo: true, repeat: 1, ease: 'power1.out' })
      .from(
        ['.intro-subline', '.intro-cta', '.scroll-hint'],
        { y: 24, opacity: 0, duration: 0.3, stagger: 0.08, ease: 'back.out(1.8)', clearProps: 'all' },
        '+=0.1',
      )
  }, introEl.value)
}

function continueToLocation() {
  markIntroSeen()
  locationStep.value.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block: 'start',
  })
  locationHeading.value?.focus({ preventScroll: true })
}

async function skipIntro() {
  markIntroSeen()
  gsapCtx?.revert()
  showIntro.value = false
  observer?.disconnect()
  await nextTick()
  window.scrollTo({ top: 0 })
  locationHeading.value?.focus({ preventScroll: true })
}
</script>

<template>
  <div class="home">
    <section v-if="showIntro" ref="introEl" class="intro" aria-labelledby="intro-headline">
      <span v-for="(s, i) in stickers" :key="s" class="food-sticker" :class="`food-sticker--${i + 1}`" aria-hidden="true">
        {{ s }}
      </span>

      <a href="#location-step" class="skip" @click.prevent="skipIntro">{{ copy.intro.skip }}</a>

      <div class="intro-content">
        <h1 id="intro-headline" class="intro-headline display" :aria-label="fullHeadline">
          <span class="setup" aria-hidden="true">
            <span v-for="line in copy.intro.headlineSetup" :key="line" class="setup-line">{{ line }}</span>
          </span>
          <span class="punch" aria-hidden="true">{{ copy.intro.headlinePunch }}</span>
        </h1>
        <p class="intro-subline">{{ copy.intro.subline }}</p>
        <button class="btn btn-ink btn-display intro-cta" @click="continueToLocation">{{ copy.intro.cta }}</button>
      </div>

      <p class="scroll-hint" aria-hidden="true">
        {{ copy.intro.scrollHint }}
        <span class="scroll-arrow">↓</span>
      </p>
    </section>

    <MarqueeStrip class="home-marquee" :tilt="showIntro ? -2 : 0" />

    <section
      id="location-step"
      ref="locationStep"
      class="container location-step"
      :class="{ reveal: showIntro }"
    >
      <component
        :is="showIntro ? 'h2' : 'h1'"
        ref="locationHeading"
        tabindex="-1"
        class="location-headline display"
      >
        {{ copy.location.headline }}
      </component>
      <p class="location-subline">{{ copy.location.subline }}</p>

      <div class="location-card sticker">
        <LocationForm id-prefix="home" @located="router.push({ name: 'explore' })" />
      </div>

      <RouterLink v-if="location.hasLocation" :to="{ name: 'explore' }" class="resume">
        {{ copy.location.resume(location.label) }}
      </RouterLink>
    </section>
  </div>
</template>

<style scoped>
.home {
  overflow-x: clip; /* the tilted ticker bleeds past the edges */
}

/* ---------- Intro hero ---------- */
/* Fills the screen under the header. Spacing and type also scale with the screen
   height (dvh), so short phones fit everything without cropping. If it still doesn't
   fit, the section grows rather than clipping. */
.intro {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: clamp(1rem, 3dvh, 2rem);
  min-height: calc(100dvh - var(--header-total));
  /* Top padding always clears the Skip button */
  padding: calc(var(--gutter) + 44px + clamp(0.75rem, 4dvh, 3rem)) var(--pad-right)
    calc(clamp(1rem, 3dvh, 2rem) + env(safe-area-inset-bottom)) var(--pad-left);
  /* Orange with a faint halftone dot texture */
  background:
    radial-gradient(rgb(0 0 0 / 0.09) 1.5px, transparent 1.7px) 0 0 / 16px 16px,
    var(--orange);
  color: var(--ink);
}

.skip {
  position: absolute;
  top: var(--gutter);
  right: var(--pad-right);
  z-index: 2;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 1rem;
  border: var(--outline);
  border-radius: var(--radius-pill);
  background: var(--cream);
  box-shadow: var(--shadow-sm);
  color: var(--ink);
  font-size: 0.9rem;
  font-weight: 800;
  text-decoration: none;
  transition:
    transform var(--dur-press) ease-out,
    box-shadow var(--dur-press) ease-out;
}

.skip:active {
  transform: translate(3px, 3px) scale(0.95);
  box-shadow: none;
}

.intro-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: clamp(1rem, 2.5dvh, 1.6rem);
  width: 100%;
  max-width: 760px;
  margin: auto; /* centers vertically too, above the scroll hint */
}

.intro-headline {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15em;
  margin: 0;
  /* Width-driven, but capped by height so a short phone doesn't push the CTA offscreen */
  font-size: clamp(2.4rem, min(12.5vw, 8.5dvh), 7.5rem);
  color: var(--ink);
}

.setup,
.setup-line {
  display: block;
}

/* The punchline: a cream sticker slapped on the poster */
.punch {
  display: inline-block;
  margin-top: 0.15em;
  padding: 0.08em 0.28em 0.12em;
  border: var(--outline-thick);
  border-radius: var(--radius);
  background: var(--cream);
  box-shadow: var(--shadow-lg);
  font-size: 0.72em;
  transform: rotate(-3deg);
}

.intro-subline {
  margin: 0;
  max-width: 26ch;
  font-size: clamp(1.1rem, 1rem + 0.7vw, 1.45rem);
  font-weight: 700;
  line-height: 1.3;
}

.intro-cta {
  min-height: clamp(56px, 50px + 1.2vw, 68px);
  padding: 0 clamp(1.75rem, 1.5rem + 1vw, 2.5rem);
  font-size: clamp(1.4rem, 1.25rem + 0.6vw, 1.75rem);
  box-shadow: 6px 6px 0 var(--cream), 6px 6px 0 3px var(--ink);
  transform: rotate(-2deg);
}

.intro-cta:active:not(:disabled) {
  transform: rotate(-2deg) translate(5px, 5px) scale(0.97, 0.93);
  box-shadow: 1px 1px 0 var(--cream);
}

/* In the flow (not absolutely placed) so it can never overlap the CTA on short screens */
.scroll-hint {
  position: relative;
  z-index: 1;
  margin: 0;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.scroll-arrow {
  display: block;
  font-size: 1.4rem;
  animation: nudge 1.6s ease-in-out 1.6s infinite;
}

/* Food stickers: outlined circles scattered behind the copy */
.food-sticker {
  position: absolute;
  display: grid;
  place-items: center;
  width: clamp(48px, 36px + 3vw, 76px);
  height: clamp(48px, 36px + 3vw, 76px);
  border: var(--outline);
  border-radius: 50%;
  background: var(--cream);
  box-shadow: var(--shadow-sm);
  font-size: clamp(1.45rem, 1.1rem + 1.2vw, 2.3rem);
  line-height: 1;
  animation:
    sticker-in 0.35s var(--ease-pop) both,
    bob 3.2s ease-in-out infinite;
}
.food-sticker--1 { top: 17%; right: 7%; transform: rotate(-12deg); background: var(--accent); animation-delay: 1.6s, 2s; }
.food-sticker--2 { top: 4%;  left: 34%;  transform: rotate(10deg); animation-delay: 1.7s, 2.4s; }
.food-sticker--3 { bottom: 16%; right: 6%; transform: rotate(-6deg); animation-delay: 1.8s, 1.8s; }
.food-sticker--4 { bottom: 7%; left: 6%;  transform: rotate(8deg); background: var(--accent); animation-delay: 1.9s, 2.8s; }
.food-sticker--5 { top: 44%; right: -14px; transform: rotate(14deg); animation-delay: 2s, 2.2s; }

/* Phones: two stickers stay hidden so they don't crowd the copy */
.food-sticker--2,
.food-sticker--5 { display: none; }

@media (min-width: 640px) {
  .food-sticker--2,
  .food-sticker--5 { display: grid; }
}

/* Ticker between the intro and the location step */
.home-marquee {
  margin-top: -6px;
}

/* ---------- Location step ---------- */
.location-step {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: clamp(2rem, 1.5rem + 2vw, 3.5rem);
  padding-bottom: clamp(2.5rem, 2rem + 2vw, 4rem);
  scroll-margin-top: var(--header-total); /* clear the sticky header */
}

.location-headline {
  margin: 0;
  font-size: clamp(2.4rem, 1.6rem + 4.5vw, 4.5rem);
  outline: none;
}

.location-subline {
  margin: 0 0 0.5rem;
  max-width: 38ch;
  font-size: var(--text-base);
  font-weight: 500;
}

/* Full width on phones (inside the container's side padding) */
.location-card {
  width: 100%;
  padding: clamp(1.1rem, 0.8rem + 1.5vw, 2rem);
  border-width: var(--outline-w-thick);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

/* Tablet and up: centered column with a capped card */
@media (min-width: 640px) {
  .location-step {
    align-items: center;
    text-align: center;
  }

  .location-subline {
    margin-inline: auto;
  }

  .location-card {
    max-width: 520px;
    text-align: left;
  }
}

/* Fades in when scrolled into view (only while the intro is shown).
   Full height so "Bahala na!" can scroll it all the way to the top. */
.location-step.reveal {
  min-height: calc(100dvh - var(--header-total));
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.35s ease-out, transform 0.4s var(--ease-pop);
}
.location-step.reveal.is-visible {
  opacity: 1;
  transform: none;
}

.resume {
  display: inline-flex;
  align-items: center;
  align-self: center;
  min-height: 44px;
  text-align: center;
}

@keyframes sticker-in {
  from {
    opacity: 0;
    scale: 0;
  }
  to {
    opacity: 1;
    scale: 1;
  }
}

/* Uses `translate` so it doesn't override each sticker's rotate transform */
@keyframes bob {
  0%, 100% { translate: 0 0; }
  50% { translate: 0 -8px; }
}

@keyframes nudge {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
}

/* No motion at all for users who ask for it (on top of the global rule) */
@media (prefers-reduced-motion: reduce) {
  .scroll-arrow,
  .food-sticker {
    animation: none;
  }

  .location-step.reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
