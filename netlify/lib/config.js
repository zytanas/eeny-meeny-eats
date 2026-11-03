// Server-side settings shared by the Netlify Functions. Edit here, not in each function.
// (This folder is outside netlify/functions, so Netlify doesn't deploy these files as endpoints.)

// ISO country code that typed-area searches are limited to. Set to null to search worldwide.
export const COUNTRY_FILTER = 'ph'

// Nearby search: places are fetched once per location out to the largest distance filter,
// nearest first, then narrowed in the browser (keep in sync with DISTANCE_OPTIONS in src/stores/filters.js)
export const SEARCH_RADIUS_M = 5000
export const RESULT_LIMIT = 50
export const PLACE_CATEGORIES = ['catering.restaurant', 'catering.cafe']

// How long cached nearby results stay fresh in Supabase `places_cache`
export const CACHE_TTL_HOURS = 24

// Cache cell size: coordinates are rounded to this many decimals (3 ≈ 110 m), so
// everyone within the same cell shares one cached result
export const CACHE_COORD_DECIMALS = 3

// Used for "open now" when the browser doesn't send its timezone
export const DEFAULT_TIMEZONE = 'Asia/Manila'
