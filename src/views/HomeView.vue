<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { gsap } from "gsap";
import { useLocationStore } from "@/stores/location";
import { usePlacesStore } from "@/stores/places";
import { prefersReducedMotion } from "@/utils/motion";
import { FOOD_ART, FOOD_ART_SIZE } from "@/utils/foodArt";
import LocationForm from "@/components/LocationForm.vue";
import AreaChips from "@/components/AreaChips.vue";
import pinArt from "@/assets/tools/pin.webp";
import mapArt from "@/assets/tools/map.webp";
import slotArt from "@/assets/tools/slot.webp";

// All headline, subline and button text for this screen, in one place for easy editing
const copy = {
  intro: {
    // Beat 1 (one line each), then beat 2 lands as the punchline
    // Each line is wrapped in oversized double quotes in the template
    headlineSetup: ["Kahit saan.", "Ikaw bahala."],
    headlinePunch: "Sound familiar?",
    subline: "Explore what's near you, or let us pick for you.",
    cta: "Bahala na!",
    ctaBusy: "Picking…",
    scrollHint: "or scroll down",
    // Decorative stickers around the headline (aria-hidden, so screen readers skip them)
    labels: {
      club: "Kahit saan club",
      arte: "Walang arte",
      kainan: "Your next kainan",
      // The \n only breaks the line on phones (see .deco--umay); elsewhere it's a space
      umay: "Fast food na naman?\nUmay.",
    },
  },
  location: {
    headline: "Saan ka ngayon?",
    subline: "Tell us where you are and we'll find food nearby.",
    // Shown after "Bahala na!" was tapped before we knew the location
    pickPending: "Set your spot and we'll pick a place right away.",
    picking: "Picking a place near you…",
    // The form's own text (buttons, input) lives in components/LocationForm.vue,
    // and the Recent / Quick picks chips' text in components/AreaChips.vue
    privacyNote: "We only use your location to find food nearby. It's never saved.",
    resume: (label) => `Continue exploring ${label} →`,
  },
  howItWorks: {
    headline: "How it works",
    // Each step's sticker is set in `howItWorksSteps` below
    steps: [
      {
        title: "Share your location",
        text: "Or type a street or landmark, plus the city.",
      },
      { title: "Explore what's near", text: "Browse places on the map and list." },
      { title: "Bahala na!", text: "Still stuck? Let us pick for you." },
    ],
  },
};

const howItWorksSteps = copy.howItWorks.steps.map((step, i) => ({
  ...step,
  sticker: [pinArt, mapArt, slotArt][i],
}));
const fullHeadline = [
  ...copy.intro.headlineSetup.map((line) => `“${line}”`),
  copy.intro.headlinePunch,
].join(" ");

// Decorative illustrations and labels scattered around the headline, like stickers on a board.
// `block` puts the art on an outlined color block. Which zone each one sits in, and its
// position, size and tilt, live in the CSS (.deco--<name>). `lazy` marks items that only
// show on wider screens, so phones never download them.
const heroDecor = [
  { name: "taco", art: "taco" },
  { name: "sushi", art: "sushi", block: "mint", lazy: true },
  { name: "iced-coffee", art: "icedCoffee" },
  { name: "bibimbap", art: "bibimbap", block: "coral" },
  { name: "pho", art: "pho" },
  { name: "sisig", art: "sisig", lazy: true },
  { name: "samgyupsal", art: "samgyupsal", block: "glacier", lazy: true },
  { name: "barbecue", art: "barbecue", lazy: true },
  { name: "club", label: copy.intro.labels.club, block: "coral" },
  { name: "arte", label: copy.intro.labels.arte, block: "mint" },
  { name: "kainan", label: copy.intro.labels.kainan, block: "accent" },
  { name: "umay", label: copy.intro.labels.umay, block: "glacier" },
].map((item, i) => ({ ...item, index: i, img: item.art && FOOD_ART[item.art] }));

const router = useRouter();
const location = useLocationStore();
const places = usePlacesStore();

// The intro plays on every visit, including return visits
const introEl = ref(null);
const locationStep = ref(null);
const locationHeading = ref(null);
let observer = null;
let gsapCtx = null;

onMounted(() => {
  playIntro();

  // The location step fades in once it scrolls into view
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        locationStep.value?.classList.add("is-visible");
        observer.disconnect();
      }
    },
    { threshold: 0.2 }
  );
  observer.observe(locationStep.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  gsapCtx?.revert();
});

// Two-beat headline: the familiar excuses drop in, a pause, then the punchline slams down
function playIntro() {
  if (prefersReducedMotion()) return;

  gsapCtx = gsap.context(() => {
    gsap
      .timeline()
      .from(".setup-line", {
        y: 48,
        rotate: -4,
        opacity: 0,
        duration: 0.35,
        stagger: 0.2,
        ease: "back.out(2)",
      })
      .from(
        ".punch",
        {
          scale: 2.2,
          rotate: 10,
          opacity: 0,
          duration: 0.35,
          ease: "power4.in",
          clearProps: "all",
        },
        "+=0.55" // the comedic beat before the punchline
      )
      // Landing thud: the whole headline bumps when the punchline hits
      .to(".intro-headline", {
        y: 6,
        duration: 0.08,
        yoyo: true,
        repeat: 1,
        ease: "power1.out",
      })
      .from(
        [".intro-subline", ".intro-cta", ".scroll-hint"],
        {
          y: 24,
          opacity: 0,
          duration: 0.3,
          stagger: 0.08,
          ease: "back.out(1.8)",
          clearProps: "all",
        },
        "+=0.1"
      );
  }, introEl.value);
}

function continueToLocation() {
  locationStep.value.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "start",
  });
  locationHeading.value?.focus({ preventScroll: true });
}

// "Bahala na!": always picks near where the user is right now, so it asks the browser for the
// live location on every tap (even if an area was typed earlier) and picks once it's allowed.
// Whatever spot gets set next leads to a pick: the live location, or a typed area or quick
// pick. Unless location is already allowed, the location step scrolls into view straight away,
// so the user can type an area while the browser's prompt is still waiting for an answer
// (typing wins; the store ignores a late answer). If location is denied or unavailable, the
// step shows why. "Finding you…" shows on the step's location button, not here.
const picking = ref(false);
const pickAfterLocate = ref(false);
const locating = computed(() => location.status === "locating");

const ctaText = computed(() => (picking.value ? copy.intro.ctaBusy : copy.intro.cta));

async function bahalaNa() {
  if (picking.value) return;
  pickAfterLocate.value = true;
  // Already asking (e.g. tapped twice): the pending answer or a typed area will lead to a pick
  if (locating.value) return continueToLocation();

  const granted = await geolocationGranted();
  if (!granted) continueToLocation(); // a prompt is about to show (or it's denied)

  const located = await location.requestBrowserLocation();
  if (located === null) return; // a typed area or quick pick came first; onLocated picked
  if (located) {
    pickAfterLocate.value = false;
    return pickAndGo();
  }
  if (granted) continueToLocation(); // allowed but unavailable: show why
}

// True only when location is already allowed, so asking won't show a prompt. Browsers without
// the Permissions API count as "not yet allowed".
async function geolocationGranted() {
  try {
    return (await navigator.permissions.query({ name: "geolocation" })).state === "granted";
  } catch {
    return false;
  }
}

// Falls back to Explore when there's nothing to pick from, which explains why
// (load error, no places nearby, or filters that rule everything out)
async function pickAndGo() {
  picking.value = true;
  try {
    const pick = await places.pickNearby();
    await router.push(
      pick ? { name: "pick", params: { id: pick.id } } : { name: "explore" }
    );
  } finally {
    picking.value = false;
  }
}

function onLocated() {
  if (pickAfterLocate.value) {
    pickAfterLocate.value = false;
    pickAndGo();
  } else {
    router.push({ name: "explore" });
  }
}
</script>

<template>
  <div class="home">
    <section ref="introEl" class="intro" aria-labelledby="intro-headline">
      <!-- Decorative stickers. Each sits in its own zone of the hero grid (above, below or
           beside the headline group), so it can never cover the headline or the button. -->
      <template v-for="d in heroDecor" :key="d.name">
        <!-- Outer span: placement, tilt and pop-in. Inner span: the idle float and the color block. -->
        <span
          v-if="d.label"
          class="deco deco--label"
          :class="`deco--${d.name}`"
          :style="{ '--i': d.index }"
          aria-hidden="true"
        >
          <span class="deco-body" :class="`block--${d.block}`">{{ d.label }}</span>
        </span>
        <span
          v-else
          class="deco deco--art"
          :class="[`deco--${d.name}`, { 'deco--on-block': d.block }]"
          :style="{ '--i': d.index }"
          aria-hidden="true"
        >
          <span class="deco-body" :class="d.block && `block--${d.block}`">
            <img
              :src="d.img.src"
              alt=""
              draggable="false"
              :width="d.img.width"
              :height="d.img.height"
              :loading="d.lazy ? 'lazy' : undefined"
              decoding="async"
            />
          </span>
        </span>
      </template>

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
        <button
          class="btn btn-primary btn-display intro-cta"
          :aria-busy="picking ? 'true' : undefined"
          @click="bahalaNa"
        >
          <span
            class="cta-dice"
            :class="{ 'is-rolling': picking }"
            aria-hidden="true"
            >🎲</span
          >
          {{ ctaText }}
        </button>
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
        <!-- Always in the DOM so screen readers announce the change to "picking" -->
        <p class="pick-note" role="status">
          <span v-if="picking" class="pick-note-text">{{ copy.location.picking }}</span>
          <span v-else-if="pickAfterLocate" class="pick-note-text">{{
            copy.location.pickPending
          }}</span>
        </p>

        <section class="how-it-works" aria-labelledby="how-it-works-headline">
          <h3 id="how-it-works-headline" class="how-headline display">
            {{ copy.howItWorks.headline }}
          </h3>
          <!-- Dashed connectors between the rows (::before/::after) read as a sequence -->
          <ol class="steps">
            <li
              v-for="(step, i) in howItWorksSteps"
              :key="step.title"
              class="step sticker"
            >
              <span class="step-num" aria-hidden="true">{{ i + 1 }}</span>
              <img
                :src="step.sticker"
                alt=""
                aria-hidden="true"
                draggable="false"
                width="400"
                height="400"
                loading="lazy"
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
            :src="FOOD_ART.icedCoffee.src"
            alt=""
            aria-hidden="true"
            draggable="false"
            :width="FOOD_ART_SIZE"
            :height="FOOD_ART_SIZE"
            loading="lazy"
            decoding="async"
            class="peek-sticker peek-sticker--top"
          />
          <img
            :src="FOOD_ART.taco.src"
            alt=""
            aria-hidden="true"
            draggable="false"
            :width="FOOD_ART_SIZE"
            :height="FOOD_ART_SIZE"
            loading="lazy"
            decoding="async"
            class="peek-sticker peek-sticker--bottom"
          />

          <div class="location-card sticker">
            <LocationForm id-prefix="home" @located="onLocated">
              <template #after-locate>
                <p class="privacy-note">{{ copy.location.privacyNote }}</p>
              </template>

              <template #after-input="{ search, choose }">
                <AreaChips :search="search" :choose="choose" id-prefix="home" quick-picks />
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
/* A grid that fills the screen under the header:
     phones and tablets   top decor / headline group / bottom decor / scroll hint
     desktop              plus a decor column either side of the headline group
   Decorative stickers are absolutely placed inside a zone's grid area and sized from it,
   so they can't reach the headline group's row (or column, on desktop). Spacing and type
   also scale with the screen height (dvh), so short phones fit everything. If it still
   doesn't fit, the section grows and the decor zones keep their minimum height. */
.intro {
  --zone-min: clamp(4.5rem, 13dvh, 8rem);
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(var(--zone-min), 1fr) auto minmax(var(--zone-min), 1fr) auto;
  grid-template-areas: "top" "content" "bottom" "hint";
  row-gap: clamp(0.5rem, 2dvh, 1.25rem);
  min-height: calc(100dvh - var(--header-total));
  padding: clamp(0.5rem, 2dvh, 1.5rem) var(--pad-right)
    calc(clamp(0.75rem, 2.5dvh, 1.5rem) + env(safe-area-inset-bottom)) var(--pad-left);
  text-align: center;
  /* Soft strawberry with a faint halftone dot texture */
  background: radial-gradient(var(--color-hero-dot) 1.5px, transparent 1.7px) 0 0 / 16px
      16px,
    var(--color-hero);
  color: var(--color-ink);
}

/* Everything in the hero sits on the center line */
.intro-content {
  grid-area: content;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(0.9rem, 2.4dvh, 1.6rem);
  min-width: 0;
  max-width: 100%;
  margin: 0 auto;
}

/* The dominant element of the page. Width-driven (each line is ~6.5em wide, so 13.4vw
   fills a phone), but capped by height so a short screen doesn't push the CTA offscreen.
   The strawberry offset shadow makes the letters read as a chunky printed block. */
.intro-headline {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1em;
  max-width: 100%;
  margin: 0;
  font-size: clamp(2.6rem, min(13.4vw, 15dvh), 11rem);
  line-height: 0.9;
  color: var(--color-ink);
  text-shadow: 0.045em 0.045em 0 var(--color-primary-soft);
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

/* The punchline: a cream sticker slapped on the poster. Smaller than the two
   setup lines so they stay the loudest thing on the page.
   Sized in em so the badge, outline and shadow all grow with the headline. */
.punch {
  display: inline-block;
  margin-top: 0.22em;
  padding: 0.1em 0.3em 0.12em;
  border: max(var(--outline-w-thick), 0.07em) solid var(--color-ink);
  border-radius: max(var(--radius), 0.3em);
  background: var(--color-surface);
  box-shadow: max(5px, 0.11em) max(5px, 0.11em) 0 var(--color-ink);
  font-size: 0.52em;
  line-height: 1;
  text-shadow: none;
  transform: rotate(-3deg);
}

.intro-subline {
  margin: 0 auto;
  max-width: 26ch;
  font-size: clamp(1.05rem, 0.95rem + 0.6vw, 1.4rem);
  font-weight: 700;
  line-height: 1.3;
}

/* The loudest button on the page: biggest, thickest outline, deepest shadow */
.intro-cta {
  min-height: clamp(64px, 52px + 2.2vw, 100px);
  padding: 0 clamp(1.9rem, 1.4rem + 2vw, 3.5rem);
  border-width: var(--outline-w-thick);
  font-size: clamp(1.75rem, 1.3rem + 1.7vw, 3.3rem);
  letter-spacing: 0.05em;
  box-shadow: 8px 8px 0 var(--color-ink);
  transform: rotate(-2deg);
}

.intro-cta:active:not(:disabled) {
  transform: rotate(-2deg) translate(6px, 6px) scale(0.97, 0.93);
  box-shadow: 2px 2px 0 var(--color-ink);
}

.cta-dice {
  display: inline-block;
  font-size: 0.85em;
}

.intro-cta:not(:disabled):hover .cta-dice,
.cta-dice.is-rolling {
  animation: roll 0.6s var(--ease-pop);
}

.cta-dice.is-rolling {
  animation-iteration-count: infinite;
}

/* In the flow (its own grid row) so it can never overlap the CTA */
.scroll-hint {
  grid-area: hint;
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

/* ---------- Decorative stickers ----------
   Each one names its zone (grid-area) and sets:
     --x    horizontal center, as a share of the zone's width (0% / 100% bleed off the edges)
     --y    vertical center, as a share of the zone's height
     --s    its size. On phones and tablets: a share of the zone's height, capped by the
            screen width. On desktop: screen-width units only, so it can also be kept
            inside its column sideways (see the desktop block).
     --rot  tilt
   `top` is clamped so the sticker always stays inside its zone vertically.
   Pop-in (scale), tilt (rotate) and centering (translate) are on the outer .deco;
   the idle float (translate) is on the inner .deco-body, so nothing fights. */
.deco {
  --x: 50%;
  --y: 50%;
  --h: 80;
  --w: 30;
  --max: 220px;
  --s: min(calc(var(--h) * 1%), calc(var(--w) * 1vw), var(--max));
  --rot: 0deg;
  position: absolute;
  z-index: 0;
  left: var(--x);
  translate: -50% 0;
  rotate: var(--rot);
  pointer-events: none;
  user-select: none;
  animation: sticker-in 0.35s var(--ease-pop) both;
  animation-delay: calc(1.5s + var(--i, 0) * 70ms);
}

.deco-body {
  display: block;
  width: 100%;
  height: 100%;
}

/* Illustrations: square, with a hard ink shadow that follows the drawing's outline */
.deco--art {
  top: clamp(0px, calc(var(--y) - var(--s) / 2), calc(100% - var(--s)));
  height: var(--s);
  aspect-ratio: 1;
}

.deco--art .deco-body {
  animation: bob 3.6s ease-in-out infinite;
  animation-delay: calc(var(--i, 0) * -0.45s);
}

.deco--art img {
  display: block;
  width: 100%;
  height: 100%;
  filter: drop-shadow(4px 4px 0 var(--color-ink));
}

/* Art on a color block: the drawing pokes out past the block's edges, like a sticker
   stuck on a square of paper */
.deco--on-block .deco-body {
  padding: 4%;
  border: var(--outline);
  border-radius: 24%;
  box-shadow: var(--shadow);
}

.deco--on-block img {
  width: 116%;
  height: 116%;
  margin: -8%;
  filter: none;
}

/* Small tilted Taglish labels. `top` assumes about two lines of label height so it
   stays inside its zone too. */
.deco--label {
  --lh: calc(1.8em + 6px);
  top: clamp(0px, calc(var(--y) - var(--lh) / 2), calc(100% - var(--lh)));
  max-width: 100%;
  font-family: var(--font-display);
  font-size: clamp(0.85rem, 0.75rem + 0.5vw, 1.2rem);
  line-height: 1;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--color-ink);
  animation: sticker-in 0.35s var(--ease-pop) both, wiggle 4.5s ease-in-out infinite;
  animation-delay: calc(1.5s + var(--i, 0) * 70ms), calc(2s + var(--i, 0) * 0.3s);
}

.deco--label .deco-body {
  padding: 0.4em 0.75em 0.38em;
  border: var(--outline);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
}

/* Block colors (ink text on all of them passes AA; see the tokens) */
.block--mint {
  background: var(--color-mint);
}
.block--glacier {
  background: var(--color-glacier);
}
.block--coral {
  background: var(--color-coral);
}
.block--accent {
  background: var(--color-accent);
}

/* Phones and tablets: two big stickers in each zone, bleeding off the side edges, with
   the labels in the middle (two up top, one below). Sushi, sisig, samgyupsal and barbecue
   only appear on desktop (lazy, so phones and tablets never download them). */
.deco--taco {
  grid-area: top;
  --x: 1%;
  --y: 50%;
  --h: 100;
  --w: 36;
  --rot: -12deg;
}
.deco--iced-coffee {
  grid-area: top;
  --x: 98%;
  --y: 50%;
  --h: 100;
  --w: 34;
  --rot: 10deg;
}
.deco--club {
  grid-area: top;
  --x: 50%;
  --y: 22%;
  --rot: -5deg;
}
/* Two lines on phones: the question, then the punchline */
.deco--umay {
  grid-area: top;
  --x: 50%;
  --y: 72%;
  --rot: 3deg;
  --lh: calc(2.8em + 6px);
  white-space: pre-line;
  text-align: center;
}

.deco--bibimbap {
  grid-area: bottom;
  --x: 10%;
  --y: 50%;
  --h: 92;
  --w: 34;
  --rot: -7deg;
}
.deco--pho {
  grid-area: bottom;
  --x: 90%;
  --y: 50%;
  --h: 100;
  --w: 38;
  --rot: 8deg;
}
.deco--kainan {
  grid-area: bottom;
  --x: 50%;
  --y: 50%;
  --rot: 4deg;
}

.deco--sushi,
.deco--sisig,
.deco--samgyupsal,
.deco--barbecue,
.deco--arte {
  display: none;
}

/* Short phones and landscape tablets: the labels go, so the stickers have the zones to
   themselves and the hero fits the screen (desktop labels sit in the side columns, so they stay) */
@media (max-width: 1023.98px) and (max-height: 620px) {
  .intro {
    --zone-min: 3.75rem;
  }

  .deco--label {
    display: none !important;
  }
}

/* Tablets: taller zones, same two-per-zone layout with bigger art. The middle is wide
   enough for the umay label on one line. */
@media (min-width: 640px) {
  .intro {
    --zone-min: clamp(5rem, 15dvh, 10rem);
  }
  .deco--art:not(.deco--on-block) img {
    filter: drop-shadow(5px 5px 0 var(--color-ink));
  }

  .deco--taco {
    --x: 9%;
    --w: 28;
  }
  .deco--iced-coffee {
    --x: 91%;
    --w: 27;
  }
  .deco--club {
    --y: 26%;
  }
  .deco--umay {
    --y: 74%;
    --lh: calc(1.8em + 6px);
    white-space: nowrap;
  }

  .deco--bibimbap {
    --x: 10%;
    --w: 26;
  }
  .deco--pho {
    --x: 90%;
    --w: 28;
  }
}

/* Landscape phones: too short for everything, so the top sticker row and the subline go
   and "Bahala na!" lands on the first screen. The bottom stickers stay.
   Must come after the tablet block, which switches samgyupsal back on. */
@media (max-width: 1023.98px) and (max-height: 500px) and (orientation: landscape) {
  .intro {
    --zone-min: 2.75rem;
    grid-template-rows: 0 auto minmax(var(--zone-min), 1fr) auto;
    row-gap: 0.5rem;
    padding-top: 0.75rem;
  }

  .intro-headline {
    font-size: clamp(2.4rem, 13dvh, 4rem);
  }

  .intro-content {
    gap: 0.75rem;
  }

  .intro-subline,
  .deco--taco,
  .deco--samgyupsal,
  .deco--sushi,
  .deco--iced-coffee {
    display: none;
  }
}

/* Desktop: a sticker column either side of the headline group, four illustrations
   each, zig-zagging down. Sizes switch to screen-width units so `left` can be clamped
   to keep each sticker inside its column; labels wrap to the column's width. */
@media (min-width: 1024px) {
  .intro {
    --zone-min: clamp(2rem, 6dvh, 4rem);
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    grid-template-areas:
      "left top right"
      "left content right"
      "left bottom right"
      "hint hint hint";
  }

  /* Leaves each side column at least ~16vw for the stickers */
  .intro-headline {
    font-size: clamp(4rem, min(10.8vw, 15dvh), 11rem);
  }

  /* Smaller next to the bigger headline, so the badge never outweighs "Bahala na!" */
  .punch {
    font-size: 0.4em;
  }

  .deco--art {
    --s: min(calc(var(--w) * 1vw), calc(var(--h) * 1dvh), var(--max));
    left: clamp(calc(var(--s) / 2), var(--x), calc(100% - var(--s) / 2));
  }

  /* One line when the column has room, wrapping only when it doesn't. (Without
     max-content, an absolute box at left: 50% only gets half the column to fit in.) */
  .deco--label {
    width: max-content;
    white-space: normal;
  }

  .deco--sushi,
  .deco--sisig,
  .deco--samgyupsal,
  .deco--barbecue,
  .deco--arte {
    display: block;
  }

  .deco--taco {
    grid-area: left;
    --x: 38%;
    --y: 11%;
    --w: 11;
    --h: 20;
    --rot: -12deg;
  }
  .deco--samgyupsal {
    grid-area: left;
    --x: 62%;
    --y: 37%;
    --w: 10;
    --h: 18;
    --rot: -5deg;
  }
  .deco--sisig {
    grid-area: left;
    --x: 36%;
    --y: 63%;
    --w: 11;
    --h: 20;
    --rot: 6deg;
  }
  .deco--bibimbap {
    grid-area: left;
    --x: 60%;
    --y: 89%;
    --w: 10;
    --h: 18;
    --rot: -7deg;
  }
  .deco--sushi {
    grid-area: right;
    --x: 40%;
    --y: 11%;
    --w: 10;
    --h: 18;
    --rot: 7deg;
  }
  .deco--iced-coffee {
    grid-area: right;
    --x: 64%;
    --y: 37%;
    --w: 11;
    --h: 21;
    --rot: 10deg;
  }
  .deco--pho {
    grid-area: right;
    --x: 38%;
    --y: 63%;
    --w: 11;
    --h: 20;
    --rot: -6deg;
  }
  .deco--barbecue {
    grid-area: right;
    --x: 62%;
    --y: 89%;
    --w: 11;
    --h: 20;
    --rot: 9deg;
  }

  .deco--club {
    grid-area: top;
    --x: 50%;
    --y: 50%;
    --rot: -3deg;
  }
  .deco--kainan {
    grid-area: right;
    --x: 50%;
    --y: 24%;
    --rot: 5deg;
  }
  .deco--arte {
    grid-area: left;
    --x: 50%;
    --y: 76%;
    --rot: -6deg;
  }
  /* Mirrors "Kahit saan club" in the zone under the headline group */
  .deco--umay {
    grid-area: bottom;
    --x: 50%;
    --y: 50%;
    --rot: 3deg;
  }

  .deco--art:not(.deco--on-block) img {
    filter: drop-shadow(6px 6px 0 var(--color-ink));
  }
  .deco--on-block .deco-body {
    box-shadow: var(--shadow-lg);
  }
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

/* After "Bahala na!" with no location yet: a calm info label saying a pick comes next.
   Collapses to nothing when there's no message (the live region stays in the DOM). */
.pick-note {
  margin: 0;
}

.pick-note-text {
  display: inline-block;
  margin-top: 0.85rem;
  padding: 0.35rem 0.8rem;
  border: var(--outline);
  border-radius: var(--radius-sm);
  background: var(--color-info-bg);
  box-shadow: var(--shadow-sm);
  font-weight: 800;
  line-height: 1.3;
  rotate: -1.5deg;
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
  content: "";
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

.step:nth-child(odd) {
  rotate: -0.6deg;
}
.step:nth-child(even) {
  rotate: 0.6deg;
}

/* Dashed connector down to the next row, lined up under the sticker, with a small
   arrowhead at its end */
.step:not(:last-child)::before,
.step:not(:last-child)::after {
  content: "";
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
    content: "→";
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

/* Idle float on the inner .deco-body (its outer .deco owns translate for centering) */
@keyframes bob {
  0%,
  100% {
    translate: 0 0;
  }
  50% {
    translate: 0 -8px;
  }
}

/* Labels rock gently around their own tilt */
@keyframes wiggle {
  0%,
  100% {
    rotate: var(--rot);
  }
  50% {
    rotate: calc(var(--rot) + 3deg);
  }
}

@keyframes roll {
  0% {
    transform: rotate(0) scale(1);
  }
  50% {
    transform: rotate(200deg) scale(1.2);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}

@keyframes nudge {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(6px);
  }
}

/* No motion at all for users who ask for it (on top of the global rule) */
@media (prefers-reduced-motion: reduce) {
  .scroll-arrow,
  .deco,
  .deco-body,
  .cta-dice {
    animation: none !important;
  }

  .location-step.reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
