<script setup>
import { computed, onMounted } from 'vue'
import { usePlacesStore } from '@/stores/places'
import { useLocationStore } from '@/stores/location'
import { formatDistance, formatPrice, directionsUrl } from '@/utils/format'
import ReportForm from '@/components/ReportForm.vue'
import CuisineBlock from '@/components/CuisineBlock.vue'

const props = defineProps({
  id: { type: String, required: true },
})

const places = usePlacesStore()
const location = useLocationStore() // start point for directions
const place = computed(() => places.getById(props.id))

// Direct visits / refreshes start with an empty store
onMounted(() => places.loadNearby())
</script>

<template>
  <section class="container">
    <RouterLink :to="{ name: 'explore' }" class="back">← Back to explore</RouterLink>

    <Transition name="fade" mode="out-in">
      <p v-if="places.loading" key="loading" class="muted">Loading…</p>

      <article v-else-if="place" :key="place.id" class="detail">
        <!-- Same block as the place's card, bigger; decorative, the tag says the same -->
        <div class="banner">
          <CuisineBlock :place="place" />
        </div>
        <div class="detail-body">
          <span class="tag">{{ place.cuisine }}</span>
          <h1>{{ place.name }}</h1>

          <dl>
            <div class="stat">
              <dt>Distance</dt>
              <dd>{{ formatDistance(place.distanceKm) }}</dd>
            </div>
            <div v-if="place.priceLevel" class="stat">
              <dt>Price</dt>
              <dd>{{ formatPrice(place.priceLevel) }}</dd>
            </div>
            <div class="stat">
              <dt>Status</dt>
              <dd v-if="place.openNow == null" class="unknown">Hours not listed</dd>
              <dd v-else :class="place.openNow ? 'open' : 'closed'">
                {{ place.openNow ? 'Open now' : 'Closed' }}
              </dd>
            </div>
            <div v-if="place.openingHours" class="stat stat--wide">
              <dt>Opening hours</dt>
              <dd class="address">{{ place.openingHours }}</dd>
            </div>
            <div class="stat stat--wide">
              <dt>Address</dt>
              <dd class="address">{{ place.address }}</dd>
            </div>
          </dl>

          <a v-if="place.website" class="website" :href="place.website" target="_blank" rel="noopener">
            Visit website ↗
          </a>

          <a
            class="btn btn-primary btn-display btn-block directions"
            :href="directionsUrl(place, location.center)"
            target="_blank"
            rel="noopener"
          >
            Get directions →
          </a>
          <ReportForm :place-id="place.id" />
        </div>
      </article>

      <p v-else key="missing" class="muted">We couldn't find that place. It may be outside your current area.</p>
    </Transition>
  </section>
</template>

<style scoped>
.back {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-bottom: 0.5rem;
  text-decoration: none;
}

.detail {
  overflow: hidden; /* the banner follows the rounded corners */
  background: var(--color-surface);
  border: var(--outline);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

/* The cuisine block across the top of the card */
.banner {
  --label-inset: 15% 10%;
  --label-max: 9rem;

  height: clamp(170px, 120px + 14vw, 300px);
  border-bottom: var(--outline);
}

.detail-body {
  padding: clamp(1.1rem, 0.8rem + 1.5vw, 2rem);
}

.tag {
  display: inline-block;
  margin-bottom: 0.6rem;
  padding: 0.1rem 0.7rem;
  border: 2px solid var(--color-ink);
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  font-weight: 800;
  font-size: 0.875rem;
}

h1 {
  font-size: clamp(2.1rem, 1.5rem + 3vw, 3.4rem);
  overflow-wrap: anywhere; /* long single-word names can't push the page sideways */
}

/* Stats as a grid of mini stickers: 2 across on phones, 3 from tablet up */
dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
  margin: 1.25rem 0 1.5rem;
}

@media (min-width: 640px) {
  dl {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.stat {
  padding: 0.6rem 0.75rem;
  border: 2px solid var(--color-ink);
  border-radius: 12px;
  background: var(--color-surface);
}

.stat--wide {
  grid-column: 1 / -1;
}

dt {
  font-family: var(--font-display);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

dd {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.address {
  font-size: 1rem;
  font-weight: 500;
  overflow-wrap: anywhere;
}


/* Success text sits on the cream stat (5.1:1), never on pink */
.open {
  color: var(--color-success);
}

/* Closed is a state, not an error */
.closed {
  color: var(--color-closed);
}

.unknown {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-muted);
}

.website {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin: -0.75rem 0 1rem;
}

.directions {
  min-height: clamp(54px, 50px + 1vw, 62px);
  font-size: clamp(1.2rem, 1.1rem + 0.5vw, 1.45rem);
}
</style>
