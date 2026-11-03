// POST /api/report  { placeId, reportType, message }
//
// Saves a user's problem report about a place to Supabase `reports`
// (service role on the server; RLS blocks any direct browser access).
import { getSupabase } from '../lib/supabase.js'

const REPORT_TYPES = ['closed', 'wrong_info', 'wrong_location', 'other']
const MAX_MESSAGE = 1000

export default async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { placeId, reportType, message = '' } = body ?? {}
  if (typeof placeId !== 'string' || !placeId || placeId.length > 300 || !REPORT_TYPES.includes(reportType)) {
    return Response.json(
      { error: `placeId and reportType (${REPORT_TYPES.join(', ')}) are required` },
      { status: 400 },
    )
  }
  const text = String(message).trim().slice(0, MAX_MESSAGE)
  if (reportType === 'other' && !text) {
    return Response.json({ error: 'Please describe the problem.' }, { status: 400 })
  }

  const db = getSupabase()
  if (!db) {
    return Response.json({ error: 'Reports are unavailable right now.' }, { status: 503 })
  }

  const { error } = await db
    .from('reports')
    .insert({ place_id: placeId, report_type: reportType, message: text || null })
  if (error) {
    console.error('reports insert failed:', error.message)
    return Response.json({ error: "Couldn't send your report. Please try again." }, { status: 500 })
  }

  return Response.json({ ok: true }, { status: 201 })
}
