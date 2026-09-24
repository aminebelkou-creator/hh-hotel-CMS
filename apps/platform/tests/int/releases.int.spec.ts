/**
 * Content release pipeline v0: immutable releases, per-site lock, superseding, verification
 * with automatic rollback, manual rollback, tenancy, and the Gate 2 timings.
 * Uses the seeded tenants 3 and 4 so it does not disturb the other suites' fixtures.
 */
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { SEED_PASSWORD, tenantEmail, tenantSlug } from '@/seed/constants'
import { nextPublishSeq, publishSite, rollbackSite, type PublishOutcome } from '@/releases/publish'
import { loadLiveRelease, upgradeSnapshot } from '@/releases/resolve'
import { checksumOf } from '@/releases/canonical'
import { poolOf } from '@/releases/db'
import type { SiteSnapshot } from '@/releases/snapshot'

let payload: Payload
type AnyUser = Record<string, unknown> & { id: number | string; collection?: string }
type T = { tenantId: number; siteId: number; slug: string; user: AnyUser }
let A: T
let B: T
const PROBE = 'probe.release.'
const timings: Record<string, number> = {}

const load = async (n: number): Promise<T> => {
  const tenant = (await payload.find({ collection: 'tenants', where: { slug: { equals: tenantSlug(n) } }, overrideAccess: true, limit: 1 })).docs[0]
  const site = (await payload.find({ collection: 'sites', where: { tenant: { equals: tenant.id } }, overrideAccess: true, limit: 1 })).docs[0]
  const res = await payload.login({ collection: 'users', data: { email: tenantEmail(n), password: SEED_PASSWORD } })
  return { tenantId: Number(tenant.id), siteId: Number(site.id), slug: site.slug, user: { ...(res.user as unknown as AnyUser), collection: 'users' } }
}
const reset = async (t: T) => {
  await poolOf(payload).query(`update sites set current_release_id = null, publish_locked_until = null, publish_locked_by = null, status = 'draft' where id = $1`, [t.siteId])
  await payload.delete({ collection: 'releases', where: { site: { equals: t.siteId } }, overrideAccess: true })
}
const pointer = async (t: T) => {
  const r = await poolOf(payload).query(`select current_release_id from sites where id = $1`, [t.siteId])
  const v = r.rows[0]?.current_release_id
  return v == null ? null : Number(v)
}
const releaseCount = async (t: T) => (await payload.count({ collection: 'releases', where: { site: { equals: t.siteId } }, overrideAccess: true })).totalDocs
const publish = async (t: T, by = 'test') => publishSite(payload, { tenantId: t.tenantId, siteId: t.siteId, seq: await nextPublishSeq(payload, t.tenantId, t.siteId), by })
const expectLive = (r: PublishOutcome) => {
  expect(r.outcome, r.error).toBe('live')
  return r
}

beforeAll(async () => {
  payload = await getPayload({ config })
  A = await load(3)
  B = await load(4)
  await reset(A)
  await reset(B)
  await payload.delete({ collection: 'facts', where: { key: { like: PROBE } }, overrideAccess: true })
  for (const [key, status] of [
    [`${PROBE}checkout`, 'confirmed'],
    [`${PROBE}unconfirmed`, 'unconfirmed'],
    [`${PROBE}rejected`, 'rejected'],
  ] as const) {
    await payload.create({ collection: 'facts', data: { key, value: status, tenant: A.tenantId, site: A.siteId, status }, overrideAccess: true })
  }
  await payload.create({ collection: 'facts', data: { key: `${PROBE}checkout`, value: 'tenant-B-secret', tenant: B.tenantId, status: 'confirmed' }, overrideAccess: true })
})
afterAll(async () => {
  if (!A || !B) return
  await reset(A)
  await reset(B)
  await payload.delete({ collection: 'facts', where: { key: { like: PROBE } }, overrideAccess: true })
  console.log(`release timings (ms): ${JSON.stringify(timings)}`)
})

describe('publish', () => {
  it('creates an immutable, checksummed release and moves the site pointer', async () => {
    const r = expectLive(await publish(A))
    timings.firstPublish = r.durationMs
    expect(await pointer(A)).toBe(r.releaseId)
    const rel = await payload.findByID({ collection: 'releases', id: r.releaseId!, overrideAccess: true })
    expect(rel.status).toBe('live')
    expect(rel.version).toBe('r1')
    expect(rel.checksum).toMatch(/^[0-9a-f]{64}$/)
    expect(checksumOf(rel.snapshot)).toBe(rel.checksum)
    const snap = rel.snapshot as unknown as SiteSnapshot
    expect(snap.pages.map((p) => p.slug)).toEqual(['contact', 'home', 'rooms'])
    expect(rel.pageCount).toBe(3)
  })

  it('snapshots only confirmed facts, and only the tenant\'s own', async () => {
    const live = await loadLiveRelease(payload, A.slug)
    const probes = live!.release.snapshot.facts.filter((f) => f.key.startsWith(PROBE))
    expect(probes).toEqual([{ key: `${PROBE}checkout`, value: 'confirmed' }])
  })

  it('a release cannot be changed after creation, even by the platform', async () => {
    const id = (await pointer(A))!
    await expect(payload.update({ collection: 'releases', id, data: { checksum: 'f'.repeat(64) }, overrideAccess: true })).rejects.toThrow(/immutable/)
    await expect(payload.update({ collection: 'releases', id, data: { snapshot: { pages: [] } }, overrideAccess: true })).rejects.toThrow(/immutable/)
    await expect(payload.delete({ collection: 'releases', id, user: A.user, overrideAccess: false })).rejects.toThrow()
  })

  it('tenant users cannot create releases or move the pointer', async () => {
    const before = await pointer(A)
    await expect(
      payload.create({ collection: 'releases', data: { site: A.siteId, version: 'forged', tenant: A.tenantId }, user: A.user, overrideAccess: false }),
    ).rejects.toThrow()
    const other = expectLive(await publish(B))
    await payload.update({ collection: 'sites', id: A.siteId, data: { currentRelease: other.releaseId }, user: A.user, overrideAccess: false }).catch(() => null)
    expect(await pointer(A)).toBe(before)
  })

  it('a publish for tenant B naming a tenant A site does nothing', async () => {
    const before = await pointer(A)
    const n = await releaseCount(A)
    await expect(publishSite(payload, { tenantId: B.tenantId, siteId: A.siteId, seq: 999 })).rejects.toThrow(/not found/)
    await expect(nextPublishSeq(payload, B.tenantId, A.siteId)).rejects.toThrow(/not found/)
    expect(await pointer(A)).toBe(before)
    expect(await releaseCount(A)).toBe(n)
  })

  it('the renderer resolves the release the pointer names, and nothing for a suspended site', async () => {
    const live = await loadLiveRelease(payload, A.slug)
    expect(live?.release.id).toBe(await pointer(A))
    await poolOf(payload).query(`update sites set status = 'suspended' where id = $1`, [A.siteId])
    expect(await loadLiveRelease(payload, A.slug)).toBeNull()
    await poolOf(payload).query(`update sites set status = 'draft' where id = $1`, [A.siteId])
    expect(await loadLiveRelease(payload, 'no-such-site')).toBeNull()
    expect(await loadLiveRelease(payload, '../etc')).toBeNull()
  })
})

describe('older snapshots stay servable (rollback can land on them)', () => {
  it('a schema-1 snapshot is upgraded with neutral defaults', () => {
    const old = { schema: 1, site: { id: 1, slug: 's', name: 'S', brandName: null, timezone: null, enabledLocales: ['fr'], defaultLocale: 'fr', theme: null, booking: { engine: 'none' } }, pages: [{ id: 1, slug: 'home', title: { fr: 'Accueil' }, blocks: [] }], facts: [] }
    const s = upgradeSnapshot(old)
    expect(s.site.cta).toEqual({ label: null, href: null })
    expect(s.packs).toEqual({})
    expect(s.pages[0]).toMatchObject({ navOrder: 0, showInNav: true, navLabel: null })
  })
})

describe('serialisation (finding 17: the last deploy to finish wins)', () => {
  it('an older request never overwrites a newer one', async () => {
    const seq1 = await nextPublishSeq(payload, A.tenantId, A.siteId)
    const seq2 = await nextPublishSeq(payload, A.tenantId, A.siteId)
    const newer = expectLive(await publishSite(payload, { tenantId: A.tenantId, siteId: A.siteId, seq: seq2 }))
    const n = await releaseCount(A)
    const older = await publishSite(payload, { tenantId: A.tenantId, siteId: A.siteId, seq: seq1 })
    expect(older.outcome).toBe('superseded')
    expect(await releaseCount(A)).toBe(n)
    expect(await pointer(A)).toBe(newer.releaseId)
  })

  it('a held lock makes a publish report busy; an expired lease is taken over', async () => {
    await poolOf(payload).query(`update sites set publish_locked_until = now() + interval '1 minute', publish_locked_by = 'other-worker' where id = $1`, [A.siteId])
    const n = await releaseCount(A)
    expect((await publish(A)).outcome).toBe('busy')
    expect(await releaseCount(A)).toBe(n)
    await poolOf(payload).query(`update sites set publish_locked_until = now() - interval '1 second' where id = $1`, [A.siteId])
    expectLive(await publish(A))
  })

  it('concurrent publishes: exactly the newest request goes live, once', async () => {
    const seqs = [
      await nextPublishSeq(payload, A.tenantId, A.siteId),
      await nextPublishSeq(payload, A.tenantId, A.siteId),
      await nextPublishSeq(payload, A.tenantId, A.siteId),
    ]
    const n = await releaseCount(A)
    const run = (seq: number) => publishSite(payload, { tenantId: A.tenantId, siteId: A.siteId, seq })
    let results = await Promise.all(seqs.map(run))
    // Busy requests are retried by the queue; simulate that until none is busy.
    for (let i = 0; i < 20 && results.some((r) => r.outcome === 'busy'); i++) {
      results = await Promise.all(results.map((r, k) => (r.outcome === 'busy' ? run(seqs[k]) : Promise.resolve(r))))
    }
    expect(results.map((r) => r.outcome)).toEqual(['superseded', 'superseded', 'live'])
    expect(await releaseCount(A)).toBe(n + 1)
    const rel = await payload.findByID({ collection: 'releases', id: (await pointer(A))!, overrideAccess: true })
    expect(rel.requestSeq).toBe(seqs[2])
  })
})

describe('verification and rollback (Gate 2: publish < 60 s, rollback < 10 s)', () => {
  it('a release that fails verification is not left live: the pointer moves back', async () => {
    const before = await pointer(A)
    const r = await publishSite(
      payload,
      { tenantId: A.tenantId, siteId: A.siteId, seq: await nextPublishSeq(payload, A.tenantId, A.siteId) },
      async () => {
        throw new Error('x-release mismatch (simulated)')
      },
    )
    expect(r.outcome).toBe('failed')
    expect(await pointer(A)).toBe(before)
    const rel = await payload.findByID({ collection: 'releases', id: r.releaseId!, overrideAccess: true })
    expect(rel.status).toBe('failed')
    expect(rel.error).toMatch(/simulated/)
  })

  it('rollback is a pointer move to the previous live release', async () => {
    const first = expectLive(await publish(A))
    const second = expectLive(await publish(A))
    timings.publish = second.durationMs
    const r = await rollbackSite(payload, { tenantId: A.tenantId, siteId: A.siteId })
    timings.rollback = r.durationMs
    expect(r.outcome).toBe('rolled-back')
    expect(await pointer(A)).toBe(first.releaseId)
    const [a, b] = await Promise.all([first.releaseId!, second.releaseId!].map((id) => payload.findByID({ collection: 'releases', id, overrideAccess: true })))
    expect([a.status, b.status]).toEqual(['live', 'rolled-back'])
    expect((await loadLiveRelease(payload, A.slug))?.release.id).toBe(first.releaseId)
    expect(second.durationMs).toBeLessThan(60_000)
    expect(r.durationMs).toBeLessThan(10_000)
  })

  it('rollback for the wrong tenant does nothing', async () => {
    const before = await pointer(A)
    await expect(rollbackSite(payload, { tenantId: B.tenantId, siteId: A.siteId })).rejects.toThrow(/not found/)
    expect(await pointer(A)).toBe(before)
  })
})

describe('publish job', () => {
  it('the queued publishSite task publishes with the tenant from its input', async () => {
    const seq = await nextPublishSeq(payload, B.tenantId, B.siteId)
    const n = await releaseCount(B)
    const job = await payload.jobs.queue({ task: 'publishSite', input: { tenantId: B.tenantId, siteId: B.siteId, seq, by: 'job-test' } })
    await payload.jobs.runByID({ id: job.id })
    expect(await releaseCount(B)).toBe(n + 1)
    const rel = await payload.findByID({ collection: 'releases', id: (await pointer(B))!, overrideAccess: true })
    expect([rel.status, rel.publishedBy, rel.requestSeq]).toEqual(['live', 'job-test', seq])
  })

  it('a job naming another tenant\'s site creates nothing there', async () => {
    const n = await releaseCount(A)
    const before = await pointer(A)
    const job = await payload.jobs.queue({ task: 'publishSite', input: { tenantId: B.tenantId, siteId: A.siteId, seq: 1e6 } })
    await payload.jobs.runByID({ id: job.id }).catch(() => null)
    expect(await releaseCount(A)).toBe(n)
    expect(await pointer(A)).toBe(before)
  })
})
