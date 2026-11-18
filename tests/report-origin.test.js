// Origin check in netlify/functions/report.js.
// Each request sends an empty JSON body: an allowed origin gets past the check and fails
// validation (400) before Supabase is touched; a blocked origin gets 403.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import handler from '../netlify/functions/report.js'

const SITE_URL = 'https://emechos.netlify.app/api/report'

function post(origin, url = SITE_URL) {
  const headers = { 'content-type': 'application/json' }
  if (origin !== undefined) headers.origin = origin
  return handler(new Request(url, { method: 'POST', headers, body: '{}' }))
}

const allowed = [
  ['no Origin header', undefined],
  ['production site', 'https://emechos.netlify.app'],
  ['deploy preview', 'https://deploy-preview-12--emechos.netlify.app'],
  ['branch deploy', 'https://feature-x--emechos.netlify.app'],
]

const blocked = [
  ['look-alike with extra domain', 'https://emechos.netlify.app.evil.example'],
  ['look-alike with prefix', 'https://notemechos.netlify.app'],
  ['other Netlify site', 'https://someone-else.netlify.app'],
  ['other site preview', 'https://deploy-preview-1--notemechos.netlify.app'],
  ['literal null', 'null'],
  ['unrelated site', 'https://evil.example'],
]

for (const [name, origin] of allowed) {
  test(`allows ${name}`, async () => {
    const res = await post(origin)
    assert.equal(res.status, 400)
  })
}

for (const [name, origin] of blocked) {
  test(`blocks ${name}: ${origin}`, async () => {
    const res = await post(origin)
    assert.equal(res.status, 403)
  })
}

// Sent to another host so the "own host" rule (which compares host only) doesn't apply.
test('blocks the Netlify site over http when it is not the own host', async () => {
  const res = await post('http://emechos.netlify.app', 'https://example.com/api/report')
  assert.equal(res.status, 403)
})

test("allows the site's own host, including localhost under netlify dev", async () => {
  const res = await post('http://localhost:8888', 'http://localhost:8888/api/report')
  assert.equal(res.status, 400)
})

test('blocks a different localhost port', async () => {
  const res = await post('http://localhost:5173', 'http://localhost:8888/api/report')
  assert.equal(res.status, 403)
})
