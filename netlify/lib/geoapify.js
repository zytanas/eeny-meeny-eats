// Thin wrappers around the Geoapify APIs. The API key never leaves the server.
import { COUNTRY_FILTER, DUPLICATE_DISTANCE_M, PLACE_CATEGORIES, RESULT_LIMIT } from './config.js'
import { isChainBusinessName } from './chains.js'

const BASE = 'https://api.geoapify.com'

// Typed-area search (geocode). Geoapify scores every exact name match 1.0, so confidence only
// weeds out guesses; which match wins is decided by distance and place size (see rankMatches).
const MIN_CONFIDENCE = 0.8 // below this, a match is more likely a guess than the place the user meant
const GEOCODE_LIMIT = 15 // 1 credit per request whatever the limit; extra results keep far exact matches as choices
const NEARBY_KM = 30 // a match this close to the bias point beats any farther one, whatever its size
const SAME_PLACE_M = 200 // matches this close to a better-ranked one (or with the same shortLabel) count as the same place
const MAX_ALTERNATIVES = 4 // "Not the right spot?" chips

// `message` is technical (logs, the response's `error` field). `userMessage`, when set, is
// written for people and is what the app shows; without it the app shows a generic message.
export class GeoapifyError extends Error {
  constructor(message, { userMessage = null } = {}) {
    super(message)
    this.userMessage = userMessage
  }
}

function apiKey() {
  const key = process.env.GEOAPIFY_API_KEY?.trim()
  if (!key) throw new GeoapifyError('Server is missing GEOAPIFY_API_KEY') // ours to fix, not the user's
  return key
}

async function get(path, params) {
  const url = `${BASE}${path}?${new URLSearchParams({ ...params, apiKey: apiKey() })}`
  const res = await fetch(url)
  if (!res.ok) {
    // Status only; the URL contains the API key
    const message = `Geoapify ${path} failed with ${res.status}`
    console.error(message)
    throw new GeoapifyError(message, {
      userMessage: 'The places service is unavailable right now. Please try again.',
    })
  }
  return res.json()
}

// Named food places within radiusM of a point, nearest first, with duplicates removed
export async function fetchPlaces({ lat, lon, radiusM }) {
  const data = await get('/v2/places', {
    categories: PLACE_CATEGORIES.join(','),
    filter: `circle:${lon},${lat},${radiusM}`,
    bias: `proximity:${lon},${lat}`,
    limit: RESULT_LIMIT,
  })
  return dedupe((data.features ?? []).map((f) => normalizePlace(f.properties)).filter(Boolean))
}

// OpenStreetMap often maps one spot twice (e.g. as a building and as a point inside it).
// Same name within DUPLICATE_DISTANCE_M counts as one; the copy with more details wins (a
// specific cuisine, opening hours, a website), or the nearer one on a tie. Runs before caching
// and again per request (placeFilter.js), so cache rows saved with an older distance are merged too.
export function dedupe(places) {
  const kept = []
  for (const place of places) {
    const key = place.name.trim().toLowerCase()
    const i = kept.findIndex((k) => k.name.trim().toLowerCase() === key && metersBetween(k, place) <= DUPLICATE_DISTANCE_M)
    if (i === -1) kept.push(place)
    else if (detailScore(place) > detailScore(kept[i])) kept[i] = place
  }
  return kept
}

// Labels that only say what kind of place it is (see PLACE_KINDS)
const GENERIC_CUISINES = new Set(['Restaurant', 'Fast Food', 'Cafe', 'Food Court'])
const detailScore = (p) => (GENERIC_CUISINES.has(p.cuisine) ? 0 : 1) + (p.openingHours ? 1 : 0) + (p.website ? 1 : 0)

// Equirectangular approximation; plenty accurate at duplicate-checking distances
function metersBetween(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const x = toRad(b.lon - a.lon) * Math.cos(toRad((a.lat + b.lat) / 2))
  const y = toRad(b.lat - a.lat)
  return Math.hypot(x, y) * 6371000
}

// Best match for a typed city/area, limited to COUNTRY_FILTER when set, plus up to MAX_ALTERNATIVES
// other places so the app can offer "Not the right spot?".
// `near` ({ lat, lon }) is a soft bias: Geoapify ranks closer places higher but still returns far ones.
// Returns null when no match is confident enough, so the user sees "Couldn't find that place".
export async function geocode(text, near = null) {
  const params = { text, limit: GEOCODE_LIMIT, format: 'json' }
  if (COUNTRY_FILTER) params.filter = `countrycode:${COUNTRY_FILTER}`
  if (near) params.bias = `proximity:${near.lon},${near.lat}` // lon first; lat,lon is silently ignored
  const data = await get('/v1/geocode/search', params)
  const results = data.results ?? []

  const confident = results.filter((r) => (r.rank?.confidence ?? 0) >= MIN_CONFIDENCE)
  // A match is dropped when it's within SAME_PLACE_M of a better-ranked one, or would show the
  // same text: two "Tomas Morato Avenue, Quezon City, Metro Manila" chips can't be told apart
  // (long roads come back as several segments)
  const kept = []
  for (const r of rankMatches(confident, near)) {
    const match = toMatch(r)
    if (!kept.some(({ match: k }) => metersBetween(k, match) <= SAME_PLACE_M || k.shortLabel === match.shortLabel)) {
      kept.push({ r, match })
    }
  }

  if (!kept.length) return null
  const [best, ...others] = kept
  // Chain businesses (a 7-Eleven, a Petron) aren't places to search around: skip them as
  // alternatives when the results include streets, districts or areas (the best match counts:
  // for "Tomas Morato" it's the avenue, and its other segments were merged into it above).
  // The best match is never changed by this; when the results are all businesses
  // ("Petron EDSA"), chain alternatives stay.
  const hasAreas = kept.some(({ r }) => placeSize(r) > 0)
  const alternatives = others
    .filter(({ r }) => !(hasAreas && isChainBusiness(r)))
    .slice(0, MAX_ALTERNATIVES)
    .map(({ match }) => match)
  return { ...best.match, alternatives }
}

// Best first: matches within NEARBY_KM of `near` beat far ones ("Katipunan" -> the QC one, not a
// town in Aklan). Then bigger places beat smaller ones ("Baguio" -> the city, not a barangay in
// Tayabas; "Japan" -> a street, not the embassy). Then the closest wins.
// Array.sort is stable, so full ties keep Geoapify's own order.
function rankMatches(results, near) {
  return results
    .map((r) => {
      const km = near ? metersBetween(near, r) / 1000 : 0
      return { r, km, nearby: near && km <= NEARBY_KM ? 1 : 0, size: placeSize(r) }
    })
    .sort((a, b) => b.nearby - a.nearby || b.size - a.size || a.km - b.km)
    .map((m) => m.r)
}

// A business result (not a street or area) whose name is a known chain (chains.js)
function isChainBusiness(r) {
  return placeSize(r) === 0 && Boolean(r.name) && isChainBusinessName(r.name)
}

// Bigger number = bigger place
const SIZE_BY_TYPE = { country: 3, state: 3, county: 3, city: 3, postcode: 2, district: 2, suburb: 2, street: 1 }

// Geoapify also types barangays as "city", but a barangay sits inside a different city
// ("Baguio" in Tayabas), while a real city or municipality is its own city.
function placeSize(r) {
  if (r.result_type === 'city' && r.city && r.city !== r.name) return SIZE_BY_TYPE.suburb
  return SIZE_BY_TYPE[r.result_type] ?? 0 // amenity, building (businesses, landmarks), unknown
}

// A name for where a GPS point is, for "Places within 2 km of ...":
// street, then barangay, then city, e.g. "Tomas Morato Avenue, Sacred Heart, Quezon City".
// Reverse geocoding returns the nearest feature, often a business ("Starbucks"); its name is
// skipped because the user is near it, not in it. Geoapify puts the barangay in `quarter` or
// `suburb`, and sometimes a numbered district there ("District 4"), which is skipped too.
// Returns null when there's nothing usable, so the app keeps showing "Your location".
export async function reverseGeocode(lat, lon) {
  const data = await get('/v1/geocode/reverse', { lat, lon, format: 'json', limit: 1 })
  const r = data.results?.[0]
  if (!r) return null
  const barangay = [r.quarter, r.suburb].find((v) => v && !/\bdistrict\b/i.test(v))
  const parts = [r.street, barangay, r.city || r.county]
  const shortLabel = [...new Set(parts.filter(Boolean))].join(', ')
  return shortLabel ? { shortLabel, label: r.formatted } : null
}

// "Japan, Bonuan Binloc, Dagupan, 2400 Pangasinan, Philippines" -> "Japan, Dagupan, Pangasinan"
function toMatch(r) {
  const parts = [r.name || r.address_line1, r.city || r.county, r.state]
  const shortLabel = [...new Set(parts.filter(Boolean))].join(', ')
  return { lat: r.lat, lon: r.lon, label: r.formatted, shortLabel: shortLabel || r.formatted }
}

// Geoapify feature -> the place shape the frontend uses.
// Price levels aren't in OpenStreetMap data, so they're null for now.
function normalizePlace(p) {
  if (!p.name) return null // unnamed map entries aren't useful to pick from
  return {
    id: p.place_id,
    name: p.name,
    brand: p.brand ?? p.datasource?.raw?.brand ?? null, // used to spot chains
    cuisine: cuisineLabel(p.categories ?? []),
    category: placeCategory(p.categories ?? []),
    lat: p.lat,
    lon: p.lon,
    address: p.address_line2 || p.formatted || '',
    openingHours: p.opening_hours ?? null,
    website: httpUrl(p.website),
    priceLevel: null,
  }
}

// OpenStreetMap data is user-edited, so only pass through plain http(s) links
function httpUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch {
    return null
  }
}

// Labels for Geoapify subcategories that don't read well when just title-cased
const CUISINE_LABELS = {
  coffee: 'Cafe',
  coffee_shop: 'Cafe',
}

// Geoapify category -> our category and its fallback cuisine label. Checked in order, so a
// bakery that's also tagged as a cafe counts as a bakery.
const PLACE_KINDS = [
  { prefix: 'commercial.food_and_drink.bakery', category: 'bakery', label: 'Bakery' },
  { prefix: 'catering.ice_cream', category: 'ice_cream', label: 'Ice Cream' },
  { prefix: 'catering.food_court', category: 'food_court', label: 'Food Court' },
  { prefix: 'catering.fast_food', category: 'fast_food', label: 'Fast Food' },
  { prefix: 'catering.cafe', category: 'cafe', label: 'Cafe' },
  { prefix: 'catering.restaurant', category: 'restaurant', label: 'Restaurant' },
]

function placeKind(categories) {
  return PLACE_KINDS.find((k) => categories.includes(k.prefix)) ?? PLACE_KINDS.at(-1)
}

function placeCategory(categories) {
  return placeKind(categories).category
}

// "catering.restaurant.steak_house" -> "Steak House"; plain categories -> "Restaurant", "Cafe", "Bakery", ...
function cuisineLabel(categories) {
  const specific = categories.find((c) => /^catering\.(restaurant|cafe|fast_food)\.[^.]+$/.test(c))
  if (specific) {
    const key = specific.split('.').pop()
    return CUISINE_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())
  }
  return placeKind(categories).label
}