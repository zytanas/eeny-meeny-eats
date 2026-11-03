import { defineStore } from 'pinia'
import { fetchNearby } from '@/services/api'
import { useLocationStore } from './location'
import { useFiltersStore } from './filters'

export const usePlacesStore = defineStore('places', {
  state: () => ({
    places: [], // raw places from /api/nearby
    loadedFor: null, // key of the location the places were loaded for
    loading: false,
    error: null,
    lastPickId: null,
    revealPending: false, // true right after pickRandom(), so RandomPickView plays the reel once
  }),

  getters: {
    // Places with a computed distance (km) from the user's location
    placesWithDistance(state) {
      const { center } = useLocationStore()
      return state.places.map((p) => ({
        ...p,
        distanceKm: haversineKm(center, p),
      }))
    },

    // Cuisines present in the current results, for the filter chips
    availableCuisines(state) {
      return [...new Set(state.places.map((p) => p.cuisine))].sort()
    },

    // Rating and price aren't in the current data source, so their UI hides when missing
    hasRatings: (state) => state.places.some((p) => p.rating != null),
    hasPrices: (state) => state.places.some((p) => p.priceLevel != null),

    // Single source of truth for both the list/map and the randomizer
    filteredPlaces() {
      const f = useFiltersStore()
      const result = this.placesWithDistance.filter(
        (p) =>
          (!f.cuisines.length || f.cuisines.includes(p.cuisine)) &&
          p.distanceKm <= f.maxDistanceKm &&
          (!f.priceLevels.length || f.priceLevels.includes(p.priceLevel)) &&
          (!f.openNow || p.openNow),
      )

      // Unrated places sort after rated ones, then by distance
      return result.sort((a, b) =>
        f.sortBy === 'rating'
          ? (b.rating ?? -1) - (a.rating ?? -1) || (b.ratingCount ?? 0) - (a.ratingCount ?? 0) || a.distanceKm - b.distanceKm
          : a.distanceKm - b.distanceKm,
      )
    },

    getById() {
      return (id) => this.placesWithDistance.find((p) => p.id === id)
    },
  },

  actions: {
    async loadNearby({ force = false } = {}) {
      const location = useLocationStore()
      const key = `${location.center.lat},${location.center.lon}`
      if (!force && this.loadedFor === key && this.places.length) return

      this.loading = true
      this.error = null
      try {
        const data = await fetchNearby(location.center)
        this.places = data.places ?? []
        this.loadedFor = key
      } catch (err) {
        this.error = err.message
      } finally {
        this.loading = false
      }
    },

    // Picks a random place from filteredPlaces, avoiding an immediate repeat
    pickRandom() {
      let pool = this.filteredPlaces
      if (pool.length > 1 && this.lastPickId) {
        pool = pool.filter((p) => p.id !== this.lastPickId)
      }
      if (!pool.length) return null

      const pick = pool[Math.floor(Math.random() * pool.length)]
      this.lastPickId = pick.id
      this.revealPending = true
      return pick
    },

    // Returns whether a fresh pick is waiting to be revealed, and clears the flag.
    // Refreshes and back-navigation land on the pick without replaying the reel.
    consumeReveal() {
      const pending = this.revealPending
      this.revealPending = false
      return pending
    },
  },
})

// Great-circle distance between two { lat, lon } points, in km
function haversineKm(a, b) {
  const R = 6371
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
