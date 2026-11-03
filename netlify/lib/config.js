// Server-side settings shared by the Netlify Functions. Edit here, not in each function.
// (This folder is outside netlify/functions, so Netlify doesn't deploy these files as endpoints.)

// ISO country code that typed-area searches are limited to. Set to null to search worldwide.
export const COUNTRY_FILTER = 'ph'

// Nearby search: start at the radius the user picked (DEFAULT_RADIUS_KM matches DEFAULT_DISTANCE_KM
// in src/stores/filters.js). If that finds fewer than MIN_RESULTS places, widen to each of
// RADIUS_STEPS_KM in turn and stop at the first that does.
export const DEFAULT_RADIUS_KM = 2
export const RADIUS_STEPS_KM = [5, 10]
export const MIN_RESULTS = 15
// Nearest first, per search. Geoapify bills per 20 results, so this is also the cost of an uncached search.
export const RESULT_LIMIT = 200
export const PLACE_CATEGORIES = [
  'catering.restaurant',
  'catering.cafe',
  'catering.fast_food',
  'catering.food_court',
  'catering.ice_cream',
  'commercial.food_and_drink.bakery',
]

// Big chains are hidden so local spots stand out. Matched case-insensitively, as whole words,
// against a place's name and brand ("Jollibee Vigan" matches "Jollibee"; punctuation is ignored).
// Set HIDE_CHAINS to false to show chains by default; a request can also ask for them with ?chains=include.
export const HIDE_CHAINS = true
export const CHAIN_BLOCKLIST = [
  'Jollibee',
  "McDonald's",
  'KFC',
  'Chowking',
  'Mang Inasal',
  'Greenwich',
  'Burger King',
  "Wendy's",
  "Shakey's",
  'Pizza Hut',
  "Domino's",
  'Yellow Cab',
  'Starbucks',
  "Dunkin'",
  '7-Eleven',
  'Ministop',
  'FamilyMart',
  'Lawson',
]

// Places with the same name within this many meters of each other count as one
export const DUPLICATE_DISTANCE_M = 50

// How long cached nearby results stay fresh in Supabase `places_cache`
export const CACHE_TTL_HOURS = 24

// Cache cell size: coordinates are rounded to this many decimals (3 ≈ 110 m), so
// everyone within the same cell shares one cached result
export const CACHE_COORD_DECIMALS = 3

// Used for "open now" when the browser doesn't send its timezone
export const DEFAULT_TIMEZONE = 'Asia/Manila'
