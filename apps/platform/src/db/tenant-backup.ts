/**
 * Single-tenant backup and restore, without touching any other tenant.
 *   tsx src/db/tenant-backup.ts export  <tenant id> <file>
 *   tsx src/db/tenant-backup.ts restore <tenant id> <file>
 *
 * Scope: every tenant-scoped table (src/db/tenant-tables.ts) and every table hanging off them through Payload's
 * `_parent_id` / `parent_id` foreign keys (locales, blocks, relationships, versions, hasMany
 * selects), discovered from the catalogue so new collections are covered automatically.
 * Not in scope: the tenant row, users and memberships (platform-level records).
 * Restore runs in ONE transaction: delete the tenant's rows children-first, re-insert
 * parents-first with their original ids. Any failure rolls back and leaves the tenant as it was.
 */
import 'dotenv/config'
import { readFileSync, writeFileSync } from 'node:fs'
import { getPayload } from 'payload'
import config from '@payload-config'
import { TENANT_TABLES } from './tenant-tables'

const [mode, tenantArg, file] = process.argv.slice(2)
if (!['export', 'restore'].includes(mode) || !tenantArg || !file) {
  console.error('usage: tsx src/db/tenant-backup.ts export|restore <tenant id or slug> <file>')
  process.exit(2)
}

// Every tenant-scoped table (src/db/tenant-tables.ts): facts, rooms, offers, forms, issues… included.
const ROOTS: Record<string, string> = Object.fromEntries(TENANT_TABLES)

type Q = (sql: string, p?: unknown[]) => Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>
type Client = { query: Q; release: () => void }
const payload = await getPayload({ config })
const pool = (payload.db as unknown as { pool: { query: Q; connect: () => Promise<Client> } }).pool
const found = await pool.query(`select id from tenants where id::text = $1::text or slug::text = $1::text`, [tenantArg])
if (found.rows.length !== 1) throw new Error(`tenant ${tenantArg} not found`)
const tenant = Number(found.rows[0].id)

// Foreign keys inside the public schema: child.col -> parent.pcol
const fks = (
  await pool.query(`
    select c.conrelid::regclass::text as child, a.attname as col, a.attnotnull as notnull,
           c.confrelid::regclass::text as parent, af.attname as pcol
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
    join pg_attribute af on af.attrelid = c.confrelid and af.attnum = c.confkey[1]
    where c.contype = 'f' and c.connamespace = 'public'::regnamespace`)
).rows.map((r) => ({ child: unquote(r.child), col: String(r.col), notnull: Boolean(r.notnull), parent: unquote(r.parent), pcol: String(r.pcol) }))
function unquote(v: unknown) {
  return String(v).replace(/^"|"$/g, '')
}

// Scope: roots by tenant column, then children reachable through Payload's parent keys.
const pred: Record<string, string> = {}
for (const [t, col] of Object.entries(ROOTS)) pred[t] = `"${col}" = $1`
for (let grew = true; grew; ) {
  grew = false
  for (const fk of fks) {
    if (pred[fk.child] || !pred[fk.parent] || !['_parent_id', 'parent_id'].includes(fk.col)) continue
    pred[fk.child] = `"${fk.col}" in (select "${fk.pcol}" from "${fk.parent}" where ${pred[fk.parent]})`
    grew = true
  }
}
const tables = Object.keys(pred)

// Parents before children (Kahn), using every FK between in-scope tables. Nullable pointers
// from a root table to another (sites.current_release_id -> releases, while releases.site_id
// -> sites) form cycles: those edges are deferred, the column is inserted as NULL and set again
// after every table is in.
const deps = new Map(tables.map((t) => [t, new Set<string>()]))
const deferred: { table: string; col: string }[] = []
for (const fk of fks) {
  if (fk.child === fk.parent || !pred[fk.child] || !pred[fk.parent]) continue
  if (!fk.notnull && ROOTS[fk.child] && ROOTS[fk.parent]) {
    deferred.push({ table: fk.child, col: fk.col })
    continue
  }
  deps.get(fk.child)!.add(fk.parent)
}
const order: string[] = []
while (order.length < tables.length) {
  const next = tables.find((t) => !order.includes(t) && [...deps.get(t)!].every((d) => order.includes(d)))
  if (!next) throw new Error(`foreign-key cycle among: ${tables.filter((t) => !order.includes(t)).join(', ')}`)
  order.push(next)
}

if (mode === 'export') {
  const out: Record<string, unknown[]> = {}
  let total = 0
  for (const t of order) {
    const { rows } = await pool.query(`select coalesce(json_agg(x), '[]'::json) as j from "${t}" x where ${pred[t]}`, [tenant])
    out[t] = rows[0].j as unknown[]
    total += out[t].length
  }
  writeFileSync(file, JSON.stringify({ tenant, exportedAt: new Date().toISOString(), order, tables: out }))
  payload.logger.info(`exported tenant ${tenant}: ${total} rows from ${order.length} tables to ${file}`)
  process.exit(0)
}

const backup = JSON.parse(readFileSync(file, 'utf8')) as { tenant: number; tables: Record<string, unknown[]> }
if (backup.tenant !== tenant) throw new Error(`backup is for tenant ${backup.tenant}, not ${tenant}`)
const client = await pool.connect()
const started = Date.now()
try {
  await client.query('begin')
  let deleted = 0
  for (const t of [...order].reverse()) deleted += (await client.query(`delete from "${t}" where ${pred[t]}`, [tenant])).rowCount ?? 0
  let inserted = 0
  for (const t of order) {
    const rows = (backup.tables[t] ?? []) as Record<string, unknown>[]
    if (!rows.length) continue
    const nulled = deferred.filter((d) => d.table === t).map((d) => d.col)
    const data = nulled.length ? rows.map((r) => ({ ...r, ...Object.fromEntries(nulled.map((c) => [c, null])) })) : rows
    const r = await client.query(`insert into "${t}" select * from json_populate_recordset(null::"${t}", $1::json)`, [JSON.stringify(data)])
    inserted += r.rowCount ?? 0
  }
  for (const d of deferred) {
    const rows = (backup.tables[d.table] ?? []) as Record<string, unknown>[]
    if (!rows.length) continue
    await client.query(`update "${d.table}" t set "${d.col}" = v."${d.col}" from json_populate_recordset(null::"${d.table}", $1::json) v where t.id = v.id`, [JSON.stringify(rows)])
  }
  await client.query('commit')
  payload.logger.info(`restored tenant ${tenant}: deleted ${deleted}, inserted ${inserted} rows in ${Date.now() - started} ms`)
} catch (e) {
  await client.query('rollback')
  payload.logger.error(`restore rolled back: ${(e as Error).message}`)
  process.exitCode = 1
} finally {
  client.release()
}
process.exit(process.exitCode ?? 0)
