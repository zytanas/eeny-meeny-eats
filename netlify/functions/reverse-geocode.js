// GET /api/reverse-geocode?lat=..&lon=..
//
// Names the spot a GPS position is at ("Tomas Morato Avenue, Sacred Heart, Quezon City"),
// so the app can show it instead of "Your location". See reverseGeocode in lib/geoapify.js.
import { reverseGeocode, GeoapifyError } from '../lib/geoapify.js'

export default async (req) => {
  const url = new URL(req.url)
  const lat = parseFloat(url.searchParams.get('lat'))
  const lon = parseFloat(url.searchParams.get('lon'))
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return Response.json({ error: 'lat and lon are required' }, { status: 400 })
  }

  try {
    const result = await reverseGeocode(lat, lon)
    if (!result) return Response.json({ error: 'No name found for this spot' }, { status: 404 })
    return Response.json(result)
  } catch (err) {
    const message = err instanceof GeoapifyError ? err.message : 'Could not name this spot'
    if (!(err instanceof GeoapifyError)) console.error(err)
    return Response.json({ error: message, userMessage: err.userMessage ?? undefined }, { status: 502 })
  }
}

// Only reachable here (a custom path turns off /.netlify/functions/reverse-geocode). The /api/* rate limit
// rule in netlify.toml covers it.
export const config = { path: '/api/reverse-geocode' }
