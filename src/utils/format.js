// Small display helpers shared by cards and detail views

export function formatDistance(km) {
  if (km == null) return ''
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

export function formatPrice(level) {
  return level ? '$'.repeat(level) : ''
}

// Opens Google Maps directions to the place (works on mobile and desktop)
export function directionsUrl(place) {
  return `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`
}
