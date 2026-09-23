/**
 * Row-level security: Postgres enforces the tenant boundary when a transaction runs as the
 * restricted role `hh_app_rls` and declares its tenants (SET LOCAL app.tenant_ids).
 *
 * beforeAll (re)applies src/db/rls.sql, because Payload's dev-mode schema push drops the
 * policies and disables RLS every time it runs (finding recorded in docs/05).
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, expect } from 'vitest'
import { TENANT_COUNT, tenantSlug } from '@/seed/constants'

type Result = { rows: Record<string, unknown>[]; rowCount: number | null }
type Client = { query: (sql: string, params?: unknown[]) => Promise<Result>; release: () => void }
let payload: Payload
let pool: { connect: () => Promise<Client>; query: Client['query'] }
let A: number
let B: number

beforeAll(async () => {
  payload = await getPayload({ config })
  pool = (payload.db as unknown as { pool: typeof pool }).pool
  await pool.query(readFileSync(fileURLToPath(new URL('../../src/db/rls.sql', import.meta.url)), 'utf8'))
  const t = await pool.query(`select id, slug from tenants where slug in ($1, $2)`, [tenantSlug(1), tenantSlug(2)])
  A = Number(t.rows.find((x) => x.slug === tenantSlug(1))?.id)
  B = Number(t.rows.find((x) => x.slug === tenantSlug(2))?.id)
})

/** Runs fn in a rolled-back transaction, optionally as the restricted role, with a tenant context. */
const inTx = async <T>(opts: { role?: boolean; tenants?: number[] }, fn: (c: Client) => Promise<T>): Promise<T> => {
  const c = await pool.connect()
  try {
    await c.query('begin')
    if (opts.role) await c.query('set local role hh_app_rls')
    if (opts.tenants) await c.query(`select set_config('app.tenant_ids', $1, true)`, [opts.tenants.join(',')])
    return await fn(c)
  } finally {
    await c.query('rollback').catch(() => {})
    c.release()
  }
}
const asTenant = <T>(ids: number[], fn: (c: Client) => Promise<T>) => inTx({ role: true, tenants: ids }, fn)

describe('row-level security (database-enforced tenant boundary)', () => {
  it('RLS is enabled and forced on every tenant table', async () => {
    const r = await pool.query(
      `select relname, relrowsecurity, relforcerowsecurity from pg_class
       where relname in ('sites','pages','_pages_v','media','domains','releases') and relkind = 'r'`,
    )
    expect(r.rows.length).toBe(6)
    for (const row of r.rows) expect([row.relname, row.relrowsecurity, row.relforcerowsecurity]).toEqual([row.relname, true, true])
  })

  it('tenant A context sees only A pages', async () => {
    const rows = await asTenant([A], (c) => c.query('select tenant_id from pages'))
    expect(rows.rows.length).toBe(3)
    for (const r of rows.rows) expect(Number(r.tenant_id)).toBe(A)
  })

  it('tenant A context cannot see B rows even when asking for them', async () => {
    for (const table of ['pages', 'sites', 'domains']) {
      const rows = await asTenant([A], (c) => c.query(`select id from ${table} where tenant_id = $1`, [B]))
      expect(rows.rows.length, table).toBe(0)
    }
    const versions = await asTenant([A], (c) => c.query(`select id from _pages_v where version_tenant_id = $1`, [B]))
    expect(versions.rows.length).toBe(0)
  })

  it('tenant A context cannot update or delete B rows', async () => {
    const upd = await asTenant([A], (c) => c.query(`update pages set slug = 'defaced' where tenant_id = $1`, [B]))
    expect(upd.rowCount).toBe(0)
    const del = await asTenant([A], (c) => c.query(`delete from domains where tenant_id = $1`, [B]))
    expect(del.rowCount).toBe(0)
  })

  it('tenant A context cannot move a row into tenant B', async () => {
    await expect(
      asTenant([A], (c) => c.query(`update pages set tenant_id = $1 where tenant_id = $2`, [B, A])),
    ).rejects.toThrow(/row-level security/i)
  })

  it('restricted role without a declared context is unrestricted (context-optional mode)', async () => {
    const rows = await inTx({ role: true }, (c) => c.query('select count(*)::int as n from pages'))
    expect(Number(rows.rows[0].n)).toBeGreaterThanOrEqual(TENANT_COUNT * 3)
  })

  it('FINDING: the connection role bypasses RLS, so the app must SET ROLE for policies to apply', async () => {
    const who = await pool.query(
      `select rolsuper, rolbypassrls from pg_roles where rolname = current_user`,
    )
    const bypasses = Boolean(who.rows[0].rolsuper) || Boolean(who.rows[0].rolbypassrls)
    const leak = await inTx({ tenants: [A] }, (c) => c.query(`select id from pages where tenant_id = $1`, [B]))
    // Documents today's reality: owner/superuser connections ignore the policy entirely.
    expect(leak.rows.length > 0).toBe(bypasses)
  })
})
