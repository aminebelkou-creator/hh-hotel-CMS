/**
 * Prints a fingerprint of the public schema (columns, types, defaults, constraints, indexes)
 * so two databases can be compared without pg_dump access. Read-only.
 * Usage: tsx src/db/schema-fingerprint.ts [--list]
 */
import 'dotenv/config'
import { createHash } from 'node:crypto'
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })
type Pool = { query: (sql: string) => Promise<{ rows: Record<string, unknown>[] }> }
const pool = (payload.db as unknown as { pool: Pool }).pool

const parts: string[] = []
const add = async (label: string, sql: string) => {
  const { rows } = await pool.query(sql)
  for (const r of rows) parts.push(`${label}|${Object.values(r).join('|')}`)
}
await add('col', `select table_name, column_name, data_type, udt_name, is_nullable, coalesce(column_default,'')
  from information_schema.columns where table_schema='public' order by 1,2`)
await add('con', `select conrelid::regclass::text, contype, pg_get_constraintdef(oid)
  from pg_constraint where connamespace='public'::regnamespace and contype <> 'n' order by 1,2,3`)
// contype 'n' (NOT NULL as a catalogued constraint) exists on newer Postgres (Neon) but not on 16;
// nullability is already captured by the column rows above.
await add('idx', `select tablename, indexdef from pg_indexes where schemaname='public' order by 1,2`)
await add('enum', `select t.typname, string_agg(e.enumlabel, ',' order by e.enumsortorder)
  from pg_type t join pg_enum e on e.enumtypid=t.oid join pg_namespace n on n.oid=t.typnamespace
  where n.nspname='public' group by 1 order by 1`)

// Payload's own bookkeeping table content differs by design; exclude it from the hash.
const relevant = parts.filter((p) => !p.includes('payload_migrations'))
const hash = createHash('sha256').update(relevant.join('\n')).digest('hex').slice(0, 16)
console.log(`schema fingerprint ${hash} (${relevant.length} items)`)
if (process.argv.includes('--list')) console.log(relevant.join('\n'))
process.exit(0)
