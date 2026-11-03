import { defineStore } from 'pinia'
import { geocodeArea } from '@/services/api'

// Map fallback before we know where the user is
export const METRO_MANILA = { lat: 14.5547, lon: 121.0244 }

const STORAGE_KEY = 'eme:location'
const RECENT_KEY = 'eme:recent-areas'
const MAX_RECENT = 3

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
      area: saved.area ?? '', // typed city/area when location is denied
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
            this.area = ''
            this.status = 'ready'
            this.persist()
            resolve(true)
          },
          (err) => {
            this.status = err.code === err.PERMISSION_DENIED ? 'denied' : 'error'
            this.error =
              err.code === err.PERMISSION_DENIED
                ? 'Location access was denied. Type a city or area instead.'
                : 'Could not get your location. Type a city or area instead.'
            resolve(false)
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
        )
      })
    },

    // Looks up the typed area server-side (Geoapify). Resolves true once coords are set.
    async setManualArea(area) {
      const text = area.trim()
      this.status = 'geocoding'
      this.error = null
      try {
        const { lat, lon } = await geocodeArea(text)
        this.coords = { lat, lon }
        this.area = text
        this.status = 'ready'
        this.persist()
        this.addRecentArea(text)
        return true
      } catch (err) {
        this.status = 'error'
        this.error = err.message
        return false
      }
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
