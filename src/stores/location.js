import { defineStore } from 'pinia'
import { geocodeArea, reverseGeocode } from '@/services/api'

// Map fallback before we know where the user is
export const METRO_MANILA = { lat: 14.5547, lon: 121.0244 }

const STORAGE_KEY = 'eme:location'
const RECENT_KEY = 'eme:recent-areas'
const MAX_RECENT = 3

// Bumped on every location change, so a slow place-name lookup for an older position
// can't overwrite a newer location's name
let locationVersion = 0

// Restore the last location so a page refresh doesn't bounce the user home
function loadSaved() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

// Last few typed areas, newest first. Kept across visits (localStorage), unlike the location itself.
function loadRecent() {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY))
    return Array.isArray(list) ? list.filter((a) => typeof a === 'string').slice(0, MAX_RECENT) : []
  } catch {
    return []
  }
}

export const useLocationStore = defineStore('location', {
  state: () => {
    const saved = loadSaved()
    return {
      coords: saved.coords ?? null, // { lat, lon }
      // The place the search actually found ("Japan, Dagupan, Pangasinan"), or for GPS, the
      // street and barangay it's on ("Tomas Morato Avenue, Sacred Heart, Quezon City")
      area: saved.area ?? '',
      alternatives: [], // other good matches for the last search, for "Not the right spot?"
      status: saved.coords ? 'ready' : 'idle', // idle | locating | geocoding | ready | denied | error
      error: null,
      recentAreas: loadRecent(),
    }
  },

  getters: {
    hasLocation: (state) => state.coords != null,
    center: (state) => state.coords ?? METRO_MANILA,
    label: (state) => state.area || (state.coords ? 'Your location' : 'Metro Manila'),
  },

  actions: {
    requestBrowserLocation() {
      if (!('geolocation' in navigator)) {
        this.status = 'denied'
        this.error = 'Location is not supported on this device.'
        return Promise.resolve(false)
      }

      this.status = 'locating'
      this.error = null

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            this.coords = { lat: pos.coords.latitude, lon: pos.coords.longitude }
            this.area = '' // "Your location" until nameGpsSpot() finds the street
            this.alternatives = []
            this.status = 'ready'
            this.persist()
            this.nameGpsSpot()
            resolve(true)
          },
          (err) => {
            this.status = err.code === err.PERMISSION_DENIED ? 'denied' : 'error'
            this.error =
              err.code === err.PERMISSION_DENIED
                ? 'Location access was denied. Type a street or landmark instead.'
                : 'Could not get your location. Type a street or landmark instead.'
            resolve(false)
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
        )
      })
    },

    // Swaps "Your location" for the street, barangay and city the GPS fix is on. Runs in the
    // background (callers don't wait for it); on failure the label just stays "Your location".
    async nameGpsSpot() {
      const version = ++locationVersion
      try {
        const { shortLabel } = await reverseGeocode(this.coords)
        if (version !== locationVersion || !shortLabel) return
        this.area = shortLabel
        this.persist()
      } catch {
        // Keep "Your location"
      }
    },

    // Looks up the typed area server-side (Geoapify). Resolves true once coords are set.
    // Saves the place that was actually found, not what was typed, so the header shows the truth.
    async setManualArea(area) {
      const text = area.trim()
      this.status = 'geocoding'
      this.error = null
      try {
        // center is the current location, or METRO_MANILA before we have one
        const result = await geocodeArea(text, this.center)
        const found = result.shortLabel || text
        locationVersion++ // drop any GPS name lookup still in flight
        this.coords = { lat: result.lat, lon: result.lon }
        this.area = found
        this.alternatives = result.alternatives ?? []
        this.status = 'ready'
        this.persist()
        this.addRecentArea(found)
        return true
      } catch (err) {
        this.status = 'error'
        this.error = err.message
        return false
      }
    },

    // A quick pick with preset coordinates (AreaChips): no lookup, so it's instant and costs nothing.
    // Not added to recents: it's already one tap away, and a recent chip would geocode the label.
    setPresetArea({ lat, lon, label }) {
      locationVersion++ // drop any GPS name lookup still in flight
      this.coords = { lat, lon }
      this.area = label
      this.alternatives = []
      this.status = 'ready'
      this.error = null
      this.persist()
    },

    // The user tapped one of the "Not the right spot?" choices
    chooseAlternative(match) {
      locationVersion++ // drop any GPS name lookup still in flight
      this.coords = { lat: match.lat, lon: match.lon }
      this.area = match.shortLabel
      this.alternatives = []
      this.status = 'ready'
      this.persist()
      this.addRecentArea(match.shortLabel)
    },

    // Called when a location form opens, so an old error doesn't greet the user
    clearError() {
      this.error = null
      if (this.status === 'denied' || this.status === 'error') this.status = this.coords ? 'ready' : 'idle'
    },

    // Moves the area to the front, dropping a same-name duplicate (any letter case)
    addRecentArea(text) {
      const rest = this.recentAreas.filter((a) => a.toLowerCase() !== text.toLowerCase())
      this.recentAreas = [text, ...rest].slice(0, MAX_RECENT)
      this.persistRecent()
    },

    clearRecentAreas() {
      this.recentAreas = []
      this.persistRecent()
    },

    persistRecent() {
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(this.recentAreas))
      } catch {
        // Storage unavailable (private mode); recents just won't survive a reload
      }
    },

    persist() {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ coords: this.coords, area: this.area }))
      } catch {
        // Storage can be unavailable (private mode); location just won't survive a refresh
      }
    },
  },
})