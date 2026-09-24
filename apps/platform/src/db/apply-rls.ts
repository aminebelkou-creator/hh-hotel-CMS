/**
 * Applies src/db/rls.sql through Payload's own Postgres pool.
 * Usage: tsx src/db/apply-rls.ts            (apply)
 *        tsx src/db/apply-rls.ts --remove   (disable RLS and drop the policies)
 */
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { getPayload } from 'payload'
import config from '@payload-config'

const TABLES = ['sites', 'pages', '_pages_v', 'media', 'domains', 'releases', 'facts', 'rooms']
const payload = await getPayload({ config })
const pool = (payload.db as unknown as { pool: { query: (sql: string) => Promise<unknown> } }).pool

if (process.argv.includes('--remove')) {
  for (const t of TABLES) {
    await pool.query(`drop policy if exists tenant_isolation on "${t}"; alter table "${t}" no force row level security; alter table "${t}" disable row level security;`)
  }
  payload.logger.info('RLS removed')
} else {
  const sql = readFileSync(new URL('./rls.sql', import.meta.url), 'utf8')
  await pool.query(sql)
  payload.logger.info(`RLS applied to ${TABLES.length} tables`)
}
process.exit(0)
