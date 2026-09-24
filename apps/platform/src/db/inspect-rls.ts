/** Read-only diagnostic: current role, whether it bypasses RLS, RLS flags and policies. */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })
type Pool = { query: (sql: string) => Promise<{ rows: unknown[] }> }
const pool = (payload.db as unknown as { pool: Pool }).pool
const q = async (sql: string) => (await pool.query(sql)).rows
console.log(JSON.stringify(await q(
  `select current_user as role, r.rolsuper as super, r.rolbypassrls as bypassrls,
          pg_has_role(current_user, 'neon_superuser', 'member') as neon_superuser
   from pg_roles r where r.rolname = current_user`,
).catch(() => q(`select current_user as role, r.rolsuper as super, r.rolbypassrls as bypassrls from pg_roles r where r.rolname = current_user`))))
console.log(JSON.stringify(await q(
  `select c.relname t, c.relrowsecurity rls, c.relforcerowsecurity force, pg_get_userbyid(c.relowner) owner
   from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in ('sites','pages','_pages_v','media','domains','releases','facts','rooms') order by 1`,
)))
console.log(JSON.stringify(await q(`select count(*)::int policies from pg_policies where schemaname = 'public' and policyname = 'tenant_isolation'`)))
process.exit(0)
