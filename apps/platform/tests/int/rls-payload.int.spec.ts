/**
 * Defence in depth, end to end: Payload's own queries, with application-layer access control
 * switched OFF (overrideAccess), still cannot cross tenants once the transaction runs as the
 * restricted role with a tenant context. This is the pattern a per-request hook would use.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import config from '@/payload.config'
import { describe, it, beforeAll, expect } from 'vitest'
import { tenantSlug } from '@/seed/constants'

let payload: Payload
let A: number
let B: number
type Session = { db: { execute: (q: unknown) => Promise<unknown> } }

beforeAll(async () => {
  payload = await getPayload({ config })
  const pool = (payload.db as unknown as { pool: { query: (s: string) => Promise<unknown> } }).pool
  await pool.query(readFileSync(fileURLToPath(new URL('../../src/db/rls.sql', import.meta.url)), 'utf8'))
  const t = await payload.find({ collection: 'tenants', where: { slug: { in: [tenantSlug(1), tenantSlug(2)] } }, depth: 0, overrideAccess: true })
  A = Number(t.docs.find((d) => d.slug === tenantSlug(1))?.id)
  B = Number(t.docs.find((d) => d.slug === tenantSlug(2))?.id)
})

/** Opens a Payload transaction scoped to one tenant at the database level; always rolled back. */
const scoped = async <T>(tenant: number, fn: (req: Partial<PayloadRequest>) => Promise<T>): Promise<T> => {
  const id = await payload.db.beginTransaction()
  if (!id) throw new Error('transactions unavailable')
  const session = (payload.db as unknown as { sessions: Record<string, Session> }).sessions[String(id)]
  try {
    await session.db.execute(sql`set local role hh_app_rls`)
    await session.db.execute(sql`select set_config('app.tenant_ids', ${String(tenant)}, true)`)
    return await fn({ transactionID: id })
  } finally {
    await payload.db.rollbackTransaction(id)
  }
}

describe('RLS under Payload, with access control bypassed', () => {
  it('find() returns only the scoped tenant pages', async () => {
    const res = await scoped(A, (req) => payload.find({ collection: 'pages', depth: 0, limit: 500, overrideAccess: true, req }))
    expect(res.totalDocs).toBe(4) // home, rooms, contact, blog
    for (const d of res.docs) expect(Number(typeof d.tenant === 'object' ? d.tenant?.id : d.tenant)).toBe(A)
  })

  it('update() of another tenant page by id changes nothing', async () => {
    const target = await payload.find({ collection: 'pages', where: { tenant: { equals: B } }, depth: 0, limit: 1, overrideAccess: true })
    const id = target.docs[0].id
    const res = await scoped(A, (req) =>
      payload.update({ collection: 'pages', where: { id: { equals: id } }, data: { title: 'defaced' }, depth: 0, overrideAccess: true, req }),
    )
    expect(res.docs.length).toBe(0)
    const after = await payload.findByID({ collection: 'pages', id, depth: 0, overrideAccess: true })
    expect(after.title).not.toBe('defaced')
  })
})
