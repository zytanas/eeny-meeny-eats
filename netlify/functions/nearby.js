// GET /api/nearby?lat=..&lon=..&radius=..&tz=..&chains=include
//
// Named restaurants, cafes, fast food, food courts, ice cream and bakeries near a point,
// from Geoapify (OpenStreetMap data). `radius` is the user's pick in km (default DEFAULT_RADIUS_KM);
// if it finds fewer than MIN_RESULTS places, the search widens through RADIUS_STEPS_KM, and the
// response's `radiusKm` says which radius was actually used.
//
// Results are cached in Supabase `places_cache` per ~110 m grid cell and radius for CACHE_TTL_HOURS.
// Chains are filtered out per request (not before caching), so editing CHAIN_BLOCKLIST or asking
// for chains takes effect immediately. "Open now" is also worked out per request, so it never goes stale.
import {
  CACHE_COORD_DECIMALS,
  CACHE_TTL_HOURS,
  CHAIN_BLOCKLIST,
  DEFAULT_RADIUS_KM,
  DEFAULT_TIMEZONE,
  HIDE_CHAINS,
  MIN_RESULTS,
  RADIUS_STEPS_KM,
} from '../lib/config.js'
import { fetchPlaces, GeoapifyError } from '../lib/geoapify.js'
import { getSupabase } from '../lib/supabase.js'
import { isOpenNow, isValidTimeZone } from '../lib/openNow.js'

// Bump when the cached place shape or search changes, so old cache rows are ignored
const CACHE_VERSION = 'v2'
const MAX_RADIUS_KM = Math.max(...RADIUS_STEPS_KM)

export default async (req) => {
  const url = new URL(req.url)
  const lat = parseFloat(url.searchParams.get('lat'))
  const lon = parseFloat(url.searchParams.get('lon'))
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return Response.json({ error: 'Valid lat and lon are required' }, { status: 400 })
  }
  const tz = url.searchParams.get('tz')
  const timeZone = isValidTimeZone(tz) ? tz : DEFAULT_TIMEZONE
  const requestedKm = parseRadiusKm(url.searchParams.get('radius'))
  const hideChains = url.searchParams.has('chains') ? url.searchParams.get('chains') !== 'include' : HIDE_CHAINS

  // Everyone in the same grid cell shares one search, centered on the cell
  const cellLat = Number(lat.toFixed(CACHE_COORD_DECIMALS))
  const cellLon = Number(lon.toFixed(CACHE_COORD_DECIMALS))

  // The user's radius first, then each wider step until one has enough places
  const radii = [requestedKm, ...RADIUS_STEPS_KM.filter((km) => km > requestedKm)]
  let places, radiusKm, source
  try {
    for (radiusKm of radii) {
      ;({ places, source } = await placesWithin(cellLat, cellLon, radiusKm))
      if (hideChains) places = places.filter((p) => !isChain(p))
      if (places.length >= MIN_RESULTS) break
    }
  } catch (err) {
    const message = err instanceof GeoapifyError ? err.message : 'Could not load nearby places'
    if (!(err instanceof GeoapifyError)) console.error(err)
    return Response.json({ error: message }, { status: 502 })
  }

  return Response.json({
    center: { lat, lon },
    radiusKm,
    requestedRadiusKm: requestedKm,
    chainsHidden: hideChains,
    places: places.map(({ brand, ...p }) => ({ ...p, openNow: isOpenNow(p.openingHours, timeZone) })),
    source,
  })
}

// Positive km up to the widest step; anything else falls back to the default
function parseRadiusKm(value) {
  const km = parseFloat(value)
  return Number.isFinite(km) && km > 0 ? Math.min(km, MAX_RADIUS_KM) : DEFAULT_RADIUS_KM
}

async function placesWithin(lat, lon, radiusKm) {
  const areaKey = `${CACHE_VERSION}|${lat},${lon}|r${Math.round(radiusKm * 1000)}`
  const cached = await readCache(areaKey)
  if (cached) return { places: cached, source: 'cache' }
  const places = await fetchPlaces({ lat, lon, radiusM: radiusKm * 1000 })
  await writeCache(areaKey, places)
  return { places, source: 'geoapify' }
}

// "Dunkin' Donuts" -> "dunkin donuts", "7-Eleven" -> "7 eleven", "Café" -> "cafe"
function normalizeName(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const CHAIN_TERMS = CHAIN_BLOCKLIST.map(normalizeName).filter(Boolean)

function isChain(place) {
  return [place.name, place.brand].some((text) => {
    if (!text) return false
    const padded = ` ${normalizeName(text)} `
    return CHAIN_TERMS.some((term) => padded.includes(` ${term} `))
  })
}

// Cache problems never break the response; we just fetch fresh data instead
async function readCache(areaKey) {
  const db = getSupabase()
  if (!db) return null
  const freshAfter = new Date(Date.now() - CACHE_TTL_HOURS * 3600 * 1000).toISOString()
  const { data, error } = await db
    .from('places_cache')
    .select('results')
    .eq('area_key', areaKey)
    .gte('fetched_at', freshAfter)
    .maybeSingle()
  if (error) console.error('places_cache read failed:', error.message)
  return data?.results ?? null
}

async function writeCache(areaKey, places) {
  const db = getSupabase()
  if (!db) return
  const { error } = await db
    .from('places_cache')
    .upsert({ area_key: areaKey, results: places, fetched_at: new Date().toISOString() }, { onConflict: 'area_key' })
  if (error) console.error('places_cache write failed:', error.message)
}
