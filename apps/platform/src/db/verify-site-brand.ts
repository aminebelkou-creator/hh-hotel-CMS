/**
 * Post-migration check for 20260923_132537_site_brand_timezone: every tenant's site carries its
 * tenant's name as brand_name and the default time zone. Read-only; exits non-zero on any miss.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })
type Pool = { query: (sql: string) => Promise<{ rows: Record<string, unknown>[] }> }
const pool = (payload.db as unknown as { pool: Pool }).pool
const { rows } = await pool.query(
  `select t.id, t.slug, count(s.id)::int as sites,
          count(*) filter (where s.brand_name = t.name)::int as branded,
          count(*) filter (where s.timezone = 'Europe/Paris')::int as tz
   from tenants t left join sites s on s.tenant_id = t.id group by t.id, t.slug order by t.id`,
)
const bad = rows.filter((r) => r.sites !== r.branded || r.sites !== r.tz || r.sites === 0)
payload.logger.info(`site brand check: ${rows.length} tenants, ${rows.length - bad.length} ok, ${bad.length} failing`)
for (const r of bad) payload.logger.error(`tenant ${r.slug}: sites=${r.sites} branded=${r.branded} tz=${r.tz}`)
process.exit(bad.length ? 1 : 0)
