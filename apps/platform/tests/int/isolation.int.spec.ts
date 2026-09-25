/**
 * Tenant isolation matrix via the Local API with overrideAccess: false.
 *
 * Requires: database seeded (pnpm seed). Every test asserts that a tenant user can reach
 * only their own tenant's data through every operation the platform exposes.
 */
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, expect } from 'vitest'
import { SEED_PASSWORD, SUPER_ADMIN_EMAIL, TENANT_COUNT, tenantEmail, tenantSlug } from '@/seed/constants'

let payload: Payload

type AnyUser = Record<string, unknown> & { id: number | string; collection?: string }

const login = async (email: string): Promise<AnyUser> => {
  const res = await payload.login({ collection: 'users', data: { email, password: SEED_PASSWORD } })
  return { ...(res.user as unknown as AnyUser), collection: 'users' }
}

const idOf = (v: unknown): number | string | undefined =>
  v && typeof v === 'object' ? (v as { id: number | string }).id : (v as number | string | undefined)

const tenantByEmailN = async (n: number) => {
  const res = await payload.find({ collection: 'tenants', where: { slug: { equals: tenantSlug(n) } }, overrideAccess: true, limit: 1 })
  return res.docs[0]
}

const firstPageOf = async (tenantId: number | string) => {
  const res = await payload.find({ collection: 'pages', where: { tenant: { equals: tenantId } }, overrideAccess: true, limit: 1 })
  return res.docs[0]
}

beforeAll(async () => {
  payload = await getPayload({ config })
})

describe('tenant isolation (Local API, overrideAccess: false)', () => {
  const A = 1
  const B = 2

  it('user A reads only tenant A pages', async () => {
    const userA = await login(tenantEmail(A))
    const tenantA = await tenantByEmailN(A)
    const res = await payload.find({ collection: 'pages', user: userA, overrideAccess: false, limit: 1000 })
    expect(res.totalDocs).toBe(4) // home, rooms, contact, blog
    for (const d of res.docs) expect(idOf(d.tenant)).toBe(tenantA.id)
  })

  it('user A cannot read a tenant B page by id', async () => {
    const userA = await login(tenantEmail(A))
    const pageB = await firstPageOf((await tenantByEmailN(B)).id)
    await expect(
      payload.findByID({ collection: 'pages', id: pageB.id, user: userA, overrideAccess: false }),
    ).rejects.toThrow()
  })

  it('user A cannot find tenant B pages by where clause', async () => {
    const userA = await login(tenantEmail(A))
    const tenantB = await tenantByEmailN(B)
    const res = await payload.find({ collection: 'pages', user: userA, overrideAccess: false, where: { tenant: { equals: tenantB.id } } })
    expect(res.totalDocs).toBe(0)
  })

  it('user A cannot create a page in tenant B', async () => {
    const userA = await login(tenantEmail(A))
    const tenantB = await tenantByEmailN(B)
    const siteB = (await payload.find({ collection: 'sites', where: { tenant: { equals: tenantB.id } }, overrideAccess: true, limit: 1 })).docs[0]
    await expect(
      payload.create({
        collection: 'pages',
        user: userA,
        overrideAccess: false,
        data: { title: 'intrusion', slug: 'intrusion', site: siteB.id, tenant: tenantB.id },
      }),
    ).rejects.toThrow()
  })

  it('user A cannot update a tenant B page', async () => {
    const userA = await login(tenantEmail(A))
    const pageB = await firstPageOf((await tenantByEmailN(B)).id)
    await expect(
      payload.update({ collection: 'pages', id: pageB.id, user: userA, overrideAccess: false, data: { title: 'defaced' } }),
    ).rejects.toThrow()
    const after = await payload.findByID({ collection: 'pages', id: pageB.id, overrideAccess: true })
    expect(after.title).not.toBe('defaced')
  })

  it('user A cannot delete a tenant B page', async () => {
    const userA = await login(tenantEmail(A))
    const pageB = await firstPageOf((await tenantByEmailN(B)).id)
    await expect(
      payload.delete({ collection: 'pages', id: pageB.id, user: userA, overrideAccess: false }),
    ).rejects.toThrow()
    const still = await payload.findByID({ collection: 'pages', id: pageB.id, overrideAccess: true })
    expect(still.id).toBe(pageB.id)
  })

  it('user A cannot move their own page into tenant B', async () => {
    const userA = await login(tenantEmail(A))
    const tenantA = await tenantByEmailN(A)
    const tenantB = await tenantByEmailN(B)
    const pageA = await firstPageOf(tenantA.id)
    await expect(
      payload.update({ collection: 'pages', id: pageA.id, user: userA, overrideAccess: false, data: { tenant: tenantB.id } }),
    ).rejects.toThrow()
    const after = await payload.findByID({ collection: 'pages', id: pageA.id, overrideAccess: true })
    expect(idOf(after.tenant)).toBe(tenantA.id)
  })

  it('user A cannot add themselves to tenant B', async () => {
    const userA = await login(tenantEmail(A))
    const tenantA = await tenantByEmailN(A)
    const tenantB = await tenantByEmailN(B)
    // Field-level access on the tenants array is super-admin only: the write must be rejected
    // or silently dropped. Either way, membership must be unchanged afterwards.
    try {
      await payload.update({
        collection: 'users',
        id: userA.id,
        user: userA,
        overrideAccess: false,
        data: { tenants: [{ tenant: tenantA.id }, { tenant: tenantB.id }] },
      })
    } catch {
      /* rejected: fine */
    }
    const after = await payload.findByID({ collection: 'users', id: userA.id, overrideAccess: true })
    const ids = ((after.tenants as { tenant: unknown }[]) || []).map((t) => idOf(t.tenant))
    expect(ids).toEqual([tenantA.id])
  })

  it('user A cannot promote themselves to super-admin', async () => {
    const userA = await login(tenantEmail(A))
    try {
      await payload.update({ collection: 'users', id: userA.id, user: userA, overrideAccess: false, data: { roles: ['super-admin'] } })
    } catch {
      /* rejected: fine */
    }
    const after = await payload.findByID({ collection: 'users', id: userA.id, overrideAccess: true })
    expect(after.roles).not.toContain('super-admin')
  })

  it('user A sees only tenant A in the tenants collection', async () => {
    const userA = await login(tenantEmail(A))
    const res = await payload.find({ collection: 'tenants', user: userA, overrideAccess: false, limit: 1000 })
    expect(res.docs.map((d) => d.slug)).toEqual([tenantSlug(A)])
  })

  it('user A sees only tenant A sites, domains and releases', async () => {
    const userA = await login(tenantEmail(A))
    const tenantA = await tenantByEmailN(A)
    for (const collection of ['sites', 'domains', 'releases', 'facts', 'rooms', 'offers', 'redirects', 'forms', 'form-submissions', 'crawls', 'issues', 'audit-log'] as const) {
      const res = await payload.find({ collection, user: userA, overrideAccess: false, limit: 1000 })
      for (const d of res.docs) expect(idOf((d as { tenant: unknown }).tenant)).toBe(tenantA.id)
    }
  })

  it('super-admin sees all seeded tenants', async () => {
    const admin = await login(SUPER_ADMIN_EMAIL)
    const res = await payload.find({ collection: 'tenants', user: admin, overrideAccess: false, limit: 1000 })
    expect(res.totalDocs).toBeGreaterThanOrEqual(TENANT_COUNT)
  })

  it('matrix: 10 tenant pairs, no cross reads in either direction', async () => {
    const pairs: [number, number][] = [[3, 4], [5, 17], [9, 41], [12, 13], [20, 50], [22, 8], [30, 31], [33, 2], [44, 45], [49, 1]]
      // Scale-independent: with SEED_TENANTS below 50, pairs outside the seeded range drop out.
      .filter(([a, b]) => a <= TENANT_COUNT && b <= TENANT_COUNT) as [number, number][]
    for (const [x, y] of pairs) {
      const ux = await login(tenantEmail(x))
      const uy = await login(tenantEmail(y))
      const tx = await tenantByEmailN(x)
      const ty = await tenantByEmailN(y)
      const px = await firstPageOf(tx.id)
      const py = await firstPageOf(ty.id)
      await expect(payload.findByID({ collection: 'pages', id: py.id, user: ux, overrideAccess: false })).rejects.toThrow()
      await expect(payload.findByID({ collection: 'pages', id: px.id, user: uy, overrideAccess: false })).rejects.toThrow()
    }
  })
})
