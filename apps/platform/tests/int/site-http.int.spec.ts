/**
 * Public site (pages, locales, structured data, sitemap) and publish endpoints, against a running server (PLATFORM_URL)
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
  await poolOf(payload).query(`update sites set current_release_id = null where id = $1`, [t.siteId])
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

describe('public hotel site', () => {
  it('serves every page in every enabled locale, with hreflang alternates', async (ctx) => {
    if (!reachable) ctx.skip()
    const home = await (await fetch(`${BASE}/s/${A.slug}`)).text()
    expect(home).toMatch(new RegExp(`<link rel="alternate" hreflang="fr" href="[^"]*/s/${A.slug}/fr"`, 'i'))
    const fr = await fetch(`${BASE}/s/${A.slug}/fr/rooms`)
    expect(fr.status).toBe(200)
    expect(await fr.text()).toContain('lang="fr"')
    // The default locale has no prefix; naming it explicitly is not a page.
    expect((await fetch(`${BASE}/s/${A.slug}/en/rooms`)).status).toBe(404)
  })

  it('home carries schema.org Hotel structured data from the hotel pack', async (ctx) => {
    if (!reachable) ctx.skip()
    const html = await (await fetch(`${BASE}/s/${A.slug}`)).text()
    const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
    expect(m).not.toBeNull()
    const data = JSON.parse(m![1]) as { '@type': string; containsPlace?: { name: string }[] }
    expect(data['@type']).toBe('Hotel')
    expect(data.containsPlace?.map((r) => r.name)).toContain('Standard room of tenant 5')
  })

  it('publishes a sitemap and robots.txt per site', async (ctx) => {
    if (!reachable) ctx.skip()
    const sm = await fetch(`${BASE}/s/${A.slug}/sitemap.xml`)
    expect(sm.status).toBe(200)
    const xml = await sm.text()
    expect(xml).toContain('<urlset')
    expect(xml).toContain(`/s/${A.slug}/fr/contact`)
    expect(xml).toContain('hreflang="en"')
    const robots = await (await fetch(`${BASE}/s/${A.slug}/robots.txt`)).text()
    expect(robots).toContain(`/s/${A.slug}/sitemap.xml`)
  })

  it('the map is a static image made at publish, never a third-party embed', async (ctx) => {
    if (!reachable) ctx.skip()
    const html = await (await fetch(`${BASE}/s/${A.slug}/contact`)).text()
    expect(html).not.toContain('<iframe')
    // Customer zero (present locally, not in CI) has coordinates and a map block.
    const cz = await fetch(`${BASE}/s/hotel-herse-dor/contact`)
    if (cz.status === 200) {
      const h = await cz.text()
      expect(h).not.toContain('<iframe')
      expect(h).not.toContain('openstreetmap.org/export/embed')
      expect(h).toContain('openstreetmap.org/?mlat=')
      expect(h).toMatch(/src="\/media\/maps\/osm-[0-9.-]+-z16\.webp"/)
      expect(h).toContain('href="https://www.openstreetmap.org/copyright"') // OSM attribution requirement
    }
  })

  it('every response carries the baseline security headers', async (ctx) => {
    if (!reachable) ctx.skip()
    for (const path of [`/s/${A.slug}`, '/admin/login', '/api/users/me']) {
      const h = (await fetch(`${BASE}${path}`)).headers
      expect(h.get('x-content-type-options'), path).toBe('nosniff')
      expect(h.get('referrer-policy'), path).toBe('strict-origin-when-cross-origin')
      expect(h.get('strict-transport-security'), path).toContain('max-age=31536000')
      expect(h.get('x-frame-options'), path).toBe('SAMEORIGIN')
    }
  })

  it('no booking step is served: the platform has no booking logic', async (ctx) => {
    if (!reachable) ctx.skip()
    expect((await fetch(`${BASE}/s/${A.slug}/book`)).status).toBe(404)
  })

  it('renders the structural blocks the templates need (Lumière handoff): stars, booking bar, banners, icons, checklist, band, room facts', async (ctx) => {
    if (!reachable) ctx.skip()
    const home = await (await fetch(`${BASE}/s/${A.slug}`)).text()
    // Stars come from the confirmed classification fact, never from the block.
    expect(home).toContain('<p class="hh-hero-rating"><span class="hh-stars" aria-hidden="true">★★★</span><span>3-star hotel</span></p>')
    // The booking bar is a plain GET form to the site's Book link, with visible labels.
    const form = home.match(/<form class="hh-booking-bar"[^>]*>/)?.[0] ?? ''
    expect(form).toMatch(/action="[^"]*\/s\/site-5\/contact"/)
    expect(form).toContain('method="get"')
    expect(form).toContain('aria-label="Check availability"')
    expect(home).toMatch(/<input id="[^"]+-in" type="date" name="arrival"\/>/)
    expect(home).toMatch(/<select id="[^"]+-n" name="guests">/)
    expect(home).toContain('<section class="hh-section hh-banners">')
    expect(home).toContain('<div class="hh-section-head hh-section-head--center">')
    expect(home).toMatch(/<li class="hh-banner"><a class="hh-banner-inner" href="[^"]*\/s\/site-5\/rooms"><img [^>]+><h3>Rooms<\/h3><\/a><\/li>/)
    expect(home).toContain('<span class="hh-feature-icon"><svg viewBox="0 0 24 24"')
    expect(home).toContain('<ul class="hh-checklist"><li>Free luggage room</li><li>Lift to every floor</li></ul>')
    expect(home).toContain('<div class="hh-section-head hh-section-head--split">')
    expect(home).toMatch(/<a class="hh-link-arrow" href="[^"]*\/s\/site-5\/rooms">See all rooms<\/a>/)
    expect(home).toContain('<ul class="hh-room-facts"><li><svg')
    const fr = await (await fetch(`${BASE}/s/${A.slug}/fr`)).text()
    expect(fr).toContain('Hôtel 3 étoiles')
    expect(fr).toMatch(/<label for="[^"]+-in">Arrivée<\/label>/)
    // Contact one tap away: phone in the header (desktop), sticky Call + Book bar (phones; CSS decides).
    expect(home).toMatch(/<a class="hh-header-phone" href="tel:\+?\d+">/)
    expect(home).toContain('<nav class="hh-sticky-bar" aria-label="Quick actions">')
    expect(home).toMatch(/<a class="hh-sticky-call" href="tel:\+?\d+">Call<\/a>/)
    expect(home).toMatch(/<a class="hh-btn hh-sticky-book" href="[^"]*\/s\/site-5\/contact">Book<\/a>/)
    const rooms = await (await fetch(`${BASE}/s/${A.slug}/rooms`)).text()
    expect(rooms).toContain('<section class="hh-media-band"><img src="data:image/webp;base64,')
    expect(rooms).toContain('alt="The courtyard at dusk"')
    expect(rooms).not.toContain('hh-booking-bar') // only where the hotel switched it on
  })
})
