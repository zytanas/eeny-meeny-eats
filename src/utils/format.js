// Small display helpers shared by cards and detail views

export function formatDistance(km) {
  if (km == null) return ''
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

export function formatPrice(level) {
  return level ? '$'.repeat(level) : ''
}

// OpenStreetMap directions to the place (works on mobile and desktop, no account or key).
// `from` ({ lat, lon }, optional) fills in the start point; people can change it there.
export function directionsUrl(place, from = null) {
  const start = from ? `${from.lat},${from.lon}` : ''
  const route = `${start};${place.lat},${place.lon}`
  return `https://www.openstreetmap.org/directions?${new URLSearchParams({ route })}`
}
