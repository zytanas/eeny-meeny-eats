<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { formatDistance, formatPrice } from '@/utils/format'
import { cuisineArt } from '@/utils/cuisine'
import CuisineArt from './CuisineArt.vue'

const props = defineProps({
  place: { type: Object, required: true },
  // When true, the card shows a button linking to the place detail page
  link: { type: Boolean, default: false },
  ctaLabel: { type: String, default: 'Check it out' },
})

const router = useRouter()
const art = computed(() => cuisineArt(props.place.cuisine))
const detailRoute = computed(() => ({ name: 'place', params: { id: props.place.id } }))

// Tapping anywhere on the card opens it too. The button stays the real (keyboard) link.
function onCardClick(event) {
  if (!props.link || event.target.closest('a, button')) return
  router.push(detailRoute.value)
}
</script>

<template>
  <article class="place-card" :class="{ 'is-link': link }" @click="onCardClick">
    <div class="art">
      <CuisineArt :kind="art.kind" class="art-image" />
      <span class="tag">{{ place.cuisine }}</span>
      <span v-if="place.openNow != null" class="status" :class="place.openNow ? 'open' : 'closed'">
        {{ place.openNow ? 'Open' : 'Closed' }}
      </span>
    </div>

    <div class="body">
      <h3 class="name">{{ place.name }}</h3>
      <p class="stats">
        <template v-if="place.rating != null">
          <span class="rating" :aria-label="`Rated ${place.rating.toFixed(1)} from ${place.ratingCount} Google reviews`">
            <span class="star" aria-hidden="true">★</span>{{ place.rating.toFixed(1) }}
            <span class="count" aria-hidden="true">({{ place.ratingCount.toLocaleString() }})</span>
          </span>
          <span class="dot" aria-hidden="true">•</span>
        </template>
        <span class="distance">{{ formatDistance(place.distanceKm) }}</span>
        <template v-if="place.priceLevel">
          <span class="dot" aria-hidden="true">•</span>
          <span class="price">{{ formatPrice(place.priceLevel) }}</span>
        </template>
      </p>

      <RouterLink v-if="link" :to="detailRoute" class="btn btn-primary btn-display btn-block cta">
        {{ ctaLabel }}<span class="visually-hidden">: {{ place.name }}</span>
      </RouterLink>
    </div>
  </article>
</template>

<style scoped>
.place-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-card);
  border: var(--outline);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  transition:
    transform var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out);
}

.place-card.is-link {
  cursor: pointer;
}

/* Lift on hover (pointer devices only) */
@media (hover: hover) {
  .place-card.is-link:hover {
    transform: translate(-2px, -2px);
    box-shadow: var(--shadow-lg);
  }
}

/* ---------- Illustration area ---------- */
.art {
  position: relative;
  display: grid;
  place-items: center;
  height: clamp(112px, 90px + 6vw, 144px);
  padding: clamp(0.75rem, 0.6rem + 0.6vw, 1rem);
  border-bottom: var(--outline);
  background-color: var(--color-accent);
  background-image: radial-gradient(color-mix(in srgb, var(--color-ink) 10%, transparent) 1.5px, transparent 1.7px);
  background-size: 14px 14px;
}


.art-image {
  width: auto;
  height: 100%;
  max-width: 120px;
  transform: rotate(-4deg);
  transition: transform var(--dur-pop) var(--ease-pop);
}

@media (hover: hover) {
  .place-card.is-link:hover .art-image {
    transform: rotate(4deg) scale(1.08);
  }
}

.tag,
.status {
  position: absolute;
  top: 0.6rem;
  padding: 0.1rem 0.6rem;
  border: 2px solid var(--color-ink);
  border-radius: var(--radius-pill);
  background: var(--color-card);
  color: var(--color-ink);
  font-size: 0.8rem;
  font-weight: 800;
}

.tag {
  left: 0.6rem;
  box-shadow: 2px 2px 0 var(--color-ink);
  transform: rotate(-3deg);
}

.status {
  right: 0.6rem;
}

.status.open {
  color: var(--color-success);
}

.status.open::before {
  content: '● ';
}

.status.closed {
  color: var(--color-muted);
}

/* ---------- Text ---------- */
.body {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.85rem var(--gutter) var(--gutter);
}

.name {
  margin: 0;
  font-size: clamp(1.3rem, 1.15rem + 0.6vw, 1.55rem);
  line-height: 1.1;
  overflow-wrap: anywhere; /* long single-word names can't widen the card */
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

.star {
  margin-right: 0.15em;
  color: var(--color-rating);
  -webkit-text-stroke: 1.2px var(--color-ink);
}

.count {
  font-weight: 500;
  color: var(--color-muted);
}

.dot {
  color: var(--color-primary-strong);
}

.cta {
  min-height: 50px;
  font-size: clamp(1.05rem, 1rem + 0.3vw, 1.2rem);
}

/* Cards in the same grid row match heights, with their buttons lined up at the bottom */
.place-card.is-link {
  height: 100%;
}

.body {
  flex: 1;
}

.stats {
  flex: 1;
  align-content: flex-start;
  margin-bottom: 0.5rem;
}
</style>
