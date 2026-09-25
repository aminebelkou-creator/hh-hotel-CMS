/**
 * Phase 3, generation: pages and room types drafted from confirmed facts only, generated
 * blocks marked, human edits protected across a second run, nothing published, tenant-bound.
 * Uses seeded tenants 9 and 10 (site-10 is also the quality-gates site: generation only
 * adds drafts there, gates read the published release).
 */
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { SEED_PASSWORD, tenantEmail, tenantSlug } from '@/seed/constants'
import { generateSite, hasUnbackedNumbers, mergeBlocks } from '@/generate/generate'
import { defaultCopy, slugify } from '@/generate/copy'
import { translateSite } from '@/generate/translate'
import { setAiForTests } from '@/ai/provider'

const BASE = (process.env.PLATFORM_URL || 'http://localhost:3000').replace(/\/+$/, '')
let reachable = false
let payload: Payload
type T = { tenantId: number; siteId: number; slug: string; token: string; userId: number }
let A: T
let B: T
const TAG = 'gentest'

const load = async (n: number): Promise<T> => {
  const tenant = (await payload.find({ collection: 'tenants', where: { slug: { equals: tenantSlug(n) } }, overrideAccess: true, limit: 1 })).docs[0]
  const site = (await payload.find({ collection: 'sites', where: { tenant: { equals: tenant.id } }, overrideAccess: true, limit: 1 })).docs[0]
  const user = (await payload.find({ collection: 'users', where: { email: { equals: tenantEmail(n) } }, overrideAccess: true, limit: 1 })).docs[0]
  let token = ''
  if (reachable) {
    const r = await fetch(`${BASE}/api/users/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: tenantEmail(n), password: SEED_PASSWORD }) })
    token = ((await r.json()) as { token?: string }).token ?? ''
  }
  return { tenantId: Number(tenant.id), siteId: Number(site.id), slug: site.slug, token, userId: Number(user.id) }
}
const auth = (t: T) => ({ authorization: `JWT ${t.token}` })

const seedFacts = async (t: T) => {
  const facts: [string, string][] = [
    ['business.name', 'Hôtel Génération'],
    ['rating.stars', '3'],
    ['address', '12 rue des Tests, 75003 Paris, FR'],
    ['contact.phone', '+33123456789'],
    ['policy.checkin', '15:00'],
    ['policy.checkout', '11:00'],
    ['policy.pets', 'Small pets welcome'],
    ['amenity', 'wifi'],
    ['amenity', 'breakfast'],
    ['service', 'Luggage room'],
    ['room.name', 'Chambre Double'],
    ['room.name', 'Suite Familiale'],
    ['room.size', 'Chambre Double: 18 m²'],
    ['room.occupancy', 'Suite Familiale: 4 people'],
    ['room.description', 'Chambre Double: a quiet double room on the courtyard'],
    ['geo.lat', '48.86'],
    ['geo.lon', '2.35'],
  ]
  for (const [key, value] of facts) {
    const doc = await payload.create({ collection: 'facts', data: { tenant: t.tenantId, site: t.siteId, key, value, method: 'manual', confidence: 0.9, decisionNote: TAG } as never, overrideAccess: true })
    await payload.update({ collection: 'facts', id: doc.id, data: { status: 'confirmed' }, overrideAccess: true })
  }
  // An unconfirmed one that must never reach the pages.
  await payload.create({ collection: 'facts', data: { tenant: t.tenantId, site: t.siteId, key: 'service', value: 'Helipad', method: 'agent', confidence: 0.6, decisionNote: TAG } as never, overrideAccess: true })
}
const cleanup = async (t: T) => {
  await payload.delete({ collection: 'facts', where: { and: [{ tenant: { equals: t.tenantId } }, { decisionNote: { equals: TAG } }] }, overrideAccess: true })
  await payload.delete({ collection: 'rooms', where: { and: [{ tenant: { equals: t.tenantId } }, { slug: { in: ['chambre-double', 'suite-familiale'] } }] }, overrideAccess: true })
  await payload.delete({ collection: 'pages', where: { and: [{ tenant: { equals: t.tenantId } }, { slug: { equals: 'services' } }] }, overrideAccess: true })
  // Seeded home/rooms/contact pages: strip the generated slots we added, keep the seed blocks.
  const pages = await payload.find({ collection: 'pages', where: { and: [{ tenant: { equals: t.tenantId } }, { site: { equals: t.siteId } }] }, limit: 20, draft: true, overrideAccess: true })
  for (const p of pages.docs) {
    const blocks = ((p.blocks as { provenance?: { sourceFact?: string | null } | null }[] | undefined) ?? []).filter((b) => !(b.provenance?.sourceFact ?? '').startsWith('gen:'))
    // Republish explicitly: an update after a draft version would otherwise carry the draft's status.
    await payload.update({ collection: 'pages', id: p.id, data: { blocks, _status: 'published' } as never, overrideAccess: true })
  }
}

beforeAll(async () => {
  try {
    reachable = (await fetch(`${BASE}/api/users/me`)).status < 500
  } catch {
    reachable = false
  }
  payload = await getPayload({ config })
  A = await load(9)
  B = await load(10)
  await cleanup(A)
  await cleanup(B)
  await seedFacts(A)
})
afterAll(async () => {
  setAiForTests(undefined)
  await cleanup(A)
  await cleanup(B)
})

describe('copy and merge (pure)', () => {
  it('writes deterministic copy from facts in the site language', () => {
    const f = new Map([['rating.stars', ['4']], ['address', ['1 rue X, 75001 Paris, FR']], ['amenity', ['wifi', 'pets']]])
    const fr = defaultCopy(f, 'fr', 'Hôtel Test')
    expect(fr.home.subheading).toBe('Hôtel 4 étoiles à Paris')
    expect(fr.services.intro).toContain('wi-fi gratuit')
    const en = defaultCopy(f, 'en', 'Hotel Test')
    expect(en.home.subheading).toBe('4-star hotel in Paris')
  })

  it('refuses model prose with numbers no fact backs', () => {
    const f = new Map([['policy.checkout', ['11:00']]])
    expect(hasUnbackedNumbers('Check-out at 11', f)).toBe(false)
    expect(hasUnbackedNumbers('Only 200 m from the beach', f)).toBe(true)
  })

  it('merges slots: replaces generated, keeps human and locked, appends new', () => {
    const g = (slot: string, heading: string, origin = 'generated') => ({ blockType: 'text', heading, provenance: { origin, sourceFact: slot } })
    const existing = [g('gen:home:hero', 'old hero'), g('gen:home:about', 'my own words', 'human'), { blockType: 'quote', text: 'guest' }, g('gen:home:cta', 'x', 'locked')]
    const generated = [g('gen:home:hero', 'new hero'), g('gen:home:about', 'new about'), g('gen:home:cta', 'new cta'), g('gen:home:features', 'features')]
    const r = mergeBlocks(existing as never, generated as never)
    expect(r.blocks.map((b) => (b as { heading?: string }).heading ?? (b as { blockType: string }).blockType)).toEqual(['new hero', 'my own words', 'quote', 'x', 'features'])
    expect(r.generated).toBe(2)
    expect(r.kept).toBe(3)
  })

  it('slugifies room names', () => {
    expect(slugify('Chambre Supérieure Vue Jardin')).toBe('chambre-superieure-vue-jardin')
  })
})

describe('generateSite', () => {
  it('drafts pages and room types from confirmed facts only, without publishing', async () => {
    setAiForTests(undefined)
    const r = await generateSite(payload, { tenantId: A.tenantId, siteId: A.siteId, by: 'test' })
    expect(r.model).toBeNull()
    expect(r.rooms).toEqual({ created: 2, kept: 0 })
    expect(r.pages.map((p) => p.slug)).toEqual(['home', 'rooms', 'services', 'contact'])
    expect(r.pages.find((p) => p.slug === 'services')?.created).toBe(true)
    const rooms = await payload.find({ collection: 'rooms', where: { and: [{ tenant: { equals: A.tenantId } }, { slug: { in: ['chambre-double', 'suite-familiale'] } }] }, overrideAccess: true })
    const dbl = rooms.docs.find((x) => x.slug === 'chambre-double')
    expect(dbl?.sizeSqm).toBe(18)
    expect(dbl?.description).toContain('quiet double room')
    expect(rooms.docs.find((x) => x.slug === 'suite-familiale')?.maxOccupancy).toBe(4)
    const services = (await payload.find({ collection: 'pages', where: { and: [{ tenant: { equals: A.tenantId } }, { slug: { equals: 'services' } }] }, draft: true, limit: 1, overrideAccess: true })).docs[0]
    expect(services._status).toBe('draft')
    const json = JSON.stringify(services.blocks)
    expect(json).toContain('Luggage room')
    expect(json).toContain('Small pets welcome')
    expect(json).not.toContain('Helipad') // unconfirmed never reaches a page
    expect((services.blocks ?? []).every((b) => (b as { provenance?: { origin?: string } }).provenance?.origin === 'generated')).toBe(true)
    const home = (await payload.find({ collection: 'pages', where: { and: [{ tenant: { equals: A.tenantId } }, { site: { equals: A.siteId } }, { slug: { equals: 'home' } }] }, draft: true, limit: 1, overrideAccess: true })).docs[0]
    // The seeded hero (no gen slot) stays first; generated slots follow.
    expect((home.blocks?.[0] as { heading?: string }).heading).toContain('Welcome to tenant')
    expect(JSON.stringify(home.blocks)).toContain('gen:home:hero')
    const contact = (await payload.find({ collection: 'pages', where: { and: [{ tenant: { equals: A.tenantId } }, { site: { equals: A.siteId } }, { slug: { equals: 'contact' } }] }, draft: true, limit: 1, overrideAccess: true })).docs[0]
    expect((contact.blocks ?? []).some((b) => b.blockType === 'map')).toBe(true)
    // Nothing published: the site has no release.
    const site = await payload.findByID({ collection: 'sites', id: A.siteId, depth: 0, overrideAccess: true })
    expect(site.currentRelease ?? null).toBeNull()
  })

  it('a second run rewrites generated slots, keeps a person’s edit, creates no duplicate rooms', async () => {
    const services = (await payload.find({ collection: 'pages', where: { and: [{ tenant: { equals: A.tenantId } }, { slug: { equals: 'services' } }] }, draft: true, limit: 1, overrideAccess: true })).docs[0]
    const user = await payload.findByID({ collection: 'users', id: A.userId, overrideAccess: true })
    // The hotelier rewrites the hero through the API as themselves: the hook marks it human.
    const blocks = (services.blocks as Record<string, unknown>[]).map((b) => (b.blockType === 'hero' ? { ...b, subheading: 'Our services, in our words' } : b))
    await payload.update({ collection: 'pages', id: services.id, data: { blocks } as never, user, overrideAccess: false, draft: true })
    const r = await generateSite(payload, { tenantId: A.tenantId, siteId: A.siteId, by: 'test' })
    expect(r.rooms).toEqual({ created: 0, kept: 2 })
    const again = (await payload.find({ collection: 'pages', where: { and: [{ tenant: { equals: A.tenantId } }, { slug: { equals: 'services' } }] }, draft: true, limit: 1, overrideAccess: true })).docs[0]
    const hero = (again.blocks as { blockType: string; subheading?: string; provenance?: { origin?: string } }[]).find((b) => b.blockType === 'hero')
    expect(hero?.subheading).toBe('Our services, in our words')
    expect(hero?.provenance?.origin).toBe('human')
    expect(r.pages.find((p) => p.slug === 'services')?.kept).toBe(1)
  })

  it('uses a model’s copy when one is configured, but drops prose with unbacked numbers', async () => {
    setAiForTests({
      name: 'openai',
      available: true,
      model: 'scripted',
      complete: async () => ({ home: { about: 'A calm 3-star house in Paris, five minutes from the metro.', heading: 'Only 200 m from the Louvre' }, services: { intro: 'Wi-Fi and breakfast, every day.' } }),
    })
    const r = await generateSite(payload, { tenantId: A.tenantId, siteId: A.siteId, by: 'test' })
    setAiForTests(undefined)
    expect(r.model).toBe('scripted')
    const home = (await payload.find({ collection: 'pages', where: { and: [{ tenant: { equals: A.tenantId } }, { site: { equals: A.siteId } }, { slug: { equals: 'home' } }] }, draft: true, limit: 1, overrideAccess: true })).docs[0]
    const json = JSON.stringify(home.blocks)
    expect(json).toContain('A calm 3-star house in Paris')
    expect(json).not.toContain('200 m from the Louvre')
  })

  it('is bound to the tenant: B’s site cannot be generated under A', async () => {
    await expect(generateSite(payload, { tenantId: A.tenantId, siteId: B.siteId, by: 'test' })).rejects.toThrow(/not found in tenant/)
    const inB = await payload.count({ collection: 'rooms', where: { and: [{ tenant: { equals: B.tenantId } }, { slug: { in: ['chambre-double', 'suite-familiale'] } }] }, overrideAccess: true })
    expect(inB.totalDocs).toBe(0)
  })

  it('over HTTP: a user generates their own site only', async (ctx) => {
    if (!reachable) ctx.skip()
    const cross = await fetch(`${BASE}/api/sites/${A.siteId}/generate`, { method: 'POST', headers: auth(B) })
    expect(cross.status).toBe(404)
    const own = await fetch(`${BASE}/api/sites/${A.siteId}/generate`, { method: 'POST', headers: auth(A) })
    expect(own.status).toBe(200)
    const body = (await own.json()) as { pages: { slug: string }[] }
    expect(body.pages).toHaveLength(4)
  })
})

describe('translateSite', () => {
  it('without a model, writes nothing and says so', async () => {
    setAiForTests(undefined)
    const r = await translateSite(payload, { tenantId: A.tenantId, siteId: A.siteId, to: 'fr', by: 'test' })
    expect(r.model).toBeNull()
    expect(r.pages).toBe(0)
    expect(r.skipped[0]).toContain('no model')
  })

  it('with a model, fills the target locale of generated blocks and rooms, keeps a person’s own translation', async () => {
    // A person already translated the services hero subheading (the block is theirs since the edit above).
    const services = (await payload.find({ collection: 'pages', where: { and: [{ tenant: { equals: A.tenantId } }, { slug: { equals: 'services' } }] }, draft: true, limit: 1, overrideAccess: true })).docs[0]
    const frBlocks = (services.blocks as Record<string, unknown>[]).map((b) => (b.blockType === 'hero' ? { ...b, subheading: 'Nos services, avec nos mots' } : b))
    await payload.update({ collection: 'pages', id: services.id, locale: 'fr', draft: true, data: { blocks: frBlocks } as never, overrideAccess: true })
    setAiForTests({ name: 'openai', available: true, model: 'scripted', complete: async (req) => ({ t: (JSON.parse(req.prompt.slice(req.prompt.indexOf('{'))) as { s: string[] }).s.map((x) => `FR(${x})`) }) })
    const r = await translateSite(payload, { tenantId: A.tenantId, siteId: A.siteId, to: 'fr', by: 'test' })
    setAiForTests(undefined)
    expect(r.model).toBe('scripted')
    expect(r.pages).toBeGreaterThanOrEqual(1)
    expect(r.rooms).toBeGreaterThanOrEqual(2) // the two generated ones (plus the seeded room)
    const fr = (await payload.find({ collection: 'pages', where: { and: [{ tenant: { equals: A.tenantId } }, { slug: { equals: 'services' } }] }, draft: true, limit: 1, locale: 'fr', overrideAccess: true })).docs[0]
    const blocks = fr.blocks as { blockType: string; subheading?: string; heading?: string; items?: { title?: string; text?: string }[] }[]
    expect(blocks.find((b) => b.blockType === 'hero')?.subheading).toBe('Nos services, avec nos mots') // human text kept
    expect(blocks.find((b) => b.blockType === 'policies')?.items?.[0]?.text).toMatch(/^FR\(/) // generated block translated
    const en = (await payload.find({ collection: 'pages', where: { and: [{ tenant: { equals: A.tenantId } }, { slug: { equals: 'services' } }] }, draft: true, limit: 1, locale: 'en', overrideAccess: true })).docs[0]
    expect(JSON.stringify(en.blocks)).not.toContain('FR(') // the source locale is untouched
    const room = (await payload.find({ collection: 'rooms', where: { and: [{ tenant: { equals: A.tenantId } }, { slug: { equals: 'chambre-double' } }] }, limit: 1, locale: 'fr', overrideAccess: true })).docs[0]
    expect(room.description).toMatch(/^FR\(/)
  })

  it('refuses a locale the site has not enabled, and the same locale twice', async () => {
    setAiForTests({ name: 'openai', available: true, model: 'scripted', complete: async () => ({ t: [] }) })
    await expect(translateSite(payload, { tenantId: A.tenantId, siteId: A.siteId, to: 'de', by: 'test' })).rejects.toThrow(/not enabled/)
    await expect(translateSite(payload, { tenantId: A.tenantId, siteId: A.siteId, to: 'en', by: 'test' })).rejects.toThrow(/same/)
    setAiForTests(undefined)
  })
})
