// Frontend helpers for our Netlify Functions.
// The browser never calls Geoapify or Google directly; API keys stay server-side.

// What people see when a request fails. Every error thrown from here has a message that's
// safe to show as-is; the technical detail goes to the console instead.
const copy = {
  offline: 'You seem to be offline. Check your connection and try again.',
  server: 'Something went wrong on our end. Try again in a moment.',
}

async function request(path, options = {}) {
  let res
  try {
    res = await fetch(`/api/${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch (err) {
    // fetch only throws when no response arrived at all: offline, DNS, dropped connection.
    // Browsers word it differently ("Failed to fetch", "Load failed", "NetworkError ...").
    console.error(`[api] ${path}: network error`, err)
    throw new Error(copy.offline, { cause: err })
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error(`[api] ${path}: ${res.status}`, data.error ?? '(no message)')
    // Our functions put text written for people in `userMessage` ("Couldn't find that place.
    // Try a nearby city or landmark."); `error` is technical and never shown. Without a
    // userMessage, people get the generic message.
    throw new Error(data.userMessage || copy.server)
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
