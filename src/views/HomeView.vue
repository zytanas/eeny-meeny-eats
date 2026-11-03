<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { gsap } from 'gsap'
import { useLocationStore } from '@/stores/location'
import { prefersReducedMotion } from '@/utils/motion'
import LocationForm from '@/components/LocationForm.vue'
import chickenSvg from '@/assets/stickers/chicken.svg'
import sodaSvg from '@/assets/stickers/soda.svg'
import coffeeSvg from '@/assets/stickers/coffee.svg'
import ramenSvg from '@/assets/stickers/ramen.svg'
import pizzaSvg from '@/assets/stickers/pizza.svg'
import friesSvg from '@/assets/stickers/fries.svg'
import hotdogSvg from '@/assets/stickers/hotdog.svg'
import burgerSvg from '@/assets/stickers/burger.svg'
import sandwichSvg from '@/assets/stickers/sandwich.svg'
import pinSvg from '@/assets/stickers/pin.svg'
import mapSvg from '@/assets/stickers/map.svg'
import slotSvg from '@/assets/stickers/slot.svg'

// All headline, subline and button text for this screen, in one place for easy editing
const copy = {
  intro: {
    // Beat 1 (one line each), then beat 2 lands as the punchline
    // Each line is wrapped in oversized double quotes in the template
    headlineSetup: ['Kahit saan.', 'Ikaw bahala.'],
    headlinePunch: 'Sound familiar?',
    subline: "Explore what's near you, or let us pick for you.",
    cta: 'Bahala na!',
    scrollHint: 'or scroll down',
  },
  location: {
    headline: 'Saan ka ngayon?',
    subline: "Tell us where you are and we'll find food nearby.",
    // The form's own text (buttons, input) lives in components/LocationForm.vue
    privacyNote: "We only use your location to find food nearby. It's never saved.",
    recentLabel: 'Recent',
    clearRecent: 'Clear',
    clearRecentLabel: 'Clear recent searches',
    quickPicksLabel: 'Quick picks',
    moreAreas: 'More areas',
    resume: (label) => `Continue exploring ${label} →`,
  },
  howItWorks: {
    headline: 'How it works',
    // Each step's sticker is set in `howItWorksSteps` below
    steps: [
      { title: 'Share your location', text: 'Or type any city or area.' },
      { title: "Explore what's near", text: 'Browse places on the map and list.' },
      { title: 'Bahala na!', text: 'Still stuck? Let us pick for you.' },
    ],
  },
}

// Area chips under the input. Tapping one searches that area right away.
// Ordered Luzon, then Visayas, then Mindanao.
const quickPickAreas = [
  'Makati', 'BGC', 'Tagaytay', 'La Union', 'Baguio', 'Pampanga', 'Vigan',
  'Cebu City', 'Iloilo City', 'Bacolod',
  'Davao City', 'Cagayan de Oro',
]
// Only the first few show until "More areas" is tapped, so the card stays short
const QUICK_PICKS_SHOWN = 6

const howItWorksSteps = copy.howItWorks.steps.map((step, i) => ({
  ...step,
  sticker: [pinSvg, mapSvg, slotSvg][i],
}))
const fullHeadline = [...copy.intro.headlineSetup.map((line) => `“${line}”`), copy.intro.headlinePunch].join(' ')

// Decorative food stickers scattered around the hero edges.
// Position, size and rotation live in the CSS (.food-sticker--<name>).
const stickers = [
  { name: 'chicken', src: chickenSvg },
  { name: 'pizza', src: pizzaSvg },
  { name: 'fries', src: friesSvg },
  { name: 'burger', src: burgerSvg },
  { name: 'soda', src: sodaSvg },
  { name: 'hotdog', src: hotdogSvg },
  { name: 'sandwich', src: sandwichSvg },
  { name: 'coffee', src: coffeeSvg },
  { name: 'ramen', src: ramenSvg },
]

const router = useRouter()
const location = useLocationStore()

// The intro plays on every visit, including return visits
const introEl = ref(null)
const locationStep = ref(null)
const locationHeading = ref(null)
let observer = null
let gsapCtx = null

onMounted(() => {
  playIntro()

  // The location step fades in once it scrolls into view
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        locationStep.value?.classList.add('is-visible')
        observer.disconnect()
      }
    },
    { threshold: 0.2 },
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

// The Clear button disappears with the recents, so hand focus to the first quick pick
const quickPicksEl = ref(null)
async function clearRecent() {
  location.clearRecentAreas()
  await nextTick()
  quickPicksEl.value?.querySelector('button')?.focus()
}

// "More areas" removes itself, so focus moves to the first newly shown chip
const showAllAreas = ref(false)
const visibleQuickPicks = computed(() =>
  showAllAreas.value ? quickPickAreas : quickPickAreas.slice(0, QUICK_PICKS_SHOWN),
)
async function expandQuickPicks() {
  showAllAreas.value = true
  await nextTick()
  quickPicksEl.value?.querySelectorAll('.chips button')[QUICK_PICKS_SHOWN]?.focus()
}

function continueToLocation() {
  locationStep.value.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block: 'start',
  })
  locationHeading.value?.focus({ preventScroll: true })
}
</script>

<template>
  <div class="home">
    <section ref="introEl" class="intro" aria-labelledby="intro-headline">
      <img
        v-for="s in stickers"
        :key="s.name"
        :src="s.src"
        alt=""
        aria-hidden="true"
        draggable="false"
        width="420"
        height="385"
        class="food-sticker"
        :class="`food-sticker--${s.name}`"
      />

      <div class="intro-content">
        <h1 id="intro-headline" class="intro-headline display" :aria-label="fullHeadline">
          <span class="setup" aria-hidden="true">
            <span v-for="line in copy.intro.headlineSetup" :key="line" class="setup-line"
              ><span class="quote">“</span>{{ line }}<span class="quote">”</span></span
            >
          </span>
          <span class="punch" aria-hidden="true">{{ copy.intro.headlinePunch }}</span>
        </h1>
        <p class="intro-subline">{{ copy.intro.subline }}</p>
        <button class="btn btn-primary btn-display intro-cta" @click="continueToLocation">{{ copy.intro.cta }}</button>
      </div>

      <p class="scroll-hint" aria-hidden="true">
        {{ copy.intro.scrollHint }}
        <span class="scroll-arrow">↓</span>
      </p>
    </section>

    <section id="location-step" ref="locationStep" class="container location-step reveal">
      <!-- Left (or first, when stacked): headline and the steps. Right: the location card. -->
      <div class="location-intro">
        <h2 ref="locationHeading" tabindex="-1" class="location-headline display">
          {{ copy.location.headline }}
        </h2>
        <p class="location-subline">{{ copy.location.subline }}</p>

        <section class="how-it-works" aria-labelledby="how-it-works-headline">
          <h3 id="how-it-works-headline" class="how-headline display">{{ copy.howItWorks.headline }}</h3>
          <!-- Dashed connectors between the rows (::before/::after) read as a sequence -->
          <ol class="steps">
            <li v-for="(step, i) in howItWorksSteps" :key="step.title" class="step sticker">
              <span class="step-num" aria-hidden="true">{{ i + 1 }}</span>
              <img
                :src="step.sticker"
                alt=""
                aria-hidden="true"
                draggable="false"
                width="512"
                height="512"
                class="step-sticker"
              />
              <div class="step-body">
                <h4 class="step-title">{{ step.title }}</h4>
                <p class="step-text">{{ step.text }}</p>
              </div>
            </li>
          </ol>
        </section>
      </div>

      <div class="location-main">
        <!-- A mango card sits behind the form (::before), with two stickers peeking from behind -->
        <div class="card-stack">
          <img
            :src="friesSvg"
            alt=""
            aria-hidden="true"
            draggable="false"
            width="420"
            height="385"
            class="peek-sticker peek-sticker--top"
          />
          <img
            :src="sodaSvg"
            alt=""
            aria-hidden="true"
            draggable="false"
            width="420"
            height="385"
            class="peek-sticker peek-sticker--bottom"
          />

          <div class="location-card sticker">
            <LocationForm id-prefix="home" @located="router.push({ name: 'explore' })">
              <template #after-locate>
                <p class="privacy-note">{{ copy.location.privacyNote }}</p>
              </template>

              <template #after-input="{ search }">
                <div
                  v-if="location.recentAreas.length"
                  class="chip-group"
                  role="group"
                  aria-labelledby="home-recent-label"
                >
                  <div class="chip-group-head">
                    <span id="home-recent-label" class="chip-group-label">{{ copy.location.recentLabel }}</span>
                    <button
                      type="button"
                      class="clear-link"
                      :aria-label="copy.location.clearRecentLabel"
                      @click="clearRecent"
                    >
                      {{ copy.location.clearRecent }}
                    </button>
                  </div>
                  <ul class="chips">
                    <li v-for="area in location.recentAreas" :key="area">
                      <button type="button" class="chip chip--recent" @click="search(area)">
                        <svg class="chip-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3.5 2" />
                        </svg>
                        {{ area }}
                      </button>
                    </li>
                  </ul>
                </div>

                <div ref="quickPicksEl" class="chip-group" role="group" aria-labelledby="home-picks-label">
                  <span id="home-picks-label" class="chip-group-label">{{ copy.location.quickPicksLabel }}</span>
                  <ul class="chips">
                    <li v-for="area in visibleQuickPicks" :key="area">
                      <button type="button" class="chip" @click="search(area)">{{ area }}</button>
                    </li>
                    <li v-if="!showAllAreas">
                      <button type="button" class="chip chip--more" @click="expandQuickPicks">
                        {{ copy.location.moreAreas }}
                        <span class="chip-more-icon" aria-hidden="true">+</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </template>
            </LocationForm>
          </div>
        </div>

        <RouterLink v-if="location.hasLocation" :to="{ name: 'explore' }" class="resume">
          {{ copy.location.resume(location.label) }}
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
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
  padding: clamp(2rem, 6dvh, 4rem) var(--pad-right)
    calc(clamp(1rem, 3dvh, 2rem) + env(safe-area-inset-bottom)) var(--pad-left);
  text-align: center;
  /* Soft strawberry with a faint halftone dot texture */
  background:
    radial-gradient(var(--color-hero-dot) 1.5px, transparent 1.7px) 0 0 / 16px 16px,
    var(--color-hero);
  color: var(--color-ink);
}

/* Everything in the hero sits on the center line */
.intro-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(1rem, 2.5dvh, 1.6rem);
  width: 100%;
  max-width: 1100px;
  margin: auto; /* centers vertically too, above the scroll hint */
}

/* The dominant element of the hero. Width-driven (3rem on small phones up to 8rem),
   but capped by height so a short screen doesn't push the CTA offscreen */
.intro-headline {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.12em;
  max-width: 100%;
  margin: 0;
  font-size: clamp(2.75rem, min(10.5vw, 13dvh), 8rem);
  color: var(--color-ink);
}

.setup,
.setup-line {
  display: block;
}

/* Oversized double quotes around each line. line-height: 0 stops them from
   spreading the lines apart; vertical-align pulls them back down to the cap height. */
.quote {
  display: inline-block;
  margin-inline: -0.04em; /* the marks have wide side bearings */
  font-size: 1.4em;
  line-height: 0;
  vertical-align: -0.28em;
}

/* The punchline: a cream sticker slapped on the poster.
   Sized in em so the badge, outline and shadow all grow with the headline. */
.punch {
  display: inline-block;
  margin-top: 0.15em;
  padding: 0.08em 0.28em 0.12em;
  border: max(var(--outline-w-thick), 0.055em) solid var(--color-ink);
  border-radius: max(var(--radius), 0.3em);
  background: var(--color-card);
  box-shadow: max(6px, 0.1em) max(6px, 0.1em) 0 var(--color-ink);
  font-size: 0.72em;
  transform: rotate(-3deg);
}

.intro-subline {
  margin: 0 auto;
  max-width: 26ch;
  font-size: clamp(1.1rem, 1rem + 0.7vw, 1.45rem);
  font-weight: 700;
  line-height: 1.3;
}

.intro-cta {
  min-height: clamp(56px, 50px + 1.2vw, 68px);
  padding: 0 clamp(1.75rem, 1.5rem + 1vw, 2.5rem);
  font-size: clamp(1.4rem, 1.25rem + 0.6vw, 1.75rem);
  box-shadow: 6px 6px 0 var(--color-ink);
  transform: rotate(-2deg);
}

.intro-cta:active:not(:disabled) {
  transform: rotate(-2deg) translate(5px, 5px) scale(0.97, 0.93);
  box-shadow: 1px 1px 0 var(--color-ink);
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

/* Food stickers: the illustrations sit straight on the pink, around the edges.
   Each one sets --w (width) and --rot; the shadow follows the drawing's outline.
   Rotation, the pop-in (scale) and the bob (translate) each use their own
   property, so the animations never fight over `transform`. */
.food-sticker {
  --w: 80px;
  --rot: 0deg;
  --shadow-off: 4px;
  position: absolute;
  z-index: 0;
  width: var(--w);
  height: auto;
  rotate: var(--rot);
  filter: drop-shadow(var(--shadow-off) var(--shadow-off) 0 var(--color-ink));
  pointer-events: none;
  user-select: none;
  animation:
    sticker-in 0.35s var(--ease-pop) both,
    bob 3.4s ease-in-out infinite;
}

/* Rotation and timing are shared by every screen size */
.food-sticker--chicken  { --rot: -12deg; animation-delay: 1.6s, 2s; }
.food-sticker--pizza    { --rot: 11deg;  animation-delay: 1.7s, 2.6s; }
.food-sticker--fries    { --rot: 8deg;   animation-delay: 1.8s, 3.1s; }
.food-sticker--burger   { --rot: -9deg;  animation-delay: 1.9s, 2.3s; }
.food-sticker--soda     { --rot: 7deg;   animation-delay: 2s, 2.9s; }
.food-sticker--hotdog   { --rot: -14deg; animation-delay: 2.1s, 1.7s; }
.food-sticker--sandwich { --rot: 5deg;   animation-delay: 2.2s, 3.3s; }
.food-sticker--coffee,
.food-sticker--ramen { display: none; }

/* Phones and tablets: seven big stickers filling the zones above and below the
   headline group, bleeding off the sides. Each one sets --bleed, the share of its
   width pushed past the edge. Padding keeps those zones clear of the text, so the
   stickers only ever brush the text block's outer edges (and sit behind it).
   The bottom zone is always at least as tall as the sandwich (the drawing fills
   about 80% of its width in height), so it can't reach the button or scroll hint. */
@media (max-width: 1023.98px) {
  .intro {
    --zone: clamp(4.5rem, 12dvh, 7rem);
    --sandwich-w: clamp(96px, 28vw, 118px);
    justify-content: center;
    padding-top: var(--zone);
    padding-bottom: calc(max(var(--zone), var(--sandwich-w) * 0.8 + 1rem) + env(safe-area-inset-bottom));
  }

  /* Centered as one group with the scroll hint tucked right under the button,
     so the sandwich below never covers it */
  .intro-content { margin: 0 auto; }

  .food-sticker--chicken  { --w: clamp(120px, 36vw, 150px); --bleed: 0.3;  top: 0.25rem; left: calc(var(--w) * var(--bleed) * -1); }
  .food-sticker--pizza    { --w: clamp(112px, 33vw, 140px); --bleed: 0.3;  top: 0.5rem;  right: calc(var(--w) * var(--bleed) * -1); }
  /* The headline group is centered, so the side pair is placed from the center line:
     soda beside the headline, hot dog beside the "Sound familiar?" badge */
  .food-sticker--soda     { --w: clamp(88px, 26vw, 110px);  --bleed: 0.5;  top: max(calc(50% - 11rem), 8.5rem); left: calc(var(--w) * var(--bleed) * -1); }
  .food-sticker--hotdog   { --w: clamp(88px, 26vw, 110px);  --bleed: 0.5;  top: max(calc(50% - 7rem), 10rem); right: calc(var(--w) * var(--bleed) * -1); }
  .food-sticker--fries    { --w: clamp(112px, 33vw, 140px); --bleed: 0.3;  bottom: 0.5rem; left: calc(var(--w) * var(--bleed) * -1); }
  .food-sticker--burger   { --w: clamp(130px, 38vw, 160px); --bleed: 0.3;  bottom: 0;    right: calc(var(--w) * var(--bleed) * -1); }
  .food-sticker--sandwich { --w: var(--sandwich-w); bottom: 0.25rem; left: calc(50% - var(--w) / 2); }
}

/* Tablets: same arrangement, bigger and less bleed. Soda and hot dog hug the
   headline at mid-height. */
@media (min-width: 640px) and (max-width: 1023.98px) {
  /* Landscape tablets are short, so the sandwich also shrinks with the height */
  .intro {
    --zone: clamp(4.5rem, 12dvh, 9rem);
    --sandwich-w: clamp(140px, min(18vw, 18dvh), 165px);
  }
  .food-sticker { --shadow-off: 5px; }
  .food-sticker--chicken  { --w: clamp(170px, 22vw, 190px); --bleed: 0.22; }
  .food-sticker--pizza    { --w: clamp(160px, 21vw, 180px); --bleed: 0.22; }
  .food-sticker--soda     { --w: clamp(150px, 18vw, 165px); --bleed: 0.22; top: max(calc(50% - 16rem), 12.5rem); }
  .food-sticker--hotdog   { --w: clamp(150px, 18vw, 165px); --bleed: 0.22; top: max(calc(50% - 12rem), 14rem); }
  .food-sticker--fries    { --w: clamp(160px, 20vw, 175px); --bleed: 0.2; }
  .food-sticker--burger   { --w: clamp(170px, 22vw, 190px); --bleed: 0.22; }
}

/* Desktop: all eight, with room to roam on the sides */
@media (min-width: 1024px) {
  .food-sticker { --shadow-off: 6px; }
  .food-sticker--chicken  { --w: clamp(128px, 12vw, 220px); top: 6%;  left: 4%; }
  .food-sticker--pizza    { --w: clamp(120px, 11vw, 200px); top: 7%;  right: 5%; }
  .food-sticker--fries    { --w: clamp(120px, 10vw, 170px); bottom: 9%; left: 5%; }
  .food-sticker--burger   { --w: clamp(150px, 13vw, 220px); bottom: 7%; right: 4%; }
  .food-sticker--soda     { --w: clamp(100px, 8.5vw, 140px); top: 44%; left: 1%; }
  .food-sticker--hotdog   { --w: clamp(110px, 9.5vw, 160px); top: 40%; right: 1%; }
  .food-sticker--coffee   { --w: clamp(110px, 9vw, 150px);  --rot: 4deg;  display: block; bottom: 3%; left: 22%;  animation-delay: 2.2s, 2.4s; }
  .food-sticker--ramen    { --w: clamp(120px, 10vw, 170px); --rot: -6deg; display: block; bottom: 3%; right: 22%; animation-delay: 2.3s, 2.8s; }
  .food-sticker--sandwich { display: none; } /* coffee and ramen take the bottom row here */
}

/* ---------- Location step ---------- */
/* Phones and tablets: one centered column (headline, steps, then the card).
   Desktop: two columns, steps on the left and the card on the right (see below). */
.location-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(1rem, 0.6rem + 2vw, 2rem);
  text-align: center;
  padding-top: clamp(1.5rem, 1rem + 2vw, 3.5rem);
  padding-bottom: clamp(2.5rem, 2rem + 2vw, 4rem);
  scroll-margin-top: var(--header-total); /* clear the sticky header */
}

.location-intro,
.location-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 520px;
}

.location-main {
  gap: 1rem;
}

.location-headline {
  margin: 0;
  font-size: clamp(2.2rem, 1.6rem + 4vw, 4.5rem);
  outline: none;
}

.location-subline {
  margin: 0.4rem auto 0;
  max-width: 32ch;
  font-size: var(--text-lg);
  font-weight: 700;
  line-height: 1.3;
}

/* Desktop: wider container, two top-aligned columns, everything left-aligned */
@media (min-width: 1024px) {
  .location-step.container {
    max-width: 1100px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
    align-items: start;
    column-gap: clamp(3rem, 1rem + 4vw, 5rem);
    text-align: left;
  }

  .location-intro,
  .location-main {
    align-items: stretch;
    max-width: none;
  }

  .location-subline {
    margin-left: 0;
  }
}

/* Full width on phones (inside the container's side padding), capped from tablet up.
   Holds the mango backing card and the peeking stickers around the form. */
.card-stack {
  position: relative;
  width: 100%;
  margin-bottom: 0.75rem; /* room for the backing card */
}

/* The mango card behind, tilted and offset like a second sticker underneath */
.card-stack::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  border: var(--outline-thick);
  border-radius: var(--radius-lg);
  background: var(--color-accent);
  box-shadow: var(--shadow);
  rotate: -2deg;
  translate: 4px 8px;
}

/* The form keeps left-aligned labels so it stays easy to read */
.location-card {
  position: relative;
  z-index: 2;
  width: 100%;
  padding: clamp(1.1rem, 0.8rem + 1.5vw, 2rem);
  border-width: var(--outline-w-thick);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  text-align: left;
}

/* Stickers tucked behind the card: most of each drawing is hidden under the card, so
   they can never cover the form. Both peek out on the card's own side (over the top
   edge and off the right edge), never toward the steps. Hidden on phones, where the
   card fills the width and there's no margin for them to peek into. */
.peek-sticker {
  --w: 96px;
  position: absolute;
  z-index: 1;
  display: none;
  width: var(--w);
  height: auto;
  filter: drop-shadow(4px 4px 0 var(--color-ink));
  pointer-events: none;
  user-select: none;
}

/* Pops up over the card's top edge, toward its right corner */
.peek-sticker--top {
  top: calc(var(--w) * -0.55);
  right: 12%;
  rotate: 10deg;
}

/* Out the right side, low down */
.peek-sticker--bottom {
  bottom: 14%;
  right: calc(var(--w) * -0.5);
  rotate: -12deg;
}

@media (min-width: 640px) {
  .card-stack {
    margin-top: calc(96px * 0.55); /* room for the top sticker above the card */
    margin-bottom: 1.5rem;
  }

  .card-stack::before {
    rotate: -3deg;
    translate: 10px 12px;
  }

  .peek-sticker {
    display: block;
  }
}

@media (min-width: 1024px) {
  .card-stack {
    margin-top: calc(112px * 0.55);
  }

  /* The card column leaves room on its right for the side sticker to peek into,
     so it isn't cut off by the screen edge on narrower desktops */
  .location-main {
    padding-right: calc(112px * 0.4);
  }

  .peek-sticker {
    --w: 112px;
    filter: drop-shadow(5px 5px 0 var(--color-ink));
  }

  .peek-sticker--bottom {
    right: calc(var(--w) * -0.4);
  }
}

@media (min-width: 1280px) {
  .location-main {
    padding-right: 0; /* the container's side margin has room for it here */
  }

  .card-stack {
    margin-top: calc(128px * 0.55);
  }

  .peek-sticker {
    --w: 128px;
  }

  .peek-sticker--bottom {
    right: calc(var(--w) * -0.5);
  }
}

/* Sits right under "Use my location" (the form's 1rem gap is pulled in a little) */
.privacy-note {
  margin: -0.4rem 0 0;
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-muted);
  line-height: 1.4;
}

/* ---------- Area chips (recent + quick picks) ---------- */
.chip-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 0.15rem;
}

.chip-group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.chip-group-label {
  font-size: var(--text-sm);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-muted);
}

/* Small text link, with an invisible padded box so it's still easy to tap */
.clear-link {
  margin: -0.6rem -0.5rem;
  padding: 0.6rem 0.5rem;
  border: 0;
  background: none;
  color: var(--color-link);
  font-size: var(--text-sm);
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}

/* Wrap onto more lines rather than scroll sideways */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: var(--tap-min);
  padding: 0 0.9rem;
  border: 2px solid var(--color-ink);
  border-radius: var(--radius-pill);
  background: var(--color-card);
  box-shadow: 2px 2px 0 var(--color-ink);
  font-size: var(--text-sm);
  font-weight: 800;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform var(--dur-press) ease-out,
    box-shadow var(--dur-press) ease-out,
    background-color var(--dur-fast);
}

.chip:hover {
  background: var(--color-accent);
}

.chip:active {
  transform: translate(2px, 2px);
  box-shadow: 0 0 0 var(--color-ink);
}

/* Recent searches: strawberry tint with a clock, so they read as "yours" */
.chip--recent {
  background: var(--color-hero);
}

/* Dashed outline and a "+" so it reads as "show more", not another area */
.chip--more {
  border-style: dashed;
  background: transparent;
  box-shadow: none;
}

.chip-more-icon {
  font-size: 1.15em;
  line-height: 1;
}

.chip-icon {
  flex-shrink: 0;
  width: 1.1em;
  height: 1.1em;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* ---------- How it works ---------- */
/* Rows at every size: number badge, sticker, then the text beside it.
   Compact on phones so "Use my location" stays close to the top. */
.how-it-works {
  --sticker-w: 48px;
  --step-pad-x: 0.9rem;
  --step-gap: 1.5rem; /* the dashed connector spans this */
  width: 100%;
  margin-top: clamp(1rem, 0.6rem + 1.5vw, 2rem);
}

.how-headline {
  margin: 0 0 1.1rem; /* clears the number badge */
  font-size: clamp(1.5rem, 1.2rem + 1.5vw, 2.4rem);
}

.steps {
  display: grid;
  gap: var(--step-gap);
  margin: 0;
  padding: 0;
  list-style: none;
}

.step {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.6rem var(--step-pad-x) 0.6rem calc(var(--step-pad-x) + 0.5rem);
  text-align: left;
}

.step:nth-child(odd) { rotate: -0.6deg; }
.step:nth-child(even) { rotate: 0.6deg; }

/* Dashed connector down to the next row, lined up under the sticker, with a small
   arrowhead at its end */
.step:not(:last-child)::before,
.step:not(:last-child)::after {
  content: '';
  position: absolute;
  left: calc(var(--step-pad-x) + 0.5rem + var(--sticker-w) / 2);
  pointer-events: none;
}

/* Starts below the card's hard shadow and runs into the arrowhead */
.step:not(:last-child)::before {
  top: calc(100% + var(--outline-w) + 5px);
  height: calc(var(--step-gap) - var(--outline-w) - 11px);
  border-left: var(--outline-w) dashed var(--color-ink);
  translate: -50% 0;
}

.step:not(:last-child)::after {
  top: calc(100% + var(--step-gap) - 8px);
  border: 5px solid transparent;
  border-top: 6px solid var(--color-ink);
  border-bottom: 0;
  translate: -50% 0;
}

.step-num {
  position: absolute;
  top: -0.7rem;
  left: -0.6rem;
  display: grid;
  place-items: center;
  width: 1.8rem;
  height: 1.8rem;
  border: var(--outline);
  border-radius: 50%;
  background: var(--color-accent);
  font-family: var(--font-display);
  font-size: 0.95rem;
  rotate: -8deg;
}

.step-sticker {
  flex-shrink: 0;
  width: var(--sticker-w);
  height: auto;
  filter: drop-shadow(3px 3px 0 var(--color-ink));
  user-select: none;
}

.step-title {
  margin: 0 0 0.15rem;
  font-family: var(--font-display);
  font-size: clamp(1rem, 0.95rem + 0.4vw, 1.3rem);
  font-weight: 400;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  line-height: 1.1;
}

.step-text {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 500;
  line-height: 1.35;
}

@media (min-width: 640px) {
  .how-it-works {
    --sticker-w: 60px;
    --step-pad-x: 1.1rem;
    --step-gap: 1.75rem;
  }

  .step {
    padding-block: 0.8rem;
  }

  .step-num {
    width: 2.1rem;
    height: 2.1rem;
    font-size: 1.1rem;
  }
}

/* Desktop: roomier rows in the left column */
@media (min-width: 1024px) {
  .how-it-works {
    --sticker-w: 76px;
    --step-gap: 2.25rem;
    margin-top: 2rem;
  }

  .step {
    gap: 1.1rem;
    padding-block: 1rem;
  }

  /* The last row points across the gap to the card */
  .step:last-child::after {
    content: '→';
    position: absolute;
    top: 50%;
    left: calc(100% + 0.6rem);
    font-family: var(--font-display);
    font-size: 2rem;
    line-height: 1;
    translate: 0 -55%;
    pointer-events: none;
  }
}

/* Fades in when scrolled into view.
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

/* Uses `translate` so it doesn't override each sticker's `rotate` */
@keyframes bob {
  0%, 100% { translate: 0 0; }
  50% { translate: 0 -10px; }
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
