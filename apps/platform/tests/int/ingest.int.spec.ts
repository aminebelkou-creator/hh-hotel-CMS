/**
 * Phase 3, ingest v1: deterministic extraction, the chunked crawler on an in-memory site,
 * the in-product pipeline writing unconfirmed facts under the right tenant, and the
 * endpoints' access checks over HTTP (PLATFORM_URL; skipped when unreachable).
 * Uses seeded tenants 5 and 6.
 */
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { SEED_PASSWORD, tenantEmail, tenantSlug } from '@/seed/constants'
import { auditOf, crawlChunk, extractPage, initCrawl, isCrawlableUrl, setFetcherForTests, type Fetcher } from '@/ingest/crawl'
import { runCrawlChunk, startCrawl } from '@/ingest/run'
import { proposeFactsWithAi } from '@/ingest/extract-ai'
import { setAiForTests } from '@/ai/provider'
import type { CrawledPage } from '@/ingest/crawl'

const BASE = (process.env.PLATFORM_URL || 'http://localhost:3000').replace(/\/+$/, '')
let reachable = false
let payload: Payload
type T = { tenantId: number; siteId: number; slug: string; token: string }
let A: T
let B: T

const SITE: Record<string, string> = {
  'https://hotel.example.test/robots.txt': 'User-agent: *\nDisallow: /admin\nSitemap: https://hotel.example.test/sitemap.xml\n',
  'https://hotel.example.test/sitemap.xml': '<urlset><url><loc>https://hotel.example.test/</loc></url><url><loc>https://hotel.example.test/rooms</loc></url><url><loc>https://hotel.example.test/admin/secret</loc></url></urlset>',
  'https://hotel.example.test/': `<html lang="fr"><head><title>Hôtel Test</title><meta name="description" content="Un petit hôtel de test."><meta property="og:site_name" content="Hôtel Test">
    <script type="application/ld+json">{"@type":"Hotel","name":"Hôtel Test","telephone":"+33 1 23 45 67 89","email":"hello@hotel.example.test","address":{"streetAddress":"1 rue de Test","postalCode":"75001","addressLocality":"Paris","addressCountry":"FR"},"checkinTime":"15:00","checkoutTime":"11:00","starRating":{"ratingValue":"3"}}</script></head>
    <body><main><h1>Bienvenue à l'Hôtel Test</h1><p>Wifi gratuit et petit-déjeuner servi de 7h à 10h. Arrivée à partir de 15h00, départ avant 11h00.</p><a href="tel:+33123456789">Appelez-nous</a><a href="/rooms">Nos chambres</a><a href="/contact">Contact</a></main></body></html>`,
  'https://hotel.example.test/rooms': `<html lang="fr"><head><title>Chambres</title></head><body><main><h1>Nos chambres</h1><h2>Chambre Double</h2><p>Une chambre de 18 m² avec lit double.</p><h2>Suite Familiale</h2><p>Pour 4 personnes.</p><a href="https://secure-hotel-booking.example/book">Réserver</a></main></body></html>`,
  'https://hotel.example.test/contact': `<html lang="fr"><head><title>Contact</title></head><body><main><h1>Contact</h1><p>Écrivez à contact@hotel.example.test ou au 01 23 45 67 89.</p></main></body></html>`,
}
const fakeFetch: Fetcher = async (u) => {
  const body = SITE[u]
  if (body === undefined) return { status: 404, type: 'text/html', text: '', url: u }
  return { status: 200, type: u.endsWith('.txt') ? 'text/plain' : u.endsWith('.xml') ? 'application/xml' : 'text/html; charset=utf-8', text: body, url: u }
}

const load = async (n: number): Promise<T> => {
  const tenant = (await payload.find({ collection: 'tenants', where: { slug: { equals: tenantSlug(n) } }, overrideAccess: true, limit: 1 })).docs[0]
  const site = (await payload.find({ collection: 'sites', where: { tenant: { equals: tenant.id } }, overrideAccess: true, limit: 1 })).docs[0]
  let token = ''
  if (reachable) {
    const r = await fetch(`${BASE}/api/users/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: tenantEmail(n), password: SEED_PASSWORD }) })
    token = ((await r.json()) as { token?: string }).token ?? ''
  }
  return { tenantId: Number(tenant.id), siteId: Number(site.id), slug: site.slug, token }
}
const auth = (t: T) => ({ authorization: `JWT ${t.token}`, 'content-type': 'application/json' })
const cleanup = async (t: T) => {
  await payload.delete({ collection: 'crawls', where: { tenant: { equals: t.tenantId } }, overrideAccess: true })
  // The seeded classification (rating.stars = 3, confirmed) also appears in the fake site's JSON-LD: a
  // re-import merges into it. Put it back as seeded; delete everything else the import created.
  await payload.update({ collection: 'facts', where: { and: [{ tenant: { equals: t.tenantId } }, { decisionNote: { equals: 'seed' } }] }, data: { source: null, occurrences: 1, evidence: [] } as never, overrideAccess: true })
  await payload.delete({ collection: 'facts', where: { and: [{ tenant: { equals: t.tenantId } }, { source: { like: 'hotel.example.test' } }, { decisionNote: { not_equals: 'seed' } }] }, overrideAccess: true })
}

beforeAll(async () => {
  try {
    reachable = (await fetch(`${BASE}/api/users/me`)).status < 500
  } catch {
    reachable = false
  }
  payload = await getPayload({ config })
  A = await load(5)
  B = await load(6)
  await cleanup(A)
  await cleanup(B)
})
afterAll(async () => {
  setFetcherForTests(undefined)
  setAiForTests(undefined)
  await cleanup(A)
  await cleanup(B)
})

describe('deterministic extraction', () => {
  it('reads structured data, links, meta and text patterns with their source', () => {
    const { page, facts } = extractPage(SITE['https://hotel.example.test/'], 'https://hotel.example.test/', { first: true, host: 'hotel.example.test' })
    const get = (k: string) => facts.filter((f) => f.key === k).map((f) => f.value)
    expect(page.title).toBe('Hôtel Test')
    expect(page.h1).toContain('Bienvenue')
    expect(get('business.name')).toContain('Hôtel Test')
    expect(get('contact.phone')).toEqual(expect.arrayContaining(['+33 1 23 45 67 89', '+33123456789']))
    expect(get('policy.checkout')).toContain('11:00')
    expect(get('policy.checkin')).toContain('15:00')
    expect(get('rating.stars')).toContain('3')
    expect(get('address')[0]).toContain('75001')
    expect(get('amenity')).toEqual(expect.arrayContaining(['wifi', 'breakfast']))
    expect(get('site.description')).toContain('Un petit hôtel de test.')
    expect(facts.every((f) => f.source === 'https://hotel.example.test/' && f.status === 'unconfirmed')).toBe(true)
  })

  it('refuses private, local and odd addresses', () => {
    for (const bad of ['http://localhost:3000', 'http://127.0.0.1/', 'http://10.1.2.3/', 'http://192.168.1.1/', 'http://172.20.0.1/', 'ftp://hotel.example.test', 'http://hotel', 'http://user:pw@hotel.example.test', 'http://hotel.example.test:8080']) {
      expect(isCrawlableUrl(bad), bad).toBe(false)
    }
    expect(isCrawlableUrl('https://www.hotel-example.fr/')).toBe(true)
  })
})

describe('chunked crawl', () => {
  it('reads robots and the sitemap, skips disallowed paths, follows links, stops at the budget', async () => {
    const state = await initCrawl('https://hotel.example.test/', fakeFetch)
    expect(state.queue[0]).toBe('https://hotel.example.test/')
    expect(state.disallow).toEqual(['/admin'])
    const first = await crawlChunk(state, { maxPages: 1, budgetMs: 5000, delayMs: 0 }, fakeFetch)
    expect(first.pages.map((p) => p.url)).toEqual(['https://hotel.example.test/'])
    expect(state.queue).toContain('https://hotel.example.test/contact') // found by link, not in the sitemap
    const rest = await crawlChunk(state, { maxPages: 10, budgetMs: 5000, delayMs: 0 }, fakeFetch)
    expect(state.pages.map((p) => p.url).sort()).toEqual(['https://hotel.example.test/', 'https://hotel.example.test/contact', 'https://hotel.example.test/rooms'])
    expect(state.done).not.toContain('https://hotel.example.test/admin/secret')
    expect(rest.facts.map((f) => f.key)).toContain('room.name')
    expect(state.facts.filter((f) => f.key === 'booking.engine').map((f) => f.value)).toContain('secure-hotel-booking.example')
    const audit = auditOf(state)
    expect(audit.pagesCrawled).toBe(3)
    expect(audit.pagesWithJsonLd).toBe(1)
    expect(audit.factsByKey['contact.phone']).toBeGreaterThanOrEqual(1)
  })

  it('without a model, the AI pass proposes nothing and says so', async () => {
    setAiForTests(undefined)
    const r = await proposeFactsWithAi([{ url: 'x', status: 200, words: 100, text: 'text', title: '', lang: '', h1: '', jsonld: 0, images: 0, headings: [] } as CrawledPage])
    expect(r.used).toBe(false)
    expect(r.facts).toEqual([])
  })

  it('with a (scripted) model, only allowed keys become facts, with method agent', async () => {
    setAiForTests({
      name: 'openai',
      available: true,
      model: 'scripted',
      complete: async () => ({ facts: [{ key: 'room.size', value: '18 m²', room: 'Chambre Double' }, { key: 'policy.pets', value: 'Small dogs welcome' }, { key: 'made.up', value: 'x' }] }),
    })
    const r = await proposeFactsWithAi([{ url: 'https://hotel.example.test/rooms', status: 200, words: 100, text: 'text', title: '', lang: '', h1: '', jsonld: 0, images: 0, headings: [] } as CrawledPage])
    setAiForTests(undefined)
    expect(r.used).toBe(true)
    expect(r.facts).toEqual([
      { key: 'room.size', value: 'Chambre Double: 18 m²', source: 'https://hotel.example.test/rooms', method: 'agent', confidence: 0.6, status: 'unconfirmed' },
      { key: 'policy.pets', value: 'Small dogs welcome', source: 'https://hotel.example.test/rooms', method: 'agent', confidence: 0.6, status: 'unconfirmed' },
    ])
  })
})

describe('in-product pipeline', () => {
  it('writes unconfirmed facts under the tenant, chunk by chunk, and finishes', async () => {
    setFetcherForTests(fakeFetch)
    const crawl = await startCrawl(payload, { tenantId: A.tenantId, siteId: A.siteId, url: 'https://hotel.example.test/', maxPages: 10, by: 'test' })
    const one = await runCrawlChunk(payload, { tenantId: A.tenantId, crawlId: Number(crawl.id) }, { maxPages: 1, budgetMs: 5000, delayMs: 0 })
    expect(one.status).toBe('running')
    expect(one.pagesCrawled).toBe(1)
    const two = await runCrawlChunk(payload, { tenantId: A.tenantId, crawlId: Number(crawl.id) }, { maxPages: 10, budgetMs: 5000, delayMs: 0 })
    expect(two.status).toBe('done')
    expect(two.pagesCrawled).toBe(3)
    setFetcherForTests(undefined)
    const facts = await payload.find({ collection: 'facts', where: { and: [{ tenant: { equals: A.tenantId } }, { source: { like: 'hotel.example.test' } }] }, limit: 200, overrideAccess: true })
    expect(facts.docs.length).toBeGreaterThan(8)
    // Everything new is unconfirmed; the seeded classification the site also states keeps its decision.
    expect(facts.docs.filter((f) => f.decisionNote !== 'seed').every((f) => f.status === 'unconfirmed')).toBe(true)
    expect(facts.docs.find((f) => f.key === 'rating.stars')?.status).toBe('confirmed')
    expect(facts.docs.find((f) => f.key === 'contact.phone')?.value).toBe('+33123456789') // normalised to E.164
    expect(facts.docs.find((f) => f.key === 'policy.checkout')?.value).toBe('11:00')
    const phone = facts.docs.find((f) => f.key === 'contact.phone')
    expect(phone?.occurrences).toBeGreaterThanOrEqual(2) // JSON-LD, tel: link and text agree
    const inB = await payload.count({ collection: 'facts', where: { and: [{ tenant: { equals: B.tenantId } }, { source: { like: 'hotel.example.test' } }] }, overrideAccess: true })
    expect(inB.totalDocs).toBe(0)
    const done = await payload.findByID({ collection: 'crawls', id: crawl.id, overrideAccess: true })
    expect(done.status).toBe('done')
    expect((done.aiPass as { used: boolean }).used).toBe(false)
    expect((done.audit as { pagesCrawled: number }).pagesCrawled).toBe(3)
  })

  it('a crawl queued for tenant A cannot be run under tenant B', async () => {
    const crawl = await startCrawl(payload, { tenantId: A.tenantId, siteId: A.siteId, url: 'https://hotel.example.test/', by: 'test' })
    await expect(runCrawlChunk(payload, { tenantId: B.tenantId, crawlId: Number(crawl.id) })).rejects.toThrow(/not found in tenant/)
  })

  it('a re-import keeps the decision the business took', async () => {
    setFetcherForTests(fakeFetch)
    const phone = (await payload.find({ collection: 'facts', where: { and: [{ tenant: { equals: A.tenantId } }, { key: { equals: 'contact.phone' } }, { source: { like: 'hotel.example.test' } }] }, limit: 1, overrideAccess: true })).docs[0]
    await payload.update({ collection: 'facts', id: phone.id, data: { status: 'confirmed' }, overrideAccess: true })
    const crawl = await startCrawl(payload, { tenantId: A.tenantId, siteId: A.siteId, url: 'https://hotel.example.test/', maxPages: 3, by: 'test' })
    await runCrawlChunk(payload, { tenantId: A.tenantId, crawlId: Number(crawl.id) }, { maxPages: 10, budgetMs: 5000, delayMs: 0 })
    setFetcherForTests(undefined)
    const again = await payload.findByID({ collection: 'facts', id: phone.id, overrideAccess: true })
    expect(again.status).toBe('confirmed')
  })
})

describe('endpoints over HTTP', () => {
  it('a user starts an import for their own site only; others get 404; bad urls 422', async (ctx) => {
    if (!reachable) ctx.skip()
    const anon = await fetch(`${BASE}/api/sites/${A.siteId}/ingest`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: 'https://hotel.example.test/' }) })
    expect(anon.status).toBe(401)
    const cross = await fetch(`${BASE}/api/sites/${A.siteId}/ingest`, { method: 'POST', headers: auth(B), body: JSON.stringify({ url: 'https://hotel.example.test/' }) })
    expect(cross.status).toBe(404)
    const bad = await fetch(`${BASE}/api/sites/${A.siteId}/ingest`, { method: 'POST', headers: auth(A), body: JSON.stringify({ url: 'http://localhost:3000/' }) })
    expect(bad.status).toBe(422)
    // A real address that does not resolve: the crawl runs, records a failed fetch and finishes.
    const own = await fetch(`${BASE}/api/sites/${A.siteId}/ingest`, { method: 'POST', headers: auth(A), body: JSON.stringify({ url: 'https://does-not-exist.hotel.example.invalid/', maxPages: 1 }) })
    expect([200, 502]).toContain(own.status)
    const body = (await own.json()) as { crawlId: number; status: string }
    expect(body.crawlId).toBeTruthy()
    const mine = await fetch(`${BASE}/api/crawls?depth=0`, { headers: auth(A) }).then((r) => r.json() as Promise<{ docs: { tenant: unknown }[] }>)
    expect(mine.docs.length).toBeGreaterThan(0)
    expect(mine.docs.every((d) => Number(d.tenant) === A.tenantId)).toBe(true)
    const theirs = await fetch(`${BASE}/api/crawls/${body.crawlId}/continue`, { method: 'POST', headers: auth(B) })
    expect(theirs.status).toBe(404)
    const fromB = await fetch(`${BASE}/api/crawls?depth=0`, { headers: auth(B) }).then((r) => r.json() as Promise<{ docs: { id: number }[] }>)
    expect(fromB.docs.map((d) => d.id)).not.toContain(body.crawlId)
  })

  it('the review screen is served to signed-in users', async (ctx) => {
    if (!reachable) ctx.skip()
    const r = await fetch(`${BASE}/admin/review/${A.siteId}`, { headers: { authorization: `JWT ${A.token}` } })
    expect(r.status).toBe(200)
    expect(await r.text()).toContain('Review facts')
  })
})
