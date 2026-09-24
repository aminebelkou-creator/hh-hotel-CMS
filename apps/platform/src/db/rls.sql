-- Row-level security as defence in depth under Payload's access control.
--
-- Mode: CONTEXT-OPTIONAL. When a session declares its tenants with
--   SET LOCAL app.tenant_ids = '12,34'
-- Postgres enforces that only those tenants' rows are visible or writable.
-- When nothing is declared, the policy allows access, so Payload (which does not
-- set the context today) keeps working unchanged.
--
-- This proves the database-level boundary and that Payload's lifecycle tolerates RLS.
-- It does NOT yet protect Payload's own queries: that needs the tenant context set per
-- request inside Payload's transactions (see docs/05-week1-spike-results.md).

create or replace function app_tenant_ids() returns int[]
language sql stable as $$
  select case
    when coalesce(current_setting('app.tenant_ids', true), '') = '' then null
    else string_to_array(current_setting('app.tenant_ids', true), ',')::int[]
  end
$$;

do $$
declare
  t record;
begin
  for t in
    select * from (values
      ('sites', 'tenant_id'),
      ('pages', 'tenant_id'),
      ('_pages_v', 'version_tenant_id'),
      ('media', 'tenant_id'),
      ('domains', 'tenant_id'),
      ('releases', 'tenant_id'),
      ('facts', 'tenant_id'),
      ('rooms', 'tenant_id'),
      ('offers', 'tenant_id')
    ) as v(tbl, col)
  loop
    execute format('alter table %I enable row level security', t.tbl);
    execute format('alter table %I force row level security', t.tbl);
    execute format('drop policy if exists tenant_isolation on %I', t.tbl);
    execute format(
      'create policy tenant_isolation on %I using (app_tenant_ids() is null or %I = any(app_tenant_ids())) with check (app_tenant_ids() is null or %I = any(app_tenant_ids()))',
      t.tbl, t.col, t.col
    );
  end loop;
end $$;

-- A restricted application role. Policies only bind roles that are neither superuser nor
-- BYPASSRLS; Neon's neondb_owner has BYPASSRLS and a local Docker `postgres` is superuser,
-- so under either of them the policies above are inert. The application must run its
-- queries as this role (SET ROLE per transaction, or a dedicated login) for RLS to bite.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'hh_app_rls') then
    create role hh_app_rls nologin nobypassrls;
  end if;
end $$;
grant usage on schema public to hh_app_rls;
grant select, insert, update, delete on all tables in schema public to hh_app_rls;
grant usage, select on all sequences in schema public to hh_app_rls;
grant hh_app_rls to current_user;
