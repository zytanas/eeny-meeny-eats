// Thin wrappers around the Geoapify APIs. The API key never leaves the server.
import { COUNTRY_FILTER, PLACE_CATEGORIES, RESULT_LIMIT } from './config.js'

const BASE = 'https://api.geoapify.com'

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

// Restaurants and cafes within radiusM of a point, nearest first
export async function fetchPlaces({ lat, lon, radiusM }) {
  const data = await get('/v2/places', {
    categories: PLACE_CATEGORIES.join(','),
    filter: `circle:${lon},${lat},${radiusM}`,
    bias: `proximity:${lon},${lat}`,
    limit: RESULT_LIMIT,
  })
  return (data.features ?? []).map((f) => normalizePlace(f.properties)).filter(Boolean)
}

// First match for a typed city/area, limited to COUNTRY_FILTER when set
export async function geocode(text) {
  const params = { text, limit: 1, format: 'json' }
  if (COUNTRY_FILTER) params.filter = `countrycode:${COUNTRY_FILTER}`
  const data = await get('/v1/geocode/search', params)
  const r = data.results?.[0]
  return r ? { lat: r.lat, lon: r.lon, label: r.formatted } : null
}

// Geoapify feature -> the place shape the frontend uses.
// Ratings and price levels aren't in OpenStreetMap data, so they're null for now.
function normalizePlace(p) {
  if (!p.name) return null // unnamed map entries aren't useful to pick from
  return {
    id: p.place_id,
    name: p.name,
    cuisine: cuisineLabel(p.categories ?? []),
    category: p.categories?.includes('catering.cafe') ? 'cafe' : 'restaurant',
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

// "catering.restaurant.steak_house" -> "Steak House"; plain categories -> "Restaurant" / "Cafe"
function cuisineLabel(categories) {
  const specific = categories.find((c) => /^catering\.(restaurant|cafe)\.[^.]+$/.test(c))
  if (specific) {
    const key = specific.split('.').pop()
    return CUISINE_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())
  }
  return categories.includes('catering.cafe') ? 'Cafe' : 'Restaurant'
}
