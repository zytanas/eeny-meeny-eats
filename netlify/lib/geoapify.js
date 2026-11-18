// Thin wrappers around the Geoapify APIs. The API key never leaves the server.
import { COUNTRY_FILTER, DUPLICATE_DISTANCE_M, PLACE_CATEGORIES, RESULT_LIMIT } from './config.js'

const BASE = 'https://api.geoapify.com'

// Below this, a geocode match is more likely a guess than the place the user meant
const MIN_CONFIDENCE = 0.5

export class GeoapifyError extends Error {}

function apiKey() {
  const key = process.env.GEOAPIFY_API_KEY?.trim()
  if (!key) throw new GeoapifyError('Server is missing GEOAPIFY_API_KEY')
  return key
}

async function get(path, params) {
  const url = `${BASE}${path}?${new URLSearchParams({ ...params, apiKey: apiKey() })}`
  const res = await fetch(url)
  if (!res.ok) {
    // Log status only; the URL contains the API key
    console.error(`Geoapify ${path} failed with ${res.status}`)
    throw new GeoapifyError('The places service is unavailable right now. Please try again.')
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
// Same name within DUPLICATE_DISTANCE_M counts as one; the copy with more details wins.
function dedupe(places) {
  const kept = []
  for (const place of places) {
    const key = place.name.trim().toLowerCase()
    const i = kept.findIndex((k) => k.name.trim().toLowerCase() === key && metersBetween(k, place) <= DUPLICATE_DISTANCE_M)
    if (i === -1) kept.push(place)
    else if (detailScore(place) > detailScore(kept[i])) kept[i] = place
  }
  return kept
}

const detailScore = (p) => (p.openingHours ? 1 : 0) + (p.website ? 1 : 0)

// Equirectangular approximation; plenty accurate at duplicate-checking distances
function metersBetween(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const x = toRad(b.lon - a.lon) * Math.cos(toRad((a.lat + b.lat) / 2))
  const y = toRad(b.lat - a.lat)
  return Math.hypot(x, y) * 6371000
}

// Best match for a typed city/area, limited to COUNTRY_FILTER when set, plus other good
// matches so the app can offer "Not the right spot?".
// Returns null when no match is confident enough, so the user sees "Couldn't find that place".
export async function geocode(text) {
  const params = { text, limit: 5, format: 'json' }
  if (COUNTRY_FILTER) params.filter = `countrycode:${COUNTRY_FILTER}`
  const data = await get('/v1/geocode/search', params)
  const results = data.results ?? []

  // Temporary: shows how Geoapify scores each match, so we can tune MIN_CONFIDENCE
  console.log(`geocode "${text}":`, results.map((r) => `${r.formatted} (${r.rank?.confidence})`))

  const seen = new Set()
  const matches = results
    .filter((r) => (r.rank?.confidence ?? 0) >= MIN_CONFIDENCE)
    .sort((a, b) => b.rank.confidence - a.rank.confidence)
    .map(toMatch)
    .filter((m) => !seen.has(m.shortLabel) && seen.add(m.shortLabel))

  if (!matches.length) return null
  const [best, ...alternatives] = matches
  return { ...best, alternatives }
}

// "Japan, Bonuan Binloc, Dagupan, 2400 Pangasinan, Philippines" -> "Japan, Dagupan, Pangasinan"
function toMatch(r) {
  const parts = [r.name || r.address_line1, r.city || r.county, r.state]
  const shortLabel = [...new Set(parts.filter(Boolean))].join(', ')
  return { lat: r.lat, lon: r.lon, label: r.formatted, shortLabel: shortLabel || r.formatted }
}

// Geoapify feature -> the place shape the frontend uses.
// Ratings and price levels aren't in OpenStreetMap data, so they're null for now.
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
    rating: null,
    ratingCount: null,
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
  hongkong: 'Hong Kong',
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