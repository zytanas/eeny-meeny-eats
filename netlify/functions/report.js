// POST /api/report  { placeId, reportType, message }
//
// Saves a user's problem report about a place to Supabase `reports`
// (service role on the server; RLS blocks any direct browser access).
//
// Spam protection:
//   - Origin check: a request with an Origin header must come from this site's own host,
//     https://emechos.netlify.app, or one of its deploy previews (*--emechos.netlify.app).
//     Without it, another website could post reports from its visitors' browsers (a
//     text/plain POST needs no CORS preflight, and req.json() reads it anyway). Requests without an Origin (curl, server-to-server) aren't affected;
//     the rate limit covers those.
//   - Honeypot: the form has a hidden `website` field people never see or fill. If it has a
//     value, a bot filled it: answer 201 as if it worked, but save nothing.
//
// Errors: `error` is technical; `userMessage` is set only when the text is written for people.
// Validation errors stay technical: the form already stops those requests from being sent.
import { getSupabase } from '../lib/supabase.js'

const REPORT_TYPES = ['closed', 'wrong_info', 'wrong_location', 'other']
const MAX_MESSAGE = 1000

export default async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }
  if (!isAllowedOrigin(req)) {
    return Response.json({ error: 'Origin not allowed' }, { status: 403 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { placeId, reportType, message = '', website } = body ?? {}
  if (typeof website === 'string' && website.trim()) {
    return Response.json({ ok: true }, { status: 201 }) // honeypot filled: pretend it worked
  }
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
    return Response.json(
      { error: 'Supabase is not configured', userMessage: 'Reports are unavailable right now.' },
      { status: 503 },
    )
  }

  const { error } = await db
    .from('reports')
    .insert({ place_id: placeId, report_type: reportType, message: text || null })
  if (error) {
    // The database's own message stays in the server log
    console.error('reports insert failed:', error.message)
    return Response.json(
      { error: 'reports insert failed', userMessage: "Couldn't send your report. Please try again." },
      { status: 500 },
    )
  }

  return Response.json({ ok: true }, { status: 201 })
}

// No Origin header: allowed. Otherwise it must be this site's own host (whatever domain it's
// served on, including localhost under `netlify dev`), the production Netlify URL, or one of
// its deploy previews / branch deploys (e.g. https://deploy-preview-12--emechos.netlify.app).
const NETLIFY_SITE_HOST = 'emechos.netlify.app'

function isAllowedOrigin(req) {
  const origin = req.headers.get('origin')
  if (!origin) return true
  let parsed
  try {
    parsed = new URL(origin)
  } catch {
    return false // includes the literal "null" origin sent from sandboxed pages
  }
  if (parsed.host === new URL(req.url).host) return true
  if (parsed.protocol !== 'https:') return false
  const { hostname } = parsed
  return hostname === NETLIFY_SITE_HOST || hostname.endsWith(`--${NETLIFY_SITE_HOST}`)
}

// Only reachable here (a custom path turns off /.netlify/functions/report). The /api/* rate limit
// rule in netlify.toml covers it.
export const config = { path: '/api/report' }
