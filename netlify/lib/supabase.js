import { createClient } from '@supabase/supabase-js'

let client

// Server-side Supabase client using the service role key (bypasses RLS).
// Returns null when Supabase isn't configured, so callers can skip caching.
export function getSupabase() {
  if (client !== undefined) return client

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  // Accept the REST endpoint too (".../rest/v1/"); supabase-js wants the bare project URL
  const url = process.env.SUPABASE_URL?.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')

  client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null
  if (!client) console.warn('Supabase is not configured; caching is disabled')
  return client
}
