// GET /api/geocode?text=..&lat=..&lon=..
//
// Turns a typed city or area into coordinates with Geoapify, limited to COUNTRY_FILTER.
// lat/lon (optional) is where the user is now; matches near it are preferred.
//
// Errors: `error` is technical, for logs and the browser console. `userMessage` is only set
// when the text is written for people; the app shows it, or a generic message without it.
import { geocode, GeoapifyError } from '../lib/geoapify.js'

export default async (req) => {
  const url = new URL(req.url)
  const text = url.searchParams.get('text')?.trim()
  if (!text || text.length > 200) {
    return Response.json({ error: 'text is required (max 200 characters)' }, { status: 400 })
  }
  const lat = parseFloat(url.searchParams.get('lat'))
  const lon = parseFloat(url.searchParams.get('lon'))
  const valid = Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180
  const near = valid ? { lat, lon } : null // no or bad point: search without a bias

  try {
    const result = await geocode(text, near)
    if (!result) {
      return Response.json(
        {
          error: 'No confident match for the typed area',
          userMessage: "Couldn't find that place. Try a nearby city or landmark.",
        },
        { status: 404 },
      )
    }
    return Response.json(result)
  } catch (err) {
    const message = err instanceof GeoapifyError ? err.message : 'Could not look up that area'
    if (!(err instanceof GeoapifyError)) console.error(err)
    return Response.json({ error: message, userMessage: err.userMessage ?? undefined }, { status: 502 })
  }
}

// Only reachable here (a custom path turns off /.netlify/functions/geocode). The /api/* rate limit
// rule in netlify.toml covers it.
export const config = { path: '/api/geocode' }
