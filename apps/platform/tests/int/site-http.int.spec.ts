/**
 * Public site, booking step and publish endpoints, against a running server (PLATFORM_URL)
 * that shares this test's database. Skipped when the server is unreachable.
 * Uses seeded tenants 5 and 6.
 */
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { SEED_PASSWORD, tenantEmail, tenantSlug } from '@/seed/constants'
import { poolOf } from '@/releases/db'

const BASE = (process.env.PLATFORM_URL || 'http://localhost:3000').replace(/\/+$/, '')
let reachable = false
let payload: Payload
type T = { tenantId: number; siteId: number; slug: string; token: string }
let A: T
let B: T

const xRelease = (html: string) =>
  html.match(/<meta[^>]*name="x-release"[^>]*content="([^"]+)"/)?.[1] ?? html.match(/<meta[^>]*content="([^"]+)"[^>]*name="x-release"/)?.[1] ?? null

const load = async (n: number): Promise<T> => {
  const tenant = (await payload.find({ collection: 'tenants', where: { slug: { equals: tenantSlug(n) } }, overrideAccess: true, limit: 1 })).docs[0]
  const site = (await payload.find({ collection: 'sites', where: { tenant: { equals: tenant.id } }, overrideAccess: true, limit: 1 })).docs[0]
  const r = await fetch(`${BASE}/api/users/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: tenantEmail(n), password: SEED_PASSWORD }),
  })
  const j = (await r.json()) as { token?: string }
  if (!j.token) throw new Error('login failed')
  return { tenantId: Number(tenant.id), siteId: Number(site.id), slug: site.slug, token: j.token }
}
const reset = async (t: T) => {
  await poolOf(payload).query(`update sites set current_release_id = null, booking_engine = 'none', booking_property_code = null where id = $1`, [t.siteId])
  await payload.delete({ collection: 'releases', where: { site: { equals: t.siteId } }, overrideAccess: true })
}
const post = (t: T | null, p: string) =>
  fetch(`${BASE}/api${p}`, { method: 'POST', headers: t ? { authorization: `JWT ${t.token}` } : {} })

beforeAll(async () => {
  try {
    reachable = (await fetch(`${BASE}/api/users/me`)).status < 500
  } catch {
    reachable = false
  }
  if (!reachable) return
  payload = await getPayload({ config })
  A = await load(5)
  B = await load(6)
  await reset(A)
  await reset(B)
})
afterAll(async () => {
  if (!reachable) return
  await reset(A)
  await reset(B)
})

describe('publish endpoints over HTTP', () => {
  it('refuses anonymous callers and other tenants\' sites', async (ctx) => {
    if (!reachable) ctx.skip()
    expect((await post(null, `/sites/${A.siteId}/publish`)).status).toBe(401)
    expect((await post(A, `/sites/${B.siteId}/publish`)).status).toBe(404)
    expect((await post(A, `/sites/${B.siteId}/rollback`)).status).toBe(404)
    const b = await poolOf(payload).query(`select current_release_id from sites where id = $1`, [B.siteId])
    expect(b.rows[0].current_release_id).toBeNull()
  })

  it('an owner publishes their site and the public page serves that release', async (ctx) => {
    if (!reachable) ctx.skip()
    await poolOf(payload).query(`update sites set booking_engine = 'clockpms-be-mock', booking_property_code = 'T05' where id = $1`, [A.siteId])
    const res = await post(A, `/sites/${A.siteId}/publish`)
    const body = (await res.json()) as { outcome: string; releaseId: number; durationMs: number }
    expect(res.status, JSON.stringify(body)).toBe(200)
    expect(body.outcome).toBe('live')
    const page = await fetch(`${BASE}/s/${A.slug}`)
    expect(page.status).toBe(200)
    const html = await page.text()
    expect(xRelease(html)).toBe(String(body.releaseId))
    expect(html).toContain('Welcome to tenant 5')
    const sub = await fetch(`${BASE}/s/${A.slug}/rooms`)
    expect(sub.status).toBe(200)
    expect((await fetch(`${BASE}/s/${A.slug}/no-such-page`)).status).toBe(404)
  })

  it('a site with no release serves nothing', async (ctx) => {
    if (!reachable) ctx.skip()
    expect((await fetch(`${BASE}/s/${B.slug}`)).status).toBe(404)
  })

  it('rollback over HTTP moves the served release back', async (ctx) => {
    if (!reachable) ctx.skip()
    const first = xRelease(await (await fetch(`${BASE}/s/${A.slug}`)).text())
    const second = (await (await post(A, `/sites/${A.siteId}/publish`)).json()) as { releaseId: number }
    expect(xRelease(await (await fetch(`${BASE}/s/${A.slug}`)).text())).toBe(String(second.releaseId))
    const rb = await post(A, `/sites/${A.siteId}/rollback`)
    expect(rb.status).toBe(200)
    expect(xRelease(await (await fetch(`${BASE}/s/${A.slug}`)).text())).toBe(first)
  })
})

describe('booking step on the hotel domain (clockPMS BE mock)', () => {
  const d = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)

  it('availability JSON comes from the engine, with a freshness stamp', async (ctx) => {
    if (!reachable) ctx.skip()
    const r = await fetch(`${BASE}/s/${A.slug}/book/availability?checkIn=${d(20)}&checkOut=${d(22)}&adults=2`)
    expect(r.status).toBe(200)
    expect(r.headers.get('cache-control')).toContain('no-store')
    const j = (await r.json()) as { engine: string; nights: number; offers: unknown[]; freshAt: string }
    expect(j.engine).toBe('clockpms-be-mock')
    expect(j.nights).toBe(2)
    expect(j.offers.length).toBeGreaterThan(0)
    expect(Date.parse(j.freshAt)).toBeGreaterThan(Date.now() - 60_000)
  })

  it('bad searches get a 400 naming the field; sites without an engine get 404', async (ctx) => {
    if (!reachable) ctx.skip()
    const bad = await fetch(`${BASE}/s/${A.slug}/book/availability?checkIn=${d(5)}&checkOut=${d(5)}`)
    expect(bad.status).toBe(400)
    expect(((await bad.json()) as { field: string }).field).toBe('dates')
    expect((await fetch(`${BASE}/s/${B.slug}/book/availability?checkIn=${d(5)}&checkOut=${d(6)}`)).status).toBe(404)
  })

  it('the booking page renders offers and is kept out of search results', async (ctx) => {
    if (!reachable) ctx.skip()
    const r = await fetch(`${BASE}/s/${A.slug}/book?checkIn=${d(20)}&checkOut=${d(22)}&adults=2`)
    expect(r.status).toBe(200)
    const html = await r.text()
    expect(html).toContain('clockPMS BE')
    expect(html).toMatch(/Classic Double|Superior Double/)
    expect(html).toMatch(/<meta[^>]*name="robots"[^>]*noindex/)
  })
})
