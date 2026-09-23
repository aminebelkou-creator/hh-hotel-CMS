# Week-1 spike results — 23 September 2026

## Isolation proof of concept

| Item | Result |
| --- | --- |
| Stack | Next.js 16.3.3, Payload 3.90.1, Postgres 16 (Docker), `@payloadcms/plugin-multi-tenant`, `@payloadcms/plugin-mcp` |
| Seed | 50 tenants, 51 users, 50 sites, 150 pages, 50 domains in 6.3 s |
| Local API isolation matrix | 13/13 green: read, find-by-where, create, update, delete, move-to-other-tenant, join-other-tenant, self-promotion, tenant list, sites/domains/releases, 10 random pairs both directions |
| overrideAccess audit | Green; caught an unlisted debug file on first run, which is the point |
| REST + GraphQL isolation | 2/2 green against a live server |
| **Total** | **17/17** |

Postgres RLS is covered below. Not yet covered: admin-UI tenant selector behaviour, bulk operations, imports, jobs, backup/restore of a single tenant, schema migration at 50 tenants, a Payload upgrade. These are the rest of the proof.

## Makers deploy

| Measure | Value |
| --- | --- |
| Static hello-world, first deploy | 49.6 s end to end |
| Static re-publish | 37.7 s |
| Next.js + Payload app, end to end | **154 s** (upload ~40 s, remote build ~110 s) |
| Local production build for comparison | ~16 s warm |
| Result | Build and deploy succeed; runtime returns 500 on every route because `DATABASE_URL` points at localhost |

The CLI uploads the project folder and builds remotely. Build logs are not available from the CLI; a failed build shows only "Deployment failed". Reproducing locally with `pnpm run build` found the cause in minutes.

## Findings

1. **Field named `locales` breaks Payload on Postgres.** A `hasMany` select called `locales` creates `sites_locales`, which collides with the table Payload uses for localised fields. Renamed `enabledLocales`. Worth a lint rule.
2. **The MCP plugin adds an auth collection**, so `req.user` can be an API key without `email`. Any code reading user fields must narrow the type first.
3. **Vitest injects `BASE_URL="/"`**, shadowing any variable of that name. Use `PLATFORM_URL`.
4. **Turbopack in a pnpm monorepo** needs `turbopack.root` at the repository root, not the app.
5. **UTF-8 BOMs** written by Windows PowerShell break `tsx`'s package.json parser. Write files as UTF-8 without BOM.
6. **The deploy uploads the whole app folder, including `.env`.** Production must use Makers environment variables and must not ship `.env`; confirm an ignore mechanism before any real secret exists.
7. **Publish-to-live of 154 s misses the 60 s target** in the plan. Remote build dominates. Options: build in CI and upload the artifact, trim the server bundle, or accept that the 60 s target applies to content releases, not code deploys. Decide before Gate 2.

## Running on Makers against Neon Frankfurt — done

| Measure | Value |
| --- | --- |
| Database | Neon free tier, pooled endpoint, `eu-central-1` (Frankfurt) |
| Configuration | `DATABASE_URL` and a fresh `PAYLOAD_SECRET` set as Makers project environment variables (production and preview); `.env` excluded from the upload |
| Seed over the network | 257 s (6.3 s against local Postgres): per-row round trips dominate |
| Deploy end to end | 153 s |
| Live responses, cold | `/` 1.9 s, `/admin` 0.96 s, `/api/users/me` 0.71 s, login 0.58 s |
| Tenant 1 via live API | sees exactly its 3 pages |
| REST + GraphQL isolation against the live URL | **2/2 green** |
| Local API isolation + overrideAccess audit against Neon | **15/15 green** (54 s over the network) |
| **Total on production infrastructure** | **17/17** |

The platform runs end to end on EdgeOne Makers with EU data: Frankfurt cloud functions, Frankfurt Postgres.

Consequences to carry forward: the 257 s seed shows that bulk operations (imports, migrations, generation writes) must be batched or run close to the database, never row-by-row across regions. Latencies above are single cold requests from Paris, not a benchmark.

## Row-level security as defence in depth — evaluated on Neon Frankfurt

Files: `apps/platform/src/db/rls.sql`, `src/db/apply-rls.ts`, `src/db/inspect-rls.ts`, `tests/int/rls.int.spec.ts`, `tests/int/rls-payload.int.spec.ts`.

Design: a policy `tenant_isolation` on `sites`, `pages`, `_pages_v`, `media`, `domains`, `releases`, keyed on the tenant column, reading the tenant list from `SET LOCAL app.tenant_ids`. Context-optional: with no tenant declared, access is unrestricted, so nothing breaks while the application does not yet set the context. A restricted role `hh_app_rls` (no login, no BYPASSRLS) is what the policies bind.

| Test | Result |
| --- | --- |
| RLS enabled and forced on all six tenant tables | green |
| Raw SQL as tenant A: sees only its 3 pages; cannot see B's pages, sites, domains or page versions | green |
| Raw SQL as tenant A: update and delete of B rows affect 0 rows | green |
| Raw SQL as tenant A: moving a row into tenant B is refused by `WITH CHECK` | green |
| Restricted role with no context: unrestricted (context-optional mode) | green |
| **Payload `find()` with `overrideAccess: true`** in a transaction scoped to tenant A: returns only A's 3 pages | green |
| **Payload `update()` with `overrideAccess: true`** of a B page by id, scoped to A: 0 docs changed, page intact | green |
| Full suite with RLS applied (isolation 13, audit 2, REST/GraphQL 2 against the live Makers URL, RLS 7, RLS-under-Payload 2) | **26/26 green** |

The two Payload tests are the real result: with application access control switched off entirely, the database alone kept the tenant boundary for Payload's own queries. That is what defence in depth means here, and the pattern (`SET LOCAL ROLE` plus `set_config` at the start of a Payload transaction) is what a per-request hook would do.

### Findings

8. **The connection role bypasses RLS.** Neon's `neondb_owner` has `BYPASSRLS`; a local Docker `postgres` is superuser. Under either, the policies are inert, whatever `FORCE ROW LEVEL SECURITY` says. RLS only protects queries that run as a restricted role. The production answer is a dedicated login role without BYPASSRLS for the application, with the owner role kept for migrations only. A test asserts this so it cannot be forgotten.
9. **Payload's dev-mode schema push silently removes RLS.** Every `getPayload()` in development pulls the schema and pushes Drizzle's view of it, which drops policies it does not know and disables RLS. It ran against Neon from scripts and tests because push defaulted to on. Fixed: push is now enabled only when `DATABASE_URL` points at localhost; shared databases change through migrations only, and RLS must be applied by a migration that runs after Payload's.
10. **Running the suite with the wrong password locks accounts.** Payload's login lockout triggered on the rotated Neon users after one run without `SEED_PASSWORD`. Fixed: seed constants refuse to load against a non-local database without `SEED_PASSWORD`, and `rotate-passwords.ts` also clears lockouts.

### Decision proposed for week 4 (RLS evaluated per the proof)

Adopt RLS in enforcing mode for request traffic, in three steps: a dedicated application login role without BYPASSRLS; a Payload hook that opens each request's transaction with `SET LOCAL ROLE` and the user's tenant ids (super-admins and system jobs use the owner role explicitly, and each such path joins the overrideAccess allowlist); then flip the policy from context-optional to deny-by-default. Payload access control remains the primary boundary; RLS catches whatever a future bug in it lets through.
