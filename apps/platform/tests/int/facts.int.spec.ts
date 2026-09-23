/**
 * Fact base: tenant isolation, and the confirmation rules (facts are born unconfirmed; a
 * decision is stamped by the server with who and when).
 */
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { SEED_PASSWORD, tenantEmail, tenantSlug } from '@/seed/constants'

let payload: Payload
type AnyUser = Record<string, unknown> & { id: number | string; collection?: string }
type Ref = { id: number }
const PROBE = 'probe.fact.'
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
const cleanup = () => payload.delete({ collection: 'facts', where: { key: { like: PROBE } }, overrideAccess: true })
const as = (u: AnyUser) => ({ user: u, overrideAccess: false as const })

let factA: Ref
let factB: Ref

beforeAll(async () => {
  payload = await getPayload({ config })
  await cleanup()
  A = await tenantOf(1)
  B = await tenantOf(2)
  factA = (await payload.create({ collection: 'facts', data: { key: `${PROBE}phone`, value: '+33100000001', tenant: A.tenant.id, site: A.site.id, status: 'unconfirmed' }, ...as(A.user) })) as unknown as Ref
  factB = (await payload.create({ collection: 'facts', data: { key: `${PROBE}phone`, value: '+33100000002', tenant: B.tenant.id, site: B.site.id, status: 'unconfirmed' }, ...as(B.user) })) as unknown as Ref
})
afterAll(async () => {
  await cleanup()
})

describe('facts are tenant-scoped', () => {
  it('user A lists only tenant A facts', async () => {
    const res = await payload.find({ collection: 'facts', where: { key: { like: PROBE } }, ...as(A.user) })
    expect(res.docs.map((d) => d.id)).toEqual([factA.id])
  })

  it('user A cannot read, confirm or delete a tenant B fact', async () => {
    await expect(payload.findByID({ collection: 'facts', id: factB.id, ...as(A.user) })).rejects.toThrow()
    await payload.update({ collection: 'facts', id: factB.id, data: { status: 'confirmed' }, ...as(A.user) }).catch(() => null)
    await payload.delete({ collection: 'facts', id: factB.id, ...as(A.user) }).catch(() => null)
    const b = await payload.findByID({ collection: 'facts', id: factB.id, overrideAccess: true })
    expect(b.status).toBe('unconfirmed')
  })

  it('user A cannot create a fact in tenant B', async () => {
    const r = await payload
      .create({ collection: 'facts', data: { key: `${PROBE}foreign`, value: 'x', tenant: B.tenant.id, status: 'unconfirmed' }, ...as(A.user) })
      .catch(() => null)
    const inB = await payload.find({ collection: 'facts', where: { and: [{ key: { equals: `${PROBE}foreign` } }, { tenant: { equals: B.tenant.id } }] }, overrideAccess: true })
    expect(inB.docs).toHaveLength(0)
    if (r) await payload.delete({ collection: 'facts', id: r.id, overrideAccess: true })
  })

  it('bulk confirm by where touches only the caller tenant', async () => {
    await payload.update({ collection: 'facts', where: { key: { like: PROBE } }, data: { status: 'rejected' }, ...as(A.user) })
    const b = await payload.findByID({ collection: 'facts', id: factB.id, overrideAccess: true })
    expect(b.status).toBe('unconfirmed')
    await payload.update({ collection: 'facts', id: factA.id, data: { status: 'unconfirmed' }, overrideAccess: true })
  })
})

describe('confirmation rules', () => {
  it('a fact created by a user or agent is always born unconfirmed', async () => {
    const f = await payload.create({
      collection: 'facts',
      data: { key: `${PROBE}born`, value: 'y', tenant: A.tenant.id, status: 'confirmed' },
      ...as(A.user),
    })
    expect(f.status).toBe('unconfirmed')
    expect(f.decidedBy ?? null).toBeNull()
  })

  it('confirming stamps who and when; the stamp cannot be forged', async () => {
    const forged = B.user.id
    const f = await payload.update({
      collection: 'facts',
      id: factA.id,
      data: { status: 'confirmed', decidedBy: forged as number, decidedAt: '2000-01-01T00:00:00.000Z' },
      ...as(A.user),
    })
    expect(f.status).toBe('confirmed')
    const by = typeof f.decidedBy === 'object' && f.decidedBy ? f.decidedBy.id : f.decidedBy
    expect(by).toBe(A.user.id)
    expect(new Date(String(f.decidedAt)).getFullYear()).toBeGreaterThanOrEqual(2026)
  })

  it('editing a confirmed fact without changing its status keeps the original stamp', async () => {
    const before = await payload.findByID({ collection: 'facts', id: factA.id, overrideAccess: true })
    const after = await payload.update({ collection: 'facts', id: factA.id, data: { decisionNote: 'checked twice', decidedAt: '2000-01-01T00:00:00.000Z' }, ...as(A.user) })
    expect(after.decidedAt).toBe(before.decidedAt)
  })

  it('moving back to unconfirmed clears the stamp', async () => {
    const f = await payload.update({ collection: 'facts', id: factA.id, data: { status: 'unconfirmed' }, ...as(A.user) })
    expect(f.decidedBy ?? null).toBeNull()
    expect(f.decidedAt ?? null).toBeNull()
  })

  it('only super-admins may delete facts', async () => {
    await expect(payload.delete({ collection: 'facts', id: factA.id, ...as(A.user) })).rejects.toThrow()
  })
})
