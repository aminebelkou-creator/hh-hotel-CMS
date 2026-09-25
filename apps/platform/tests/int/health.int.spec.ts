/**
 * Phase 4, operated service: site checks on the live release (links, photos, search text,
 * offers, facts), issues de-duplicated and resolved, one-tap fixes under the caller's own
 * rights, the monthly report, the action log, and the nightly service endpoints.
 * Uses seeded tenants 3 and 4 (releases.int.spec.ts publishes tenant 3 too; state is reset here).
 */
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { SEED_PASSWORD, tenantEmail, tenantSlug } from '@/seed/constants'
import { checkSite, findIssues, linksOf, recordFindings, type Finding } from '@/health/check'
import { monthlyReport } from '@/health/report'
import { nextPublishSeq, publishSite } from '@/releases/publish'
import { poolOf } from '@/releases/db'

const BASE = (process.env.PLATFORM_URL || 'http://localhost:3000').replace(/\/+$/, '')
let reachable = false
let payload: Payload
type T = { tenantId: number; siteId: number; slug: string; token: string; userId: number }
let A: T
let B: T

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
const auth = (t: T) => ({ authorization: `JWT ${t.token}`, 'content-type': 'application/json' })
const reset = async (t: T) => {
  await payload.delete({ collection: 'issues', where: { tenant: { equals: t.tenantId } }, overrideAccess: true })
  await payload.delete({ collection: 'offers', where: { and: [{ tenant: { equals: t.tenantId } }, { slug: { equals: 'old-summer' } }] }, overrideAccess: true })
  await poolOf(payload).query(`update sites set current_release_id = null where id = $1`, [t.siteId])
  await payload.delete({ collection: 'releases', where: { site: { equals: t.siteId } }, overrideAccess: true })
  const contact = (await payload.find({ collection: 'pages', where: { and: [{ tenant: { equals: t.tenantId } }, { site: { equals: t.siteId } }, { slug: { equals: 'contact' } }] }, limit: 1, overrideAccess: true })).docs[0]
  if (contact) {
    const blocks = ((contact.blocks as { blockType: string }[]) ?? []).filter((b) => b.blockType !== 'gallery' && !/"spa"|abc-photo/.test(JSON.stringify(b)))
    await payload.update({ collection: 'pages', id: contact.id, data: { blocks, _status: 'published' } as never, overrideAccess: true })
  }
}
const publish = async (t: T) => {
  const seq = await nextPublishSeq(payload, t.tenantId, t.siteId)
  const r = await publishSite(payload, { tenantId: t.tenantId, siteId: t.siteId, seq, by: 'test' })
  if (r.outcome !== 'live') throw new Error(`publish ${JSON.stringify(r)}`)
}

beforeAll(async () => {
  try {
    reachable = (await fetch(`${BASE}/api/users/me`)).status < 500
  } catch {
    reachable = false
  }
  payload = await getPayload({ config })
  A = await load(3)
  B = await load(4)
  await reset(A)
  await reset(B)
})
afterAll(async () => {
  await reset(A)
  await reset(B)
})

describe('checks', () => {
  it('a site without a live release is skipped', async () => {
    const r = await checkSite(payload, { tenantId: A.tenantId, siteId: A.siteId, fetchLinks: false })
    expect(r.skipped).toBe('no live release')
  })

  it('finds a dead internal link, a photo without description, missing search text, an expired offer and missing facts', async () => {
    const contact = (await payload.find({ collection: 'pages', where: { and: [{ tenant: { equals: A.tenantId } }, { site: { equals: A.siteId } }, { slug: { equals: 'contact' } }] }, limit: 1, overrideAccess: true })).docs[0]
    const blocks = [
      ...((contact.blocks as Record<string, unknown>[]) ?? []),
      { blockType: 'gallery', heading: 'Photos', images: [{ url: 'https://example.invalid/a.jpg', alt: '' }] },
      { blockType: 'cta', heading: 'Spa', buttonLabel: 'See the spa', buttonHref: 'spa' },
      { blockType: 'hero', heading: 'Photo', imageUrl: '/media/abc-photo.webp', imageAlt: 'A photo', ctaLabel: 'Rooms', ctaHref: '/fr/rooms' },
    ]
    await payload.update({ collection: 'pages', id: contact.id, data: { blocks, _status: 'published' } as never, overrideAccess: true })
    await payload.create({ collection: 'offers', data: { tenant: A.tenantId, slug: 'old-summer', title: 'Old summer', summary: 'Gone', active: true, validFrom: '2026-06-01', validTo: '2026-08-31' } as never, overrideAccess: true })
    await publish(A)
    const { findings } = await findIssues(payload, { tenantId: A.tenantId, siteId: A.siteId, fetchLinks: false })
    const kinds = findings.map((f) => f.kind)
    expect(kinds).toContain('broken-link')
    expect(findings.filter((f) => f.kind === 'broken-link').map((f) => f.title)).toEqual([expect.stringContaining('"spa"')]) // /media/… and /fr/rooms are fine
    expect(kinds).toContain('missing-alt')
    expect(kinds).toContain('missing-meta')
    expect(kinds).toContain('expired-offer')
    expect(kinds).toContain('missing-fact')
    expect(findings.find((f) => f.kind === 'expired-offer')?.fix).toEqual({ collection: 'offers', id: expect.any(Number), data: { active: false } })
    // The site's links are exactly what the pages carry.
    const live = (await payload.find({ collection: 'releases', where: { site: { equals: A.siteId } }, sort: '-createdAt', limit: 1, overrideAccess: true })).docs[0]
    expect(linksOf(live.snapshot as never).map((l) => l.href)).toEqual(expect.arrayContaining(['https://example.invalid/a.jpg', 'spa', 'contact']))
  })

  it('records issues once, refreshes them, and resolves what disappeared', async () => {
    const first = await checkSite(payload, { tenantId: A.tenantId, siteId: A.siteId, fetchLinks: false })
    expect(first.opened).toBeGreaterThan(3)
    const again = await checkSite(payload, { tenantId: A.tenantId, siteId: A.siteId, fetchLinks: false })
    expect(again.opened).toBe(0)
    expect(again.resolved).toBe(0)
    const total = await payload.count({ collection: 'issues', where: { tenant: { equals: A.tenantId } }, overrideAccess: true })
    expect(total.totalDocs).toBe(first.opened)
    // The hotel deactivates the offer by hand and republishes: the issue resolves itself.
    await payload.update({ collection: 'offers', where: { and: [{ tenant: { equals: A.tenantId } }, { slug: { equals: 'old-summer' } }] }, data: { active: false }, overrideAccess: true })
    await publish(A)
    const third = await checkSite(payload, { tenantId: A.tenantId, siteId: A.siteId, fetchLinks: false })
    expect(third.resolved).toBe(1)
    const offerIssue = (await payload.find({ collection: 'issues', where: { and: [{ tenant: { equals: A.tenantId } }, { kind: { equals: 'expired-offer' } }] }, limit: 1, overrideAccess: true })).docs[0]
    expect(offerIssue.status).toBe('resolved')
    expect(offerIssue.resolvedAt).toBeTruthy()
    // Nothing leaked to tenant B.
    expect((await payload.count({ collection: 'issues', where: { tenant: { equals: B.tenantId } }, overrideAccess: true })).totalDocs).toBe(0)
  })

  it('a check for B cannot run under A', async () => {
    await expect(checkSite(payload, { tenantId: A.tenantId, siteId: B.siteId })).rejects.toThrow(/not found in tenant/)
  })
})

describe('one-tap fix and report', () => {
  it('applies the search-text fix as a draft under the caller’s rights, only on their own issues', async (ctx) => {
    if (!reachable) ctx.skip()
    const meta = (await payload.find({ collection: 'issues', where: { and: [{ tenant: { equals: A.tenantId } }, { kind: { equals: 'missing-meta' } }, { status: { equals: 'open' } }, { fixLabel: { exists: true } }] }, limit: 1, overrideAccess: true })).docs[0]
    expect(meta).toBeTruthy()
    const cross = await fetch(`${BASE}/api/issues/${meta.id}/apply`, { method: 'POST', headers: auth(B) })
    expect(cross.status).toBe(404)
    const own = await fetch(`${BASE}/api/issues/${meta.id}/apply`, { method: 'POST', headers: auth(A) })
    expect(own.status).toBe(200)
    const after = await payload.findByID({ collection: 'issues', id: meta.id, overrideAccess: true })
    expect(after.status).toBe('applied')
    expect(after.appliedBy).toContain(`users:${A.userId}`)
    const fix = meta.fix as { id: number; data: { meta: { description: string } } }
    const page = await payload.findByID({ collection: 'pages', id: fix.id, draft: true, overrideAccess: true })
    expect(page.meta?.description).toBe(fix.data.meta.description)
    const twice = await fetch(`${BASE}/api/issues/${meta.id}/apply`, { method: 'POST', headers: auth(A) })
    expect(twice.status).toBe(409)
    // The user can dismiss their own issue but not change another tenant's.
    const other = (await payload.find({ collection: 'issues', where: { and: [{ tenant: { equals: A.tenantId } }, { status: { equals: 'open' } }] }, limit: 1, overrideAccess: true })).docs[0]
    const byB = await fetch(`${BASE}/api/issues/${other.id}`, { method: 'PATCH', headers: auth(B), body: JSON.stringify({ status: 'dismissed' }) })
    expect([403, 404]).toContain(byB.status)
  })

  it('writes the monthly report in the site’s language, from the tenant’s own rows', async () => {
    const r = await monthlyReport(payload, { tenantId: A.tenantId, siteId: A.siteId })
    expect(r.publishes.count).toBeGreaterThanOrEqual(2)
    expect(r.issues.opened).toBeGreaterThan(3)
    expect(r.issues.resolved).toBe(1)
    expect(r.text).toContain('Monthly report')
    expect(r.text).toContain(`Publishes: ${r.publishes.count}`)
    await expect(monthlyReport(payload, { tenantId: B.tenantId, siteId: A.siteId })).rejects.toThrow(/not found in tenant/)
  })

  it('over HTTP: the report is the caller’s own; the check endpoint too', async (ctx) => {
    if (!reachable) ctx.skip()
    expect((await fetch(`${BASE}/api/sites/${A.siteId}/report`, { headers: auth(B) })).status).toBe(404)
    const r = await fetch(`${BASE}/api/sites/${A.siteId}/report?month=2026-09`, { headers: auth(A) })
    expect(r.status).toBe(200)
    expect(((await r.json()) as { month: string }).month).toBe('2026-09')
    expect((await fetch(`${BASE}/api/sites/${A.siteId}/check`, { method: 'POST', headers: auth(B) })).status).toBe(404)
    const c = await fetch(`${BASE}/api/sites/${A.siteId}/check`, { method: 'POST', headers: auth(A) })
    expect(c.status).toBe(200)
  })
})

describe('action log', () => {
  it('records who changed what, tenant-scoped, without values', async () => {
    const user = await payload.findByID({ collection: 'users', id: A.userId, overrideAccess: true })
    const tagline = `A quiet house ${Date.now()}`
    await payload.update({ collection: 'sites', id: A.siteId, data: { tagline }, user, overrideAccess: false })
    const log = await payload.find({ collection: 'audit-log', where: { and: [{ tenant: { equals: A.tenantId } }, { collectionSlug: { equals: 'sites' } }, { docId: { equals: String(A.siteId) } }] }, sort: '-createdAt', limit: 1, overrideAccess: true })
    expect(log.docs[0].actor).toContain(`users:${A.userId}`)
    expect(log.docs[0].summary).toContain('tagline')
    expect(log.docs[0].summary).not.toContain(tagline)
    expect(log.docs[0].summary).not.toContain('currentRelease') // unchanged relationships are not reported
    // B sees none of A's log; A sees only their own.
    const userB = await payload.findByID({ collection: 'users', id: B.userId, overrideAccess: true })
    const seenByB = await payload.find({ collection: 'audit-log', user: userB, overrideAccess: false, where: { and: [{ collectionSlug: { equals: 'sites' } }, { docId: { equals: String(A.siteId) } }] }, limit: 10 })
    expect(seenByB.totalDocs).toBe(0)
    const seenByA = await payload.find({ collection: 'audit-log', user, overrideAccess: false, limit: 500 })
    expect(seenByA.docs.every((d) => Number(typeof d.tenant === 'object' && d.tenant ? d.tenant.id : d.tenant) === A.tenantId)).toBe(true)
    // Nobody edits the log.
    await expect(payload.update({ collection: 'audit-log', id: log.docs[0].id, data: { summary: 'x' }, user, overrideAccess: false })).rejects.toThrow()
  })
})

describe('nightly service endpoints', () => {
  it('refuse without the token, run the checks for live sites with it, and accept browser findings', async (ctx) => {
    if (!reachable) ctx.skip()
    const token = process.env.HEALTH_TOKEN ?? ''
    if (!token) ctx.skip()
    expect((await fetch(`${BASE}/api/health/run`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).status).toBe(401)
    expect((await fetch(`${BASE}/api/health/run`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-health-token': 'wrong-token-wrong-token' }, body: '{}' })).status).toBe(401)
    const run = await fetch(`${BASE}/api/health/run`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-health-token': token }, body: JSON.stringify({ limit: 20 }) })
    expect(run.status).toBe(200)
    const j = (await run.json()) as { results: { slug: string }[] }
    expect(j.results.map((r) => r.slug)).toContain(A.slug)
    const findings: Finding[] = [{ kind: 'accessibility', severity: 'warning', title: 'Accessibility: Images must have alternate text', fingerprint: 'axe:image-alt' }]
    const rep = await fetch(`${BASE}/api/health/report`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-health-token': token }, body: JSON.stringify({ site: A.slug, source: 'nightly-axe', findings }) })
    expect(rep.status).toBe(200)
    const issue = (await payload.find({ collection: 'issues', where: { and: [{ tenant: { equals: A.tenantId } }, { fingerprint: { equals: 'axe:image-alt' } }] }, limit: 1, overrideAccess: true })).docs[0]
    expect(issue.source).toBe('nightly-axe')
    // Unknown kinds are dropped; a second report without the finding resolves it.
    const rep2 = await fetch(`${BASE}/api/health/report`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-health-token': token }, body: JSON.stringify({ site: A.slug, source: 'nightly-axe', findings: [{ kind: 'made-up', title: 'x', fingerprint: 'y' }] }) })
    expect(((await rep2.json()) as { findings: number; resolved: number }).resolved).toBe(1)
  })

  it('recordFindings keeps dismissed issues dismissed', async () => {
    const f: Finding[] = [{ kind: 'stale-content', severity: 'info', title: 'Old', fingerprint: 'dismiss-me' }]
    await recordFindings(payload, { tenantId: A.tenantId, siteId: A.siteId, findings: f, source: 'unit' })
    const issue = (await payload.find({ collection: 'issues', where: { and: [{ tenant: { equals: A.tenantId } }, { fingerprint: { equals: 'dismiss-me' } }] }, limit: 1, overrideAccess: true })).docs[0]
    await payload.update({ collection: 'issues', id: issue.id, data: { status: 'dismissed' }, overrideAccess: true })
    const r = await recordFindings(payload, { tenantId: A.tenantId, siteId: A.siteId, findings: f, source: 'unit' })
    expect(r.opened + r.reopened).toBe(0)
    expect((await payload.findByID({ collection: 'issues', id: issue.id, overrideAccess: true })).status).toBe('dismissed')
  })
})

describe('design channel (template upgrades, canary first)', () => {
  it('a canary site renders the [data-canary] hook; a stable one does not; the release is untouched', async (ctx) => {
    if (!reachable) ctx.skip()
    const before = await fetch(`${BASE}/s/${A.slug}`).then((r) => r.text())
    expect(before).not.toContain('data-canary')
    await payload.update({ collection: 'sites', id: A.siteId, data: { designChannel: 'canary' }, overrideAccess: true })
    try {
      const canary = await fetch(`${BASE}/s/${A.slug}`).then((r) => r.text())
      expect(canary).toContain('data-canary=""')
      const rel = (await payload.find({ collection: 'releases', where: { site: { equals: A.siteId } }, sort: '-createdAt', limit: 1, overrideAccess: true })).docs[0]
      expect(JSON.stringify(rel.snapshot)).not.toContain('designChannel') // render-time only, never in a release
    } finally {
      await payload.update({ collection: 'sites', id: A.siteId, data: { designChannel: 'stable' }, overrideAccess: true })
    }
    // Owners cannot move themselves to the canary channel.
    const own = await fetch(`${BASE}/api/sites/${A.siteId}`, { method: 'PATCH', headers: auth(A), body: JSON.stringify({ designChannel: 'canary' }) })
    expect(((await own.json()) as { doc?: { designChannel?: string } }).doc?.designChannel ?? 'stable').toBe('stable')
  })
})
