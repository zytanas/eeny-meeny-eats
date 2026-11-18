<script setup>
import { computed } from 'vue'
import { formatDistance, formatPrice } from '@/utils/format'
import CuisineBlock from './CuisineBlock.vue'

const props = defineProps({
  place: { type: Object, required: true },
  // List cards: the whole card links to the place page. Without it (the Pick screen) the
  // card is plain content.
  link: { type: Boolean, default: false },
})

const copy = {
  open: 'Open',
  closed: 'Closed',
}

const detailRoute = computed(() => ({ name: 'place', params: { id: props.place.id } }))
</script>

<template>
  <article class="place-card" :class="{ 'is-link': link }">
    <!-- The cuisine as a big sticker label; decorative, the tag below says the same -->
    <div class="art">
      <CuisineBlock :place="place" />
    </div>

    <div class="body">
      <!-- h2: cards sit directly under the page's h1 (Explore summary, Pick headline).
           In list cards the name is the one link, stretched over the whole card (.card-link::after). -->
      <h2 class="name">
        <RouterLink v-if="link" :to="detailRoute" class="card-link">
          <span class="name-text">{{ place.name }}</span>
        </RouterLink>
        <span v-else class="name-text">{{ place.name }}</span>
      </h2>

      <p class="badges">
        <span class="tag">{{ place.cuisine }}</span>
        <span v-if="place.openNow != null" class="status" :class="place.openNow ? 'open' : 'closed'">
          {{ place.openNow ? copy.open : copy.closed }}
        </span>
      </p>

      <p class="stats">
        <span class="distance">{{ formatDistance(place.distanceKm) }}</span>
        <template v-if="place.priceLevel">
          <span class="dot" aria-hidden="true">•</span>
          <span class="price">{{ formatPrice(place.priceLevel) }}</span>
        </template>
      </p>
    </div>

    <!-- Visual cue that the card opens; the link itself is the name -->
    <span v-if="link" class="go" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M5 12h13M12 5l7 7-7 7" />
      </svg>
    </span>
  </article>
</template>

<style scoped>
/* Layout (mobile-first). PlaceCardSkeleton mirrors these shapes, so change both together.
   - list cards on phones and in the desktop list column: compact row, square block on the left
   - everything else (tablet grid, Pick screen): vertical card, block on top, badges pinned over it */
.place-card {
  --art-size: 104px; /* compact block */
  --art-height: clamp(150px, 128px + 4vw, 176px); /* vertical block */
  --go-size: 44px;

  position: relative; /* anchors the stretched link and the arrow */
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-surface);
  border: var(--outline);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  transition:
    transform var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out);
}

/* Cards in the same grid row match heights */
.place-card.is-link {
  height: 100%;
}

/* Lift with a deeper shadow on hover (pointer devices) and on keyboard focus */
@media (hover: hover) {
  .place-card.is-link:hover {
    transform: translate(-3px, -3px);
    box-shadow: var(--shadow-lg);
  }
}

.place-card.is-link:has(.card-link:focus-visible) {
  transform: translate(-3px, -3px);
  box-shadow: var(--shadow-lg);
  outline: 3px solid var(--color-focus);
  outline-offset: 4px;
}

/* ---------- Cuisine block ---------- */
.art {
  /* The label keeps clear of the badges pinned over the top of the block */
  --label-inset: 2.6rem 9% 0.9rem;

  flex: none;
  height: var(--art-height);
  border-bottom: var(--outline);
}

/* The label flips its tilt and grows a little, like a sticker being pressed down */
@media (hover: hover) {
  .place-card.is-link:hover .art :deep(.label) {
    transform: rotate(calc(var(--tilt, -4deg) * -1)) scale(1.06);
  }
}

.place-card.is-link:has(.card-link:focus-visible) .art :deep(.label) {
  transform: rotate(calc(var(--tilt, -4deg) * -1)) scale(1.06);
}

/* ---------- Text ---------- */
.body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 0; /* lets the name clamp instead of widening the card */
  padding: 0.85rem var(--gutter) var(--gutter);
}

.name {
  margin: 0;
  font-size: clamp(1.3rem, 1.15rem + 0.6vw, 1.55rem);
  line-height: 1.1;
}

/* Long names: two lines, then an ellipsis */
.name-text {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  overflow-wrap: anywhere; /* long single words wrap instead of widening the card */
}

.card-link {
  color: inherit;
  font-weight: inherit;
  text-decoration: none;
}

/* Stretched link: covers the whole card, so a tap anywhere opens it */
.card-link::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  border-radius: inherit;
}

/* The card shows focus (above); the link's own ring would only circle the name */
.card-link:focus-visible {
  outline: none;
}

/* Cuisine tag and open status: pinned over the block on vertical cards */
.badges {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  left: 0.6rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.4rem;
  z-index: 1; /* above the block */
  margin: 0;
  pointer-events: none;
}

.tag,
.status {
  padding: 0.1rem 0.6rem;
  border: 2px solid var(--color-ink);
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  color: var(--color-ink);
  font-size: 0.8rem;
  font-weight: 800;
  line-height: 1.4;
  white-space: nowrap;
}

.tag {
  overflow: hidden;
  min-width: 0;
  text-overflow: ellipsis;
  box-shadow: 2px 2px 0 var(--color-ink);
  transform: rotate(-3deg);
}

.status {
  flex: none;
}

/* Its own green pill, so "open now" never depends on what it sits on */
.status.open {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.status.open::before {
  content: '● ';
}

.status.closed {
  color: var(--color-closed);
}

.stats {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.2rem 0.5rem;
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 700;
}

/* Room for the arrow on the bottom line */
.is-link .stats {
  padding-right: calc(var(--go-size) + 0.25rem);
}

.dot {
  color: var(--color-primary);
}

/* ---------- Arrow sticker ---------- */
.go {
  position: absolute;
  right: 0.75rem;
  bottom: 0.75rem;
  display: grid;
  place-items: center;
  width: var(--go-size);
  height: var(--go-size);
  border-radius: 50%;
  background: var(--color-ink);
  color: var(--color-bg);
  box-shadow: 2px 2px 0 color-mix(in srgb, var(--color-ink) 35%, transparent);
  transform: rotate(-8deg);
  transition: transform var(--dur-pop) var(--ease-pop);
}

.go svg {
  width: 55%;
  height: 55%;
  fill: none;
  stroke: currentColor;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

@media (hover: hover) {
  .place-card.is-link:hover .go {
    transform: rotate(0deg) translateX(3px);
  }
}

.place-card.is-link:has(.card-link:focus-visible) .go {
  transform: rotate(0deg) translateX(3px);
}

/* ---------- Compact rows: list cards on phones and in the desktop list column ---------- */
@media (max-width: 639.98px), (min-width: 1024px) {
  .place-card.is-link {
    --go-size: 34px;

    flex-direction: row;
    min-height: var(--art-size);
  }

  .is-link .art {
    --label-inset: 12px;

    align-self: stretch;
    width: var(--art-size);
    height: auto;
    min-height: var(--art-size);
    border-bottom: 0;
    border-right: var(--outline);
  }

  .is-link .body {
    justify-content: center;
    gap: 0.3rem;
    padding: 0.7rem 0.85rem;
  }

  .is-link .name {
    font-size: clamp(1.15rem, 1.05rem + 0.5vw, 1.3rem);
  }

  /* Badges flow under the name instead of floating over the block */
  .is-link .badges {
    position: static;
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .is-link .tag {
    transform: none;
    max-width: 100%;
  }

  .is-link .go {
    right: 0.6rem;
    bottom: 0.6rem;
  }
}

/* The desktop list column has room for a bigger block */
@media (min-width: 1024px) {
  .place-card.is-link {
    --art-size: 124px;
  }
}
</style>
