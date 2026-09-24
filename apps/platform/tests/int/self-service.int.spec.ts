/**
 * Phase 1, hotelier self-service: draft preview, media upload and serving, offers and FAQ
 * rendering. HTTP parts run against a server (PLATFORM_URL) sharing this test's database and
 * are skipped when it is unreachable. Uses seeded tenants 7 and 8.
 */
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { currentOffers } from '@hh/pack-hotel'
import { SEED_PASSWORD, tenantEmail, tenantSlug } from '@/seed/constants'
import { poolOf } from '@/releases/db'

const BASE = (process.env.PLATFORM_URL || 'http://localhost:3000').replace(/\/+$/, '')
let reachable = false
let payload: Payload
type T = { tenantId: number; siteId: number; slug: string; token: string }
let A: T
let B: T
let draftPageId: number | undefined
const mediaIds: number[] = []

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
const auth = (t: T) => ({ authorization: `JWT ${t.token}` })
const reset = async (t: T) => {
  await poolOf(payload).query(`update sites set current_release_id = null where id = $1`, [t.siteId])
  await payload.delete({ collection: 'releases', where: { site: { equals: t.siteId } }, overrideAccess: true })
}

beforeAll(async () => {
  try {
    reachable = (await fetch(`${BASE}/api/users/me`)).status < 500
  } catch {
    reachable = false
  }
  if (!reachable) return
  payload = await getPayload({ config })
  A = await load(7)
  B = await load(8)
  await reset(A)
})
afterAll(async () => {
  if (!reachable) return
  if (draftPageId) await payload.delete({ collection: 'pages', id: draftPageId, overrideAccess: true }).catch(() => null)
  for (const id of mediaIds) await payload.delete({ collection: 'media', id, overrideAccess: true }).catch(() => null)
  await reset(A)
})

describe('offers', () => {
  it('shows only offers valid today', () => {
    const o = (slug: string, validFrom?: string, validTo?: string) => ({ id: 1, slug, order: 1, title: {}, summary: {}, validFrom, validTo }) as never
    const list = [o('open'), o('past', '2026-01-01', '2026-03-31'), o('future', '2026-12-01'), o('now', '2026-09-01T00:00:00.000Z', '2026-09-30T00:00:00.000Z')]
    expect(currentOffers(list, '2026-09-24').map((x: { slug: string }) => x.slug)).toEqual(['open', 'now'])
    expect(currentOffers(undefined, '2026-09-24')).toEqual([])
  })
})

describe('draft preview', () => {
  const makeDraft = async () => {
    if (draftPageId) return draftPageId
    const page = await payload.create({
      collection: 'pages',
      overrideAccess: true,
      draft: true,
      data: {
        tenant: A.tenantId,
        site: A.siteId,
        slug: 'questions',
        title: 'Questions',
        _status: 'draft',
        blocks: [{ blockType: 'faq', heading: 'Draft FAQ', items: [{ question: 'Is the draft visible?', answer: 'Only in preview.' }] }],
      } as never,
    })
    draftPageId = Number(page.id)
    return draftPageId
  }

  it('sends anonymous visitors to the admin login', async (ctx) => {
    if (!reachable) ctx.skip()
    const id = await makeDraft()
    const r = await fetch(`${BASE}/preview/pages/${id}`, { redirect: 'manual' })
    expect([302, 303, 307, 308]).toContain(r.status)
    expect(r.headers.get('location') ?? '').toContain('/admin/login')
  })

  it('shows the owner their unpublished page, never indexed', async (ctx) => {
    if (!reachable) ctx.skip()
    const id = await makeDraft()
    const r = await fetch(`${BASE}/preview/pages/${id}`, { headers: auth(A) })
    expect(r.status).toBe(200)
    const html = await r.text()
    expect(html).toContain('Is the draft visible?')
    expect(html).toMatch(/<meta name="robots" content="noindex/)
    // Still a draft: the public site does not serve it.
    expect((await fetch(`${BASE}/s/${A.slug}/questions`)).status).toBe(404)
  })

  it('answers 404 to another tenant', async (ctx) => {
    if (!reachable) ctx.skip()
    const id = await makeDraft()
    expect((await fetch(`${BASE}/preview/pages/${id}`, { headers: auth(B) })).status).toBe(404)
  })

  it('once published, the FAQ renders with FAQPage structured data', async (ctx) => {
    if (!reachable) ctx.skip()
    const id = await makeDraft()
    await payload.update({ collection: 'pages', id, data: { _status: 'published' } as never, overrideAccess: true })
    const pub = await fetch(`${BASE}/api/sites/${A.siteId}/publish`, { method: 'POST', headers: auth(A) })
    expect(pub.status).toBe(200)
    const html = await (await fetch(`${BASE}/s/${A.slug}/questions`)).text()
    expect(html).toContain('Only in preview.')
    const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]) as { '@type': string })
    expect(ld.map((d) => d['@type'])).toContain('FAQPage')
  })
})

describe('media', () => {
  const upload = async (t: T, name: string) => {
    const png = await sharp({ create: { width: 1200, height: 800, channels: 3, background: '#b0413e' } }).png().toBuffer()
    const form = new FormData()
    form.append('file', new Blob([new Uint8Array(png)], { type: 'image/png' }), name)
    form.append('_payload', JSON.stringify({ alt: 'Test photo', tenant: t.tenantId }))
    const r = await fetch(`${BASE}/api/media`, { method: 'POST', headers: auth(t), body: form })
    const j = (await r.json()) as { doc?: { id: number; url: string; filename: string; sizes?: Record<string, { url?: string | null }> }; errors?: unknown }
    if (j.doc) mediaIds.push(Number(j.doc.id))
    return { status: r.status, doc: j.doc, errors: j.errors }
  }

  it('an owner uploads a photo: WebP variants are served publicly', async (ctx) => {
    if (!reachable) ctx.skip()
    const { status, doc } = await upload(A, 'room.png')
    expect(status).toBe(201)
    expect(doc!.url).toMatch(/^\/media\/[0-9a-f]{8}-room/)
    const card = doc!.sizes?.card?.url
    expect(card).toBeTruthy()
    const img = await fetch(`${BASE}${card}`)
    expect(img.status).toBe(200)
    expect(img.headers.get('content-type')).toBe('image/webp')
    expect(img.headers.get('cache-control')).toContain('immutable')
  })

  it('refuses a photo without alt text', async (ctx) => {
    if (!reachable) ctx.skip()
    const png = await sharp({ create: { width: 10, height: 10, channels: 3, background: '#000' } }).png().toBuffer()
    const form = new FormData()
    form.append('file', new Blob([new Uint8Array(png)], { type: 'image/png' }), 'noalt.png')
    form.append('_payload', JSON.stringify({ tenant: A.tenantId }))
    expect((await fetch(`${BASE}/api/media`, { method: 'POST', headers: auth(A), body: form })).status).toBe(400)
  })

  it('two hotels uploading the same file name never share a stored file', async (ctx) => {
    if (!reachable) ctx.skip()
    const a = await upload(A, 'same.png')
    const b = await upload(B, 'same.png')
    expect(a.doc!.url).not.toBe(b.doc!.url)
    const n = await poolOf(payload).query(`select count(*)::int as n from media_blobs where key in ($1, $2)`, [a.doc!.filename, b.doc!.filename])
    expect(n.rows[0].n).toBe(2)
  })

  it('another tenant cannot delete the photo; deleting it removes the stored files', async (ctx) => {
    if (!reachable) ctx.skip()
    const { doc } = await upload(A, 'gone.png')
    expect([403, 404]).toContain((await fetch(`${BASE}/api/media/${doc!.id}`, { method: 'DELETE', headers: auth(B) })).status)
    expect((await fetch(`${BASE}${doc!.url}`)).status).toBe(200)
    expect((await fetch(`${BASE}/api/media/${doc!.id}`, { method: 'DELETE', headers: auth(A) })).status).toBe(200)
    expect((await fetch(`${BASE}${doc!.url}`)).status).toBe(404)
    expect((await fetch(`${BASE}${doc!.sizes!.card!.url}`)).status).toBe(404)
  })

  it('rejects odd keys on the public media route', async (ctx) => {
    if (!reachable) ctx.skip()
    expect((await fetch(`${BASE}/media/..%2F..%2Fetc%2Fpasswd`)).status).toBe(404)
  })
})

describe('templates and brand (design contract)', () => {
  const patchSite = (t: T, data: Record<string, unknown>) =>
    fetch(`${BASE}/api/sites/${t.siteId}`, { method: 'PATCH', headers: { ...auth(t), 'content-type': 'application/json' }, body: JSON.stringify(data) })

  it('an owner switches template and brand; the published site follows, other tenants cannot', async (ctx) => {
    if (!reachable) ctx.skip()
    try {
      expect((await patchSite(A, { template: 'soiree', brand: { accent: '#2f6f8f' } })).status).toBe(200)
      expect((await patchSite(B, {})).status).toBe(200)
      expect([403, 404]).toContain((await fetch(`${BASE}/api/sites/${A.siteId}`, { method: 'PATCH', headers: { ...auth(B), 'content-type': 'application/json' }, body: JSON.stringify({ template: 'atelier' }) })).status)
      expect((await fetch(`${BASE}/api/sites/${A.siteId}/publish`, { method: 'POST', headers: auth(A) })).status).toBe(200)
      const html = await (await fetch(`${BASE}/s/${A.slug}`)).text()
      expect(html).toContain('data-template="soiree"')
      expect(html).toContain('--hh-accent:#2f6f8f')
      expect(html).toContain('--hh-f-playfair')
    } finally {
      await patchSite(A, { template: 'maison', brand: { accent: null, background: null, text: null } })
    }
  })

  it('refuses a text colour too close to the background, with a clear message', async (ctx) => {
    if (!reachable) ctx.skip()
    const r = await patchSite(A, { brand: { background: '#777777', text: '#888888' } })
    expect(r.status).toBe(400)
    expect(await r.text()).toContain('too close to read')
  })
})
