// GET /api/geocode?text=..
//
// Turns a typed city or area into coordinates with Geoapify, limited to COUNTRY_FILTER.
import { geocode, GeoapifyError } from '../lib/geoapify.js'

export default async (req) => {
  const text = new URL(req.url).searchParams.get('text')?.trim()
  if (!text || text.length > 200) {
    return Response.json({ error: 'text is required (max 200 characters)' }, { status: 400 })
  }

  try {
    const result = await geocode(text)
    if (!result) {
      return Response.json({ error: "Couldn't find that place. Try a nearby city or landmark." }, { status: 404 })
    }
    return Response.json(result)
  } catch (err) {
    const message = err instanceof GeoapifyError ? err.message : 'Could not look up that area'
    if (!(err instanceof GeoapifyError)) console.error(err)
    return Response.json({ error: message }, { status: 502 })
  }
}
