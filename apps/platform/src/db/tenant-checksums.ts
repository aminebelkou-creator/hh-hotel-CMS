/**
 * Per-tenant data checksums, for proving a migration or restore touched only what it should.
 *   tsx src/db/tenant-checksums.ts snapshot <file> [--ignore col,col]
 *   tsx src/db/tenant-checksums.ts verify   <file> [--ignore col,col] [--only-tenants 1,2]
 * `verify` exits non-zero if any tenant's checksum differs from the snapshot. Columns listed in
 * --ignore (plus updated_at) are excluded, so a migration's intended change does not count.
 * With --only-tenants, those tenants are EXPECTED to differ and every other tenant must match.
 */
import 'dotenv/config'
import { readFileSync, writeFileSync } from 'node:fs'
import { getPayload } from 'payload'
import config from '@payload-config'

const [mode, file] = process.argv.slice(2)
const arg = (flag: string) => {
  const i = process.argv.indexOf(flag)
  return i > 0 ? process.argv[i + 1].split(',').filter(Boolean) : []
}
const ignore = ['updated_at', ...arg('--ignore')]
const expectedChanged = new Set(arg('--only-tenants'))

const TABLES: [string, string][] = [
  ['sites', 'tenant_id'],
  ['pages', 'tenant_id'],
  ['_pages_v', 'version_tenant_id'],
  ['media', 'tenant_id'],
  ['domains', 'tenant_id'],
  ['releases', 'tenant_id'],
  ['facts', 'tenant_id'],
  ['rooms', 'tenant_id'],
  ['offers', 'tenant_id'],
]

const payload = await getPayload({ config })
type Pool = { query: (sql: string, p?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> }
const pool = (payload.db as unknown as { pool: Pool }).pool
const strip = ignore.map((c) => ` - '${c.replace(/'/g, '')}'`).join('')

const sums: Record<string, Record<string, string>> = {}
for (const [table, col] of TABLES) {
  // A table a pending migration will create does not exist yet: nothing to snapshot there.
  const exists = await pool.query(`select to_regclass($1) as t`, [`public."${table}"`])
  if (!exists.rows[0]?.t) continue
  const { rows } = await pool.query(
    `select ${col}::text as tenant, md5(string_agg((to_jsonb(t)${strip})::text, '|' order by id)) as sum, count(*)::int as n
     from "${table}" t where ${col} is not null group by 1`,
  )
  for (const r of rows) {
    const tenant = String(r.tenant)
    sums[tenant] ??= {}
    sums[tenant][table] = `${r.n}:${r.sum}`
  }
}
// Localised page fields live in pages_locales; include them per tenant through the parent page.
const loc = await pool.query(
  `select p.tenant_id::text as tenant, md5(string_agg((to_jsonb(l)${strip})::text, '|' order by l.id)) as sum
   from pages_locales l join pages p on p.id = l._parent_id group by 1`,
)
for (const r of loc.rows) (sums[String(r.tenant)] ??= {}).pages_locales = String(r.sum)

if (mode === 'snapshot') {
  writeFileSync(file, JSON.stringify(sums, null, 1))
  payload.logger.info(`snapshot of ${Object.keys(sums).length} tenants written to ${file}`)
  process.exit(0)
}
if (mode !== 'verify') {
  console.error('mode must be snapshot or verify')
  process.exit(2)
}
const before = JSON.parse(readFileSync(file, 'utf8')) as typeof sums
const tenants = new Set([...Object.keys(before), ...Object.keys(sums)])
const unexpected: string[] = []
const changed: string[] = []
const tablesChanged: Record<string, number> = {}
for (const t of tenants) {
  const same = JSON.stringify(before[t] ?? {}) === JSON.stringify(sums[t] ?? {})
  if (!same) {
    changed.push(t)
    const tables = [...new Set([...Object.keys(before[t] ?? {}), ...Object.keys(sums[t] ?? {})])]
    for (const tb of tables) if ((before[t] ?? {})[tb] !== (sums[t] ?? {})[tb]) tablesChanged[tb] = (tablesChanged[tb] ?? 0) + 1
  }
  if (!same && !expectedChanged.has(t)) unexpected.push(t)
  if (same && expectedChanged.has(t)) unexpected.push(`${t} (expected a change, found none)`)
}
payload.logger.info(
  `verified ${tenants.size} tenants: ${changed.length} changed, ${unexpected.length} unexpected` +
    (unexpected.length ? ` -> ${unexpected.join(', ')}` : '') +
    (Object.keys(tablesChanged).length ? `; tables changed: ${JSON.stringify(tablesChanged)}` : ''),
)
process.exit(unexpected.length ? 1 : 0)
