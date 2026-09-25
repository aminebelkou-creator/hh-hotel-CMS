/**
 * The one list of tenant-scoped tables and their tenant column. Everything that reasons about
 * the tenant boundary at the database level reads it: RLS (rls.sql mirrors it and CI checks
 * both agree), per-tenant checksums, single-tenant backup and restore, the RLS tests.
 * Adding a tenant-scoped collection means adding a row here AND in rls.sql.
 */
export const TENANT_TABLES: readonly [table: string, column: string][] = [
  ['sites', 'tenant_id'],
  ['pages', 'tenant_id'],
  ['_pages_v', 'version_tenant_id'],
  ['media', 'tenant_id'],
  ['domains', 'tenant_id'],
  ['releases', 'tenant_id'],
  ['facts', 'tenant_id'],
  ['rooms', 'tenant_id'],
  ['offers', 'tenant_id'],
  ['redirects', 'tenant_id'],
  ['forms', 'tenant_id'],
  ['form_submissions', 'tenant_id'],
  ['crawls', 'tenant_id'],
  ['issues', 'tenant_id'],
  ['audit_log', 'tenant_id'],
]
export const TENANT_TABLE_NAMES = TENANT_TABLES.map(([t]) => t)
