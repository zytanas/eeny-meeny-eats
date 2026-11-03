// GET /api/nearby?lat=..&lon=..&tz=..
//
// Restaurants and cafes near a point, from Geoapify (OpenStreetMap data).
// Results are cached in Supabase `places_cache` per ~110 m grid cell for CACHE_TTL_HOURS.
// "Open now" is worked out on every request from the cached opening hours, so it never goes stale.
import { CACHE_COORD_DECIMALS, CACHE_TTL_HOURS, DEFAULT_TIMEZONE, SEARCH_RADIUS_M } from '../lib/config.js'
import { fetchPlaces, GeoapifyError } from '../lib/geoapify.js'
import { getSupabase } from '../lib/supabase.js'
import { isOpenNow, isValidTimeZone } from '../lib/openNow.js'

export default async (req) => {
  const url = new URL(req.url)
  const lat = parseFloat(url.searchParams.get('lat'))
  const lon = parseFloat(url.searchParams.get('lon'))
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return Response.json({ error: 'Valid lat and lon are required' }, { status: 400 })
  }
  const tz = url.searchParams.get('tz')
  const timeZone = isValidTimeZone(tz) ? tz : DEFAULT_TIMEZONE

  // Everyone in the same grid cell shares one search, centered on the cell
  const cellLat = Number(lat.toFixed(CACHE_COORD_DECIMALS))
  const cellLon = Number(lon.toFixed(CACHE_COORD_DECIMALS))
  const areaKey = `${cellLat},${cellLon}|r${SEARCH_RADIUS_M}`

  let places = await readCache(areaKey)
  const source = places ? 'cache' : 'geoapify'

  if (!places) {
    try {
      places = await fetchPlaces({ lat: cellLat, lon: cellLon, radiusM: SEARCH_RADIUS_M })
    } catch (err) {
      const message = err instanceof GeoapifyError ? err.message : 'Could not load nearby places'
      if (!(err instanceof GeoapifyError)) console.error(err)
      return Response.json({ error: message }, { status: 502 })
    }
    await writeCache(areaKey, places)
  }

  return Response.json({
    center: { lat, lon },
    places: places.map((p) => ({ ...p, openNow: isOpenNow(p.openingHours, timeZone) })),
    source,
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
