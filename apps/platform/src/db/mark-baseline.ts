/**
 * Adopts migrations on a database whose schema was created by dev push.
 * Records the baseline migration as applied (batch 1) and removes Payload's `dev` marker,
 * WITHOUT running it. Only safe after schema-fingerprint.ts shows the database matches a
 * fresh `payload migrate` of the baseline.
 * Usage: tsx src/db/mark-baseline.ts <baseline migration name>
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

const name = process.argv[2]
if (!name) {
  console.error('usage: tsx src/db/mark-baseline.ts <migration name>')
  process.exit(1)
}
const payload = await getPayload({ config })
type Pool = { query: (sql: string, p?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> }
const pool = (payload.db as unknown as { pool: Pool }).pool
// One statement, so it is atomic even through a pool.
await pool.query(
  `with d as (delete from payload_migrations where batch = -1)
   insert into payload_migrations (name, batch, updated_at, created_at)
   select $1::varchar, 1, now(), now()
   where not exists (select 1 from payload_migrations where name = $1::varchar)`,
  [name],
)
const rows = await pool.query(`select name, batch from payload_migrations order by id`)
payload.logger.info(`payload_migrations: ${JSON.stringify(rows.rows)}`)
process.exit(0)
