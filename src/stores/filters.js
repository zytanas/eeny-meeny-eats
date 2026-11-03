import { defineStore } from 'pinia'

// km. The chosen distance is the server's starting radius; it widens the search (up to
// RADIUS_STEPS_KM in netlify/lib/config.js) when too few places are found
export const DISTANCE_OPTIONS = [1, 2, 3, 5]
export const DEFAULT_DISTANCE_KM = 2
export const PRICE_LEVELS = [1, 2, 3, 4] // rendered as $ to $$$$
export const SORT_OPTIONS = [
  { value: 'rating', label: 'Top rated' },
  { value: 'distance', label: 'Nearest' },
]

const defaults = () => ({
  cuisines: [], // empty = all cuisines
  maxDistanceKm: DEFAULT_DISTANCE_KM,
  priceLevels: [], // empty = any price
  openNow: false,
  sortBy: 'distance',
})

export const useFiltersStore = defineStore('filters', {
  state: defaults,

  getters: {
    activeCount: (state) =>
      (state.cuisines.length ? 1 : 0) +
      (state.maxDistanceKm !== DEFAULT_DISTANCE_KM ? 1 : 0) +
      (state.priceLevels.length ? 1 : 0) +
      (state.openNow ? 1 : 0),
  },

  actions: {
    toggleCuisine(cuisine) {
      this.cuisines = toggle(this.cuisines, cuisine)
    },
    togglePrice(level) {
      this.priceLevels = toggle(this.priceLevels, level)
    },
    reset() {
      // Keep the user's sort choice; only clear filters
      const { sortBy } = this
      this.$patch({ ...defaults(), sortBy })
    },
  },
})

function toggle(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}
