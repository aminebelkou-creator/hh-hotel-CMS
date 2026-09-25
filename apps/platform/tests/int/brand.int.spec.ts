/**
 * Phase 3, brand proposal: accent from pixels, readable on the template, template from
 * facts and photo mood; stored on the site and applied only on approval; tenant-bound.
 * Uses seeded tenants 7 and 8 (their photos are cleaned by self-service.int.spec.ts).
 */
import sharp from 'sharp'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { SEED_PASSWORD, tenantEmail, tenantSlug } from '@/seed/constants'
import { applyBrandProposal, chooseTemplate, dominantColour, lightness, proposeBrand, readableAccent, type BrandProposal } from '@/design/propose-brand'
import { contrast } from '@/design/color'
import { TEMPLATES } from '@/design/templates'
import { resolveTheme } from '@/design/theme'
import { setAiForTests } from '@/ai/provider'

const BASE = (process.env.PLATFORM_URL || 'http://localhost:3000').replace(/\/+$/, '')
let reachable = false
let payload: Payload
type T = { tenantId: number; siteId: number; token: string }
let A: T
let B: T
const mediaIds: number[] = []

const load = async (n: number): Promise<T> => {
  const tenant = (await payload.find({ collection: 'tenants', where: { slug: { equals: tenantSlug(n) } }, overrideAccess: true, limit: 1 })).docs[0]
  const site = (await payload.find({ collection: 'sites', where: { tenant: { equals: tenant.id } }, overrideAccess: true, limit: 1 })).docs[0]
  let token = ''
  if (reachable) {
    const r = await fetch(`${BASE}/api/users/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: tenantEmail(n), password: SEED_PASSWORD }) })
    token = ((await r.json()) as { token?: string }).token ?? ''
  }
  return { tenantId: Number(tenant.id), siteId: Number(site.id), token }
}
const auth = (t: T) => ({ authorization: `JWT ${t.token}`, 'content-type': 'application/json' })
const solid = (rgb: [number, number, number], w = 64, h = 64) => sharp({ create: { width: w, height: h, channels: 3, background: { r: rgb[0], g: rgb[1], b: rgb[2] } } }).png().toBuffer()
const reset = async (t: T) => {
  await payload.update({ collection: 'sites', id: t.siteId, data: { brandProposal: null, template: 'maison', brand: { accent: null } } as never, overrideAccess: true })
  await payload.update({ collection: 'facts', where: { and: [{ tenant: { equals: t.tenantId } }, { key: { equals: 'rating.stars' } }] }, data: { value: '3' }, overrideAccess: true })
}

beforeAll(async () => {
  try {
    reachable = (await fetch(`${BASE}/api/users/me`)).status < 500
  } catch {
    reachable = false
  }
  payload = await getPayload({ config })
  A = await load(7)
  B = await load(8)
  await reset(A)
  await reset(B)
})
afterAll(async () => {
  setAiForTests(undefined)
  for (const id of mediaIds) await payload.delete({ collection: 'media', id, overrideAccess: true }).catch(() => null)
  await reset(A)
  await reset(B)
})

describe('colour and template (pure)', () => {
  it('finds the dominant saturated colour and ignores grey', async () => {
    expect(await dominantColour(await solid([200, 30, 40]))).toBe('#c81e28')
    expect(await dominantColour(await solid([128, 128, 128]))).toBeNull()
    expect(await lightness(await solid([250, 250, 250]))).toBeGreaterThan(0.9)
    expect(await lightness(await solid([10, 10, 10]))).toBeLessThan(0.1)
  })

  it('adjusts a pale accent until buttons and links read on every template', () => {
    for (const t of Object.keys(TEMPLATES) as (keyof typeof TEMPLATES)[]) {
      const a = readableAccent('#f5e6a0', t)
      const p = TEMPLATES[t].palette
      expect(contrast(a, p.paper)).toBeGreaterThanOrEqual(3)
      expect(contrast(a, p.tint)).toBeGreaterThanOrEqual(3)
      expect(resolveTheme(t, { accent: a }).issues.filter((i) => /^(text|secondary text) on/.test(i))).toEqual([])
    }
  })

  it('picks the template from stars, words and the photos’ mood', () => {
    expect(chooseTemplate({ stars: 4, keywords: [] }).template).toBe('soiree')
    expect(chooseTemplate({ stars: 2, keywords: ['Hôtel moderne pour familles'] }).template).toBe('atelier')
    expect(chooseTemplate({ keywords: [], photoLightness: 0.2 }).template).toBe('soiree')
    expect(chooseTemplate({ keywords: ['charme'] }).template).toBe('maison')
  })
})

describe('proposeBrand and apply', () => {
  it('proposes from the hotel’s photos and facts, stores it, and applies only on approval', async () => {
    setAiForTests(undefined)
    const png = await solid([30, 90, 160], 300, 200)
    const m = await payload.create({ collection: 'media', data: { tenant: A.tenantId, alt: 'blue wall' } as never, file: { data: png, mimetype: 'image/png', name: 'blue.png', size: png.length }, overrideAccess: true })
    mediaIds.push(Number(m.id))
    // The seeded classification is 3 stars; make it 4 for this test (reset puts it back).
    await payload.update({ collection: 'facts', where: { and: [{ tenant: { equals: A.tenantId } }, { key: { equals: 'rating.stars' } }] }, data: { value: '4' }, overrideAccess: true })
    const p = await proposeBrand(payload, { tenantId: A.tenantId, siteId: A.siteId })
    expect(p.status).toBe('proposed')
    expect(p.sources.accent).toBe('photos')
    expect(p.template).toBe('soiree')
    expect(p.alternatives.map((a) => a.template).sort()).toEqual(['atelier', 'lumiere', 'maison'])
    expect(p.rationale).toBeUndefined()
    const before = await payload.findByID({ collection: 'sites', id: A.siteId, depth: 0, overrideAccess: true })
    expect(before.template).toBe('maison') // nothing applied yet
    expect((before.brandProposal as BrandProposal).accent).toBe(p.accent)
    const applied = await applyBrandProposal(payload, { tenantId: A.tenantId, siteId: A.siteId, template: 'atelier' })
    expect(applied.template).toBe('atelier')
    const after = await payload.findByID({ collection: 'sites', id: A.siteId, depth: 0, overrideAccess: true })
    expect(after.template).toBe('atelier')
    expect(after.brand?.accent).toBe(applied.accent)
    expect((after.brandProposal as BrandProposal).status).toBe('applied')
    await expect(applyBrandProposal(payload, { tenantId: A.tenantId, siteId: A.siteId })).rejects.toThrow(/No proposal/)
  })

  it('the release snapshot indexes platform photos with a srcset from their WebP variants', async () => {
    const { buildSnapshot } = await import('@/releases/snapshot')
    const snap = await buildSnapshot(payload, A.tenantId, A.siteId)
    const m = await payload.findByID({ collection: 'media', id: mediaIds[0], overrideAccess: true })
    const entry = snap.images?.[m.url as string]
    expect(entry).toBeTruthy()
    expect(entry!.w).toBe(300)
    expect(entry!.h).toBe(200)
    expect(entry!.srcset).toMatch(/-400x\d+\.webp 400w|\.webp 300w/) // the source is 300 px wide: no enlargement
    // Every variant URL points at the same entry, and the full-size file is the largest.
    const thumb = (m.sizes as { thumb?: { url?: string | null } })?.thumb?.url
    if (thumb) expect(snap.images?.[thumb]).toEqual(entry)
    expect(entry!.full).toBe(m.url)
  })

  it('adds a rationale when a model is configured', async () => {
    setAiForTests({ name: 'openai', available: true, model: 'scripted', complete: async () => 'Un choix sobre pour une maison quatre étoiles.' })
    const p = await proposeBrand(payload, { tenantId: A.tenantId, siteId: A.siteId })
    setAiForTests(undefined)
    expect(p.rationale).toContain('quatre étoiles')
  })

  it('is tenant-bound: B’s site cannot be proposed or applied under A, and photos of A never colour B', async () => {
    await expect(proposeBrand(payload, { tenantId: A.tenantId, siteId: B.siteId })).rejects.toThrow(/not found in tenant/)
    const pb = await proposeBrand(payload, { tenantId: B.tenantId, siteId: B.siteId })
    expect(pb.sources.accent).toBe('template') // B has no photos and no logo
    expect(pb.template).toBe('maison')
  })

  it('over HTTP: propose and apply only on one’s own site', async (ctx) => {
    if (!reachable) ctx.skip()
    expect((await fetch(`${BASE}/api/sites/${A.siteId}/propose-brand`, { method: 'POST', headers: auth(B) })).status).toBe(404)
    const own = await fetch(`${BASE}/api/sites/${A.siteId}/propose-brand`, { method: 'POST', headers: auth(A) })
    expect(own.status).toBe(200)
    const cross = await fetch(`${BASE}/api/sites/${A.siteId}/apply-brand`, { method: 'POST', headers: auth(B), body: '{}' })
    expect(cross.status).toBe(404)
    const apply = await fetch(`${BASE}/api/sites/${A.siteId}/apply-brand`, { method: 'POST', headers: auth(A), body: '{}' })
    expect(apply.status).toBe(200)
  })
})
