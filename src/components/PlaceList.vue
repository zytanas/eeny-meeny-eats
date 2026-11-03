<script setup>
import PlaceCard from './PlaceCard.vue'

defineProps({
  places: { type: Array, required: true },
})
</script>

<template>
  <div class="place-list-wrap">
    <!-- Cards fade/shift as filters and sorting change -->
    <TransitionGroup v-if="places.length" tag="ul" name="list" class="place-list">
      <li v-for="place in places" :key="place.id">
        <PlaceCard :place="place" link />
      </li>
    </TransitionGroup>
    <p v-else class="empty">
      <span class="empty-emoji" aria-hidden="true">🤷</span>
      No places match your filters. Try widening them.
    </p>
  </div>
</template>

<style scoped>
.place-list {
  position: relative; /* anchors leaving items (see .list-leave-active) */
  display: grid;
  gap: 1.1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Two columns on tablets */
@media (min-width: 640px) {
  .place-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* Desktop: back to one column, since the list sits in a narrow column beside the map */
@media (min-width: 1024px) {
  .place-list {
    grid-template-columns: minmax(0, 1fr);
  }
}

.empty {
  display: grid;
  justify-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  border: var(--outline);
  border-radius: var(--radius);
  background: var(--paper);
  box-shadow: var(--shadow);
  text-align: center;
  font-weight: 700;
}

.empty-emoji {
  font-size: 2.5rem;
}
</style>
