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

/** Nearby restaurants and cafes around a point. tz lets the server work out "open now" in local time. */
export function fetchNearby({ lat, lon }) {
  const params = new URLSearchParams({ lat, lon })
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (tz) params.set('tz', tz)
  return request(`nearby?${params}`)
}

/** Coordinates for a typed city or area. */
export function geocodeArea(text) {
  return request(`geocode?${new URLSearchParams({ text })}`)
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
