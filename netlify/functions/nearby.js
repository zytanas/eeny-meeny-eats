// GET /api/nearby?lat=..&lon=..&radius=..&tz=..&chains=include
//
// Named restaurants, cafes, food courts, ice cream and bakeries near a point, from Geoapify
// (OpenStreetMap data). `radius` is the user's pick in km (default DEFAULT_RADIUS_KM);
// if it finds fewer than MIN_RESULTS places, the search widens through RADIUS_STEPS_KM, and the
// response's `radiusKm` says which radius was actually used.
//
// Fast food is left out: fast-food chains always, and places still labelled plain "Fast Food"
// once their names have been checked for a cuisine (lib/placeFilter.js). Places tagged fast food
// whose name gives a real cuisine ("Master Siomai" -> Chinese) stay. Geoapify is still asked for
// catering.fast_food, so those can be found.
//
// Results are cached in Supabase `places_cache` per ~110 m grid cell and radius for CACHE_TTL_HOURS.
// Filtering and cuisine labels are worked out per request (not before caching), so editing a chain
// list or a name rule, or asking for chains, takes effect immediately. The widening check counts
// only the places that are kept. "Open now" is also worked out per request, so it never goes stale.
//
// Errors: `error` is technical; `userMessage` is set only when the text is written for people.
import {
  CACHE_COORD_DECIMALS,
  CACHE_TTL_HOURS,
  DEFAULT_RADIUS_KM,
  DEFAULT_TIMEZONE,
  HIDE_CHAINS,
  MIN_RESULTS,
  RADIUS_STEPS_KM,
} from '../lib/config.js'
import { keepPlaces } from '../lib/placeFilter.js'
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
      places = keepPlaces(places, { hideChains })
      if (places.length >= MIN_RESULTS) break
    }
  } catch (err) {
    const message = err instanceof GeoapifyError ? err.message : 'Could not load nearby places'
    if (!(err instanceof GeoapifyError)) console.error(err)
    return Response.json({ error: message, userMessage: err.userMessage ?? undefined }, { status: 502 })
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
