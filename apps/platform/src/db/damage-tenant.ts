/**
 * REHEARSAL ONLY: simulates an incident on one tenant (defaced pages, a lost domain) so the
 * restore path can be proven. Refuses to run unless DATABASE_URL is local or ALLOW_DAMAGE=1.
 *   tsx src/db/damage-tenant.ts <tenant slug>
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

const slug = process.argv[2]
const local = /@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL || '')
if (!slug || (!local && process.env.ALLOW_DAMAGE !== '1')) {
  console.error('usage: tsx src/db/damage-tenant.ts <slug>; non-local databases need ALLOW_DAMAGE=1')
  process.exit(2)
}
const payload = await getPayload({ config })
type Q = (sql: string, p?: unknown[]) => Promise<{ rowCount: number | null }>
const pool = (payload.db as unknown as { pool: { query: Q } }).pool
const t = `(select id from tenants where slug = $1)`
const a = await pool.query(`update pages set slug = slug || '-defaced' where tenant_id = ${t}`, [slug])
const b = await pool.query(
  `update pages_locales set title = 'DEFACED' where _parent_id in (select id from pages where tenant_id = ${t})`,
  [slug],
)
const c = await pool.query(`delete from domains where tenant_id = ${t}`, [slug])
payload.logger.warn(`damaged ${slug}: ${a.rowCount} page slugs, ${b.rowCount} titles, ${c.rowCount} domains deleted`)
process.exit(0)
