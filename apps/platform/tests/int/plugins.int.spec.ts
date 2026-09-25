/**
 * Adopted Payload plugins (docs/12 §3): SEO metadata per page, redirects from old-site URLs,
 * contact forms with tenant-stamped submissions. HTTP parts need PLATFORM_URL; uses tenants 3 and 4.
 */
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { SEED_PASSWORD, tenantEmail, tenantSlug } from '@/seed/constants'
import { poolOf } from '@/releases/db'

const BASE = (process.env.PLATFORM_URL || 'http://localhost:3000').replace(/\/+$/, '')
let reachable = false
let payload: Payload
type T = { tenantId: number; siteId: number; slug: string; token: string; pageId: number }
let A: T
let B: T
const created: { collection: 'redirects' | 'forms' | 'form-submissions' | 'pages'; id: number }[] = []

const load = async (n: number): Promise<T> => {
  const tenant = (await payload.find({ collection: 'tenants', where: { slug: { equals: tenantSlug(n) } }, overrideAccess: true, limit: 1 })).docs[0]
  const site = (await payload.find({ collection: 'sites', where: { tenant: { equals: tenant.id } }, overrideAccess: true, limit: 1 })).docs[0]
  const page = (await payload.find({ collection: 'pages', where: { and: [{ site: { equals: site.id } }, { slug: { equals: 'contact' } }] }, overrideAccess: true, limit: 1 })).docs[0]
  const r = await fetch(`${BASE}/api/users/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: tenantEmail(n), password: SEED_PASSWORD }) })
  const j = (await r.json()) as { token?: string }
  if (!j.token) throw new Error('login failed')
  return { tenantId: Number(tenant.id), siteId: Number(site.id), slug: site.slug, token: j.token, pageId: Number(page.id) }
}
const auth = (t: T) => ({ authorization: `JWT ${t.token}`, 'content-type': 'application/json' })
const api = (t: T | null, path: string, method = 'GET', body?: unknown) =>
  fetch(`${BASE}/api${path}`, { method, headers: t ? auth(t) : { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
/** A one-paragraph Lexical document (the form builder's confirmation message is rich text). */
const richText = (text: string) => ({
  root: { type: 'root', version: 1, direction: null, format: '', indent: 0, children: [{ type: 'paragraph', version: 1, direction: null, format: '', indent: 0, children: [{ type: 'text', version: 1, text, detail: 0, format: 0, mode: 'normal', style: '' }] }] },
})

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
  A = await load(3)
  B = await load(4)
  await reset(A)
  await stripFormBlocks(A.pageId)
})

/** Leaves the contact page as seeded (a form block from an earlier run would point at a deleted form). */
const stripFormBlocks = async (pageId: number) => {
  const page = await payload.findByID({ collection: 'pages', id: pageId, overrideAccess: true, depth: 0 })
  const blocks = (page.blocks ?? []).filter((b) => b.blockType !== 'form')
  if (blocks.length !== (page.blocks ?? []).length) await payload.update({ collection: 'pages', id: pageId, data: { blocks } as never, overrideAccess: true })
}
afterAll(async () => {
  if (!reachable) return
  await stripFormBlocks(A.pageId).catch(() => null)
  for (const c of created.reverse()) await payload.delete({ collection: c.collection, id: c.id, overrideAccess: true }).catch(() => null)
  await payload.update({ collection: 'pages', id: A.pageId, data: { meta: { title: null, description: null } } as never, overrideAccess: true }).catch(() => null)
  await reset(A)
})

describe('SEO plugin', () => {
  it('page metadata edited by the owner reaches the published page head', async (ctx) => {
    if (!reachable) ctx.skip()
    const r = await api(A, `/pages/${A.pageId}`, 'PATCH', { meta: { title: 'Contact us at tenant 3', description: 'Reach the front desk of tenant 3.' } })
    expect(r.status).toBe(200)
    expect((await api(A, `/sites/${A.siteId}/publish`, 'POST')).status).toBe(200)
    const html = await (await fetch(`${BASE}/s/${A.slug}/contact`)).text()
    expect(html).toContain('<title>Contact us at tenant 3 ·')
    expect(html).toContain('content="Reach the front desk of tenant 3."')
  })
})

describe('redirects plugin', () => {
  it('an owner adds a redirect from an old URL; the published site honours it; other tenants cannot see it', async (ctx) => {
    if (!reachable) ctx.skip()
    const r = await api(A, '/redirects', 'POST', { site: A.siteId, tenant: A.tenantId, from: '/ancien-contact.html', to: { type: 'reference', reference: { relationTo: 'pages', value: A.pageId } } })
    expect(r.status).toBe(201)
    const doc = ((await r.json()) as { doc: { id: number } }).doc
    created.push({ collection: 'redirects', id: doc.id })
    expect((await api(A, `/sites/${A.siteId}/publish`, 'POST')).status).toBe(200)
    const res = await fetch(`${BASE}/s/${A.slug}/ancien-contact.html`, { redirect: 'manual' })
    expect(res.status).toBe(308)
    expect(res.headers.get('location')).toContain(`/s/${A.slug}/contact`)
    // Tenant B sees none of A's redirects.
    const list = (await (await api(B, '/redirects?limit=100')).json()) as { docs: { id: number }[] }
    expect(list.docs.map((d) => d.id)).not.toContain(doc.id)
  })
})

describe('form builder plugin', () => {
  let formId = 0
  it('an owner builds a form; a visitor submits from the public site; the submission belongs to the owner', async (ctx) => {
    if (!reachable) ctx.skip()
    const r = await api(A, '/forms', 'POST', {
      tenant: A.tenantId,
      title: 'Contact tenant 3',
      fields: [
        { blockType: 'text', name: 'name', label: 'Name', required: true },
        { blockType: 'email', name: 'email', label: 'Email', required: true },
        { blockType: 'textarea', name: 'message', label: 'Message', required: true },
      ],
      confirmationType: 'message',
      confirmationMessage: richText('Thank you, we will answer soon.'),
      submitButtonLabel: 'Send',
    })
    expect(r.status).toBe(201)
    formId = ((await r.json()) as { doc: { id: number } }).doc.id
    created.push({ collection: 'forms', id: formId })
    // Put the form on the page and publish: the public page renders it from the snapshot.
    const page = await payload.findByID({ collection: 'pages', id: A.pageId, overrideAccess: true, depth: 0 })
    await payload.update({ collection: 'pages', id: A.pageId, data: { blocks: [...(page.blocks ?? []), { blockType: 'form', heading: 'Write to us', form: formId }] } as never, overrideAccess: true })
    expect((await api(A, `/sites/${A.siteId}/publish`, 'POST')).status).toBe(200)
    const html = await (await fetch(`${BASE}/s/${A.slug}/contact`)).text()
    expect(html).toContain('name="message"')
    expect(html).toContain('name="_hp"')
    // A visitor (no login) submits through the public endpoint, with the timing field far enough in the past.
    const sub = await api(null, '/contact', 'POST', {
      form: formId,
      submissionData: [
        { field: 'name', value: 'Guest' },
        { field: 'email', value: 'guest@example.test' },
        { field: 'message', value: 'Do you have parking?' },
        { field: '_t', value: String(Date.now() - 10_000) },
        { field: '_hp', value: '' },
      ],
    })
    expect(sub.status).toBe(201)
    const subId = ((await sub.json()) as { id: number }).id
    created.push({ collection: 'form-submissions', id: subId })
    const stored = await payload.findByID({ collection: 'form-submissions', id: subId, overrideAccess: true, depth: 0 })
    expect(Number(typeof stored.tenant === 'object' ? (stored.tenant as { id: number }).id : stored.tenant)).toBe(A.tenantId)
    expect((stored.submissionData ?? []).map((x) => x.field)).toEqual(['name', 'email', 'message'])
    // The owner reads it; another tenant cannot.
    expect((await api(A, `/form-submissions/${subId}`)).status).toBe(200)
    expect([403, 404]).toContain((await api(B, `/form-submissions/${subId}`)).status)
  })

  it('bots are refused: a filled honeypot, or a form sent within 2.5 s of opening', async (ctx) => {
    if (!reachable) ctx.skip()
    const honey = await api(null, '/contact', 'POST', { form: formId, submissionData: [{ field: 'name', value: 'x' }, { field: 'email', value: 'x@y.z' }, { field: 'message', value: 'x' }, { field: '_hp', value: 'http://spam' }, { field: '_t', value: String(Date.now() - 10_000) }] })
    expect(honey.status).toBeGreaterThanOrEqual(400)
    const fast = await api(null, '/contact', 'POST', { form: formId, submissionData: [{ field: 'name', value: 'x' }, { field: 'email', value: 'x@y.z' }, { field: 'message', value: 'x' }, { field: '_t', value: String(Date.now()) }] })
    expect(fast.status).toBeGreaterThanOrEqual(400)
  })

  it('a submission cannot be pointed at another tenant, and the collection REST route refuses visitors', async (ctx) => {
    if (!reachable) ctx.skip()
    const r = await api(null, '/contact', 'POST', { form: formId, tenant: B.tenantId, submissionData: [{ field: 'name', value: 'x' }, { field: 'email', value: 'x@y.z' }, { field: 'message', value: 'x' }, { field: '_t', value: String(Date.now() - 10_000) }] })
    expect(r.status).toBe(201)
    const id = ((await r.json()) as { id: number }).id
    created.push({ collection: 'form-submissions', id })
    const stored = await payload.findByID({ collection: 'form-submissions', id, overrideAccess: true, depth: 0 })
    expect(Number(typeof stored.tenant === 'object' ? (stored.tenant as { id: number }).id : stored.tenant)).toBe(A.tenantId)
    const direct = await api(null, '/form-submissions', 'POST', { form: formId, submissionData: [{ field: 'name', value: 'x' }] })
    expect(direct.status).toBeGreaterThanOrEqual(400)
  })
})
