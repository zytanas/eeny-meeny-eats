// GET /api/rating?placeId=..&name=..&lat=..&lon=..
//
// Placeholder: returns a mock rating. Not called by the frontend yet: Google ratings are
// skipped for now, and the rating UI hides itself while places have no `rating`.
// TODO: look up the place with Google Places API (New) Text Search using
// process.env.GOOGLE_PLACES_API_KEY and a field mask of only
// `places.rating,places.userRatingCount`. Cache results in Supabase `ratings_cache`.

export default async (req) => {
  const url = new URL(req.url)
  const placeId = url.searchParams.get('placeId')

  if (!placeId) {
    return Response.json({ error: 'placeId is required' }, { status: 400 })
  }

  return Response.json({
    placeId,
    rating: 4.3,
    ratingCount: 128,
    source: 'mock',
  })
}
