/**
 * Isolation beyond single-document operations: bulk update and delete by `where`, bulk
 * ingest (imports), and background jobs. Probe pages are created and removed by the suite.
 */
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { SEED_PASSWORD, tenantEmail, tenantSlug } from '@/seed/constants'

let payload: Payload
type AnyUser = Record<string, unknown> & { id: number | string; collection?: string }
type Ref = { id: number }
const PROBE = 'iso-probe-'
let A: { tenant: Ref; site: Ref; user: AnyUser }
let B: { tenant: Ref; site: Ref; user: AnyUser }

const login = async (email: string): Promise<AnyUser> => {
  const res = await payload.login({ collection: 'users', data: { email, password: SEED_PASSWORD } })
  return { ...(res.user as unknown as AnyUser), collection: 'users' }
}
const tenantOf = async (n: number) => {
  const tenant = (await payload.find({ collection: 'tenants', where: { slug: { equals: tenantSlug(n) } }, overrideAccess: true, limit: 1 })).docs[0] as unknown as Ref
  const site = (await payload.find({ collection: 'sites', where: { tenant: { equals: tenant.id } }, overrideAccess: true, limit: 1 })).docs[0] as unknown as Ref
  return { tenant, site, user: await login(tenantEmail(n)) }
}
const probe = (t: typeof A, slug: string) =>
  payload.create({ collection: 'pages', overrideAccess: true, data: { title: slug, slug, site: t.site.id, tenant: t.tenant.id } })
const probesOf = async (t: typeof A) =>
  (await payload.find({ collection: 'pages', where: { and: [{ slug: { like: PROBE } }, { tenant: { equals: t.tenant.id } }] }, overrideAccess: true, limit: 100 })).docs
const cleanup = () => payload.delete({ collection: 'pages', where: { slug: { like: PROBE } }, overrideAccess: true })

beforeAll(async () => {
  payload = await getPayload({ config })
  await cleanup()
  A = await tenantOf(1)
  B = await tenantOf(2)
})
afterAll(async () => {
  await cleanup()
})

describe('bulk operations are tenant-scoped', () => {
  it('bulk update by where touches only the caller tenant', async () => {
    await probe(A, `${PROBE}a1`)
    await probe(A, `${PROBE}a2`)
    await probe(B, `${PROBE}b1`)
    const res = await payload.update({
      collection: 'pages',
      where: { slug: { like: PROBE } },
      data: { title: 'bulk-updated' },
      user: A.user,
      overrideAccess: false,
    })
    expect(res.docs.length).toBe(2)
    expect((await probesOf(B)).map((d) => d.title)).toEqual([`${PROBE}b1`])
  })

  it('bulk delete by where removes only the caller tenant', async () => {
    const res = await payload.delete({ collection: 'pages', where: { slug: { like: PROBE } }, user: A.user, overrideAccess: false })
    expect(res.docs.length).toBe(2)
    expect(await probesOf(A)).toHaveLength(0)
    expect(await probesOf(B)).toHaveLength(1)
  })

  it('bulk update cannot re-tenant rows the caller can see', async () => {
    await probe(A, `${PROBE}a3`)
    // Rejected or silently ignored are both acceptable; what matters is where the rows end up.
    await payload
      .update({ collection: 'pages', where: { slug: { like: PROBE } }, data: { tenant: B.tenant.id }, user: A.user, overrideAccess: false })
      .catch(() => null)
    expect(await probesOf(A)).toHaveLength(1)
    expect(await probesOf(B)).toHaveLength(1)
  })
})

describe('imports (bulk ingest) are tenant-scoped', () => {
  it('a batch naming another tenant is refused row by row, own rows land', async () => {
    const rows = [
      { title: `${PROBE}imp-own`, slug: `${PROBE}imp-own`, site: A.site.id, tenant: A.tenant.id },
      { title: `${PROBE}imp-foreign`, slug: `${PROBE}imp-foreign`, site: B.site.id, tenant: B.tenant.id },
    ]
    const results = await Promise.allSettled(
      rows.map((data) => payload.create({ collection: 'pages', data, user: A.user, overrideAccess: false })),
    )
    expect(results.map((r) => r.status)).toEqual(['fulfilled', 'rejected'])
    expect((await probesOf(B)).map((d) => d.slug)).not.toContain(`${PROBE}imp-foreign`)
  })

  it('a row with no tenant is not placed in another tenant', async () => {
    const r = await payload
      .create({ collection: 'pages', data: { title: `${PROBE}imp-none`, slug: `${PROBE}imp-none`, site: A.site.id }, user: A.user, overrideAccess: false })
      .catch(() => null)
    const inB = (await probesOf(B)).some((d) => d.slug === `${PROBE}imp-none`)
    expect(inB).toBe(false)
    if (r) {
      const t = r.tenant as Ref | number | null | undefined
      expect(t && typeof t === 'object' ? t.id : t).toBe(A.tenant.id)
    }
  })
})

describe('background jobs carry and enforce their tenant', () => {
  const run = async (tenantId: number, pageId: number, description: string) => {
    const job = await payload.jobs.queue({ task: 'touchPageSeo', input: { tenantId, pageId, description } })
    // Completed jobs are deleted by default, so the proof is the state of the pages afterwards.
    await payload.jobs.runByID({ id: job.id })
  }

  let pageA: Ref
  let pageB: Ref
  beforeAll(async () => {
    pageA = (await probe(A, `${PROBE}job-a`)) as unknown as Ref
    pageB = (await probe(B, `${PROBE}job-b`)) as unknown as Ref
  })

  it('a job for tenant A cannot write a tenant B page', async () => {
    await run(A.tenant.id, Number(pageB.id), 'written-by-A-job')
    const after = await payload.findByID({ collection: 'pages', id: pageB.id, overrideAccess: true })
    expect(after.meta?.description ?? null).not.toBe('written-by-A-job')
  })

  it('the same job for the right tenant does write', async () => {
    await run(A.tenant.id, Number(pageA.id), 'written-by-A-job')
    const after = await payload.findByID({ collection: 'pages', id: pageA.id, overrideAccess: true })
    expect(after.meta?.description).toBe('written-by-A-job')
  })
})
