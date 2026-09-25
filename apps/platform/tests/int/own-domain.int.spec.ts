/**
 * Serving a hotel on its own domain (Phase 2). Requests carry a real Host header over raw
 * HTTP to the server under test (PLATFORM_URL); skipped when it is unreachable.
 * Uses seeded tenant 9. Unit part (host rules) always runs.
 */
import http from 'node:http'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { SEED_PASSWORD, tenantEmail, tenantSlug } from '@/seed/constants'
import { poolOf } from '@/releases/db'
import { isPlatformHost, HOSTNAME_RE } from '@/site/hosts'

const BASE = (process.env.PLATFORM_URL || 'http://localhost:3000').replace(/\/+$/, '')
const HOST = 'www.hotel-nine.test'
let reachable = false
let payload: Payload
let siteId = 0
let siteSlug = ''
let tenantId = 0
let token = ''
const domainIds: number[] = []

type Res = { status: number; headers: http.IncomingHttpHeaders; body: string }
const get = (path: string, host: string, headers: Record<string, string> = {}) =>
  new Promise<Res>((resolve, reject) => {
    const u = new URL(BASE)
    const req = http.request(
      { host: u.hostname, port: u.port || 80, path, method: 'GET', headers: { host, ...headers } },
      (res) => {
        let body = ''
        res.setEncoding('utf8')
        res.on('data', (c) => (body += c))
        res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body }))
      },
    )
    req.on('error', reject)
    req.end()
  })
const platformHost = () => new URL(BASE).host

beforeAll(async () => {
  try {
    reachable = (await fetch(`${BASE}/api/users/me`)).status < 500
  } catch {
    reachable = false
  }
  if (!reachable) return
  payload = await getPayload({ config })
  const tenant = (await payload.find({ collection: 'tenants', where: { slug: { equals: tenantSlug(9) } }, overrideAccess: true, limit: 1 })).docs[0]
  tenantId = Number(tenant.id)
  const site = (await payload.find({ collection: 'sites', where: { tenant: { equals: tenant.id } }, overrideAccess: true, limit: 1 })).docs[0]
  siteId = Number(site.id)
  siteSlug = site.slug
  const r = await fetch(`${BASE}/api/users/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: tenantEmail(9), password: SEED_PASSWORD }),
  })
  token = ((await r.json()) as { token?: string }).token ?? ''
  await payload.delete({ collection: 'domains', where: { hostname: { like: 'hotel-nine.test' } }, overrideAccess: true })
  await poolOf(payload).query(`update sites set current_release_id = null where id = $1`, [siteId])
  await payload.delete({ collection: 'releases', where: { site: { equals: siteId } }, overrideAccess: true })
})
afterAll(async () => {
  if (!reachable) return
  await payload.delete({ collection: 'domains', where: { hostname: { like: 'hotel-nine.test' } }, overrideAccess: true })
  await poolOf(payload).query(`update sites set current_release_id = null where id = $1`, [siteId])
  await payload.delete({ collection: 'releases', where: { site: { equals: siteId } }, overrideAccess: true })
})

describe('host rules', () => {
  it('knows the platform hosts and rejects malformed ones', () => {
    expect(isPlatformHost('localhost:3100')).toBe(true)
    expect(isPlatformHost('hh-platform.edgeone.dev')).toBe(true)
    expect(isPlatformHost('www.hotel-example.com')).toBe(false)
    expect(HOSTNAME_RE.test('www.hotel-example.com')).toBe(true)
    expect(HOSTNAME_RE.test('hotel_example.com')).toBe(false)
    expect(HOSTNAME_RE.test('../../admin')).toBe(false)
  })
})

describe('a hotel on its own domain', () => {
  it('an unknown or unverified domain is not served; the platform host still is', async (ctx) => {
    if (!reachable) ctx.skip()
    expect((await get('/', HOST)).status).toBe(404)
    // The owner adds the hostname; it is pending until our team verifies it.
    const r = await fetch(`${BASE}/api/domains`, {
      method: 'POST',
      headers: { authorization: `JWT ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ hostname: 'WWW.Hotel-Nine.test', site: siteId, tenant: tenantId, primary: true }),
    })
    expect(r.status).toBe(201)
    const doc = ((await r.json()) as { doc: { id: number; hostname: string; status: string } }).doc
    domainIds.push(doc.id)
    expect(doc.hostname).toBe(HOST)
    expect(doc.status).toBe('pending')
    // The owner cannot verify their own domain.
    const up = await fetch(`${BASE}/api/domains/${doc.id}`, {
      method: 'PATCH',
      headers: { authorization: `JWT ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'verified' }),
    })
    const after = ((await up.json()) as { doc?: { status: string } }).doc
    expect(after?.status ?? 'pending').toBe('pending')
    expect((await get('/', HOST)).status).toBe(404)
  })

  it('once verified and published, the site answers at / with rooted links and canonical URLs', async (ctx) => {
    if (!reachable) ctx.skip()
    await payload.update({ collection: 'domains', id: domainIds[0], data: { status: 'verified' }, overrideAccess: true })
    expect((await fetch(`${BASE}/api/sites/${siteId}/publish`, { method: 'POST', headers: { authorization: `JWT ${token}` } })).status).toBe(200)
    const home = await get('/', HOST)
    expect(home.status).toBe(200)
    expect(home.body).toContain('data-template=')
    expect(home.body).not.toContain(`/s/${siteSlug}`)
    expect(home.body).toContain(`<link rel="canonical" href="https://${HOST}"/>`)
    expect(home.body).toMatch(new RegExp(`hreflang="fr" href="https://${HOST}/fr"`, 'i'))
    // A localised inner page, and the platform-only paths are closed on this domain.
    expect((await get('/fr/rooms', HOST)).status).toBe(200)
    expect((await get('/admin', HOST)).status).toBe(404)
    expect((await get('/api/users/me', HOST)).status).toBe(404)
    expect((await get(`/s/${siteSlug}`, HOST)).status).toBe(404)
    expect((await get('/h/' + HOST, platformHost())).status).toBe(404)
    expect((await get('/h/' + HOST + '/fr/rooms', platformHost())).status).toBe(404)
    // Sitemap and robots on the domain.
    const sm = await get('/sitemap.xml', HOST)
    expect(sm.status).toBe(200)
    expect(sm.body).toContain(`<loc>https://${HOST}</loc>`)
    expect(sm.body).toContain(`<loc>https://${HOST}/fr/rooms</loc>`)
    expect(sm.body).not.toContain('/s/')
    expect((await get('/robots.txt', HOST)).body).toContain(`Sitemap: https://${HOST}/sitemap.xml`)
  })

  it('the platform copy points its canonical at the primary domain', async (ctx) => {
    if (!reachable) ctx.skip()
    const r = await get(`/s/${siteSlug}`, platformHost())
    expect(r.status).toBe(200)
    expect(r.body).toContain(`<link rel="canonical" href="https://${HOST}"/>`)
  })

  it('the apex redirects to www when only www is registered', async (ctx) => {
    if (!reachable) ctx.skip()
    const r = await get('/fr/rooms', 'hotel-nine.test')
    expect(r.status).toBe(308)
    expect(r.headers.location).toBe(`https://${HOST}/fr/rooms`)
  })

  it("another tenant cannot register a hostname on this hotel's site", async (ctx) => {
    if (!reachable) ctx.skip()
    const other = await fetch(`${BASE}/api/users/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: tenantEmail(10), password: SEED_PASSWORD }),
    })
    const t2 = ((await other.json()) as { token?: string }).token
    const r = await fetch(`${BASE}/api/domains`, {
      method: 'POST',
      headers: { authorization: `JWT ${t2}`, 'content-type': 'application/json' },
      body: JSON.stringify({ hostname: 'evil.hotel-nine.test', site: siteId, tenant: tenantId }),
    })
    expect([400, 403]).toContain(r.status)
  })
})
