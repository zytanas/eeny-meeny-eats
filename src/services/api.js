// Frontend helpers for our Netlify Functions.
// The browser never calls Geoapify or Google directly; API keys stay server-side.

async function request(path, options = {}) {
  const res = await fetch(`/api/${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  return data
}

/**
 * Nearby food places around a point, starting at radiusKm. The server widens the search when
 * it finds too few, and returns the radius it actually used as `radiusKm`.
 * tz lets the server work out "open now" in local time.
 */
export function fetchNearby({ lat, lon, radiusKm }) {
  const params = new URLSearchParams({ lat, lon, radius: radiusKm })
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (tz) params.set('tz', tz)
  return request(`nearby?${params}`)
}

/**
 * Best match for a typed city or area: { lat, lon, label, shortLabel, alternatives }.
 * alternatives are other confident matches with the same shape (minus alternatives).
 * near ({ lat, lon }) is where the user is now; the server prefers matches close to it.
 */
export function geocodeArea(text, near) {
  const params = new URLSearchParams({ text })
  if (near) {
    params.set('lat', near.lat)
    params.set('lon', near.lon)
  }
  return request(`geocode?${params}`)
}

/**
 * A name for a GPS position: { shortLabel, label }, e.g. shortLabel
 * "Tomas Morato Avenue, Sacred Heart, Quezon City".
 */
export function reverseGeocode({ lat, lon }) {
  return request(`reverse-geocode?${new URLSearchParams({ lat, lon })}`)
}

/** Google star rating and rating count for one place. */
export function fetchRating(place) {
  const params = new URLSearchParams({
    placeId: place.id,
    name: place.name,
    lat: place.lat,
    lon: place.lon,
  })
  return request(`rating?${params}`)
}

/** Report a problem with a place (closed, wrong info, etc.). */
export function submitReport({ placeId, reportType, message }) {
  return request('report', {
    method: 'POST',
    body: JSON.stringify({ placeId, reportType, message }),
  })
}
