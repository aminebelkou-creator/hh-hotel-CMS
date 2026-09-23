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

## Migrations, schema change at 10 and 50 tenants, single-tenant restore — 23 September 2026

### Baseline: from dev push to migrations

The local and Neon databases had been created by Payload's dev push. From now on every shared database changes only through migrations, so a baseline was needed without re-creating tables that already hold data.

| Step | Result |
| --- | --- |
| `payload migrate:create baseline` | `20260923_120049_baseline`: the whole schema, 32 KB of SQL |
| Fresh database migrated from the baseline, compared with the pushed ones | Identical schema fingerprint `8d47087d7592c97b` (442 columns, constraints, indexes, enums) on local push, fresh migrate and Neon |
| Adoption on local and Neon | `src/db/mark-baseline.ts` records the baseline as applied and removes Payload's `dev` marker. `migrate:status` shows `Ran: Yes, batch 1` on both |

Finding 11: Neon runs a newer Postgres that records NOT NULL as catalogue constraints (`contype = 'n'`). A naive schema comparison reports 104 false differences. The fingerprint tool ignores them, since nullability is already compared per column.

### Schema change across tenants

Migration `20260923_132537_site_brand_timezone` adds `sites.brand_name` and `sites.timezone` (default `Europe/Paris`), and backfills `brand_name` from the tenant name in one set-based `UPDATE ... FROM tenants`. It runs through `scripts/migration-rehearsal.ps1`: snapshot per-tenant checksums, `payload migrate`, verify every tenant, then run the migration's own check.

| Database | Tenants | Migration SQL | `payload migrate` end to end | Other data changed | Backfill check |
| --- | --- | --- | --- | --- | --- |
| Local Docker | 10 | 5 ms | 7.6 s | 0 tenants | 10/10 |
| Local Docker | 50 | 6 ms | 7.6 s | 0 tenants | 50/50 |
| **Neon Frankfurt** | **50** | **332 ms** | 10.4 s | **0 tenants** | **50/50** |

End-to-end time is mostly Payload start-up. Because the SQL is set-based, the cost over the network is one round trip, not one per tenant. That is the lesson of the 257 s row-by-row seed, applied.

### Single-tenant backup and restore

`src/db/tenant-backup.ts` exports one tenant and restores it in a single transaction. It covers the six tenant tables plus every table hanging off them through Payload's parent keys, found from the Postgres catalogue: 18 tables for one tenant, including locales, blocks, versions and hasMany selects. The restore deletes the tenant's rows children-first and re-inserts them parents-first with their original ids. Any error rolls the whole restore back.

The rehearsal is `scripts/restore-rehearsal.ps1`: snapshot all tenants, export `tenant-07`, damage it (3 page slugs defaced, 3 titles overwritten, its domain deleted), verify, restore, verify again.

| Step | Local (50 tenants) | Neon Frankfurt (50 tenants) |
| --- | --- | --- |
| Export | 28 rows, 18 tables | 28 rows, 18 tables |
| After damage | 1 tenant changed (the damaged one), 0 unexpected | 1 changed, 0 unexpected |
| Restore transaction | 35 ms | 1,690 ms |
| After restore | **0 tenants differ from the snapshot** | **0 tenants differ from the snapshot** |

Out of scope by design: the tenant row itself, users and memberships (platform-level records). Also out of scope: Payload's document-lock rows, which a restore clears through cascade. A restore also does not replace a database backup. Neon's point-in-time recovery remains the disaster-recovery layer; this tool is for "restore one hotel without touching the other forty-nine".

### Payload upgrade rehearsal

3.90.1 is the latest stable Payload release. A 4.0 line exists only as canaries. So the rehearsal proves the path from the previous release, 3.89.0, to 3.90.1. The script is `scripts/upgrade-rehearsal.ps1`. For each version it pins every Payload package, installs, typechecks, checks for schema drift with `migrate:create --skip-empty`, and runs the isolation and RLS suites. The old version writes the users' credentials, so the new one must accept them.

| Check | 3.89.0 | 3.90.1 |
| --- | --- | --- |
| Install, typecheck | pass | pass |
| Schema drift against our migrations | **yes**: 3.90 added `users.reset_password_requested_at` | none |
| Credentials written by 3.89.0 | accepted | **accepted** |
| Credentials written by 3.90.1 | **rejected, account locked after 5 attempts** | accepted |
| Isolation + RLS suites (10 tenants, credentials from 3.89.0) | pass, apart from 50-tenant assumptions (fixed) | pass |

Findings:

12. **Payload minor releases can carry schema changes.** 3.90 added a column to `users`. With push off on shared databases, every upgrade must run `migrate:create` and ship a migration, and the rehearsal's drift check catches it.
13. **Payload upgrades are one-way.** 3.90 stores password hashes in a new, prefixed PBKDF2 format (81 characters against 1,024 hex characters before). 3.89 cannot verify them, so a code rollback locks out everyone who logged in or changed a password after the upgrade. The rollback plan for a bad upgrade is therefore a forward fix, or a database restore together with the previous release. Downgrading packages is not an option. This goes into the release runbook.
14. Two tests assumed exactly 50 tenants. They now scale with `SEED_TENANTS`, so the suite runs at 10 and at 50.

## Bulk operations, imports, jobs and the admin tenant selector — 23 September 2026

`tests/int/isolation-extended.int.spec.ts` (Local API, 7 tests) plus one REST test. The suite creates its own probe pages and removes them afterwards.

| Path | Test | Result |
| --- | --- | --- |
| Bulk update | Tenant A user updates `where slug like 'iso-probe-'` while matching rows exist in A and B | Only A's 2 rows change; B's row untouched |
| Bulk delete | Same `where`, delete | Only A's 2 rows deleted; B's row still there |
| Bulk re-tenant | A tries to move every visible row to B in one update | Rows stay in A |
| Imports | A batch of two rows, one naming A, one naming B | A's row lands, B's row refused, row by row |
| Imports without tenant | A row with no tenant field | Not placed in B |
| Background job | A job queued for tenant A that names a tenant B page | B's page unchanged |
| Background job, control | The same job naming an A page | A's page updated, so the negative result is not a no-op |
| Admin tenant selector (REST) | A user forges the `payload-tenant` cookie with B's id | Cannot list or read B's page; a create without a tenant does not land in B |

Findings:

15. **Jobs run without a user, so access control does not apply to them.** The pattern is `src/jobs/touchPageSeo.ts`. The tenant travels in the job input, and every query inside the job filters on it. Job files are on the `overrideAccess` allowlist, and each needs a test like the one above.
16. **Every new job task is a migration.** Payload stores task slugs as a Postgres enum, so adding a task changes the schema (`add_jobs`). Completed jobs are deleted by default, so the audit trail for agent work has to be written deliberately, not read back from the jobs table.

## Two colliding Makers publishes — 23 September 2026

Script: `scripts/collide-publishes.ps1`. It deployed a scratch static project (`hh-collide-test`) twice within 64 ms, as versions A and B, on the free plan with its single build slot.

| Deploy | Started | Finished | Duration | Exit |
| --- | --- | --- | --- | --- |
| A | 14:26:45.086 | 14:27:32.307 | 47 s | 0 |
| B | 14:26:45.150 | 14:27:15.060 | 30 s | 0 |

Five seconds later the live URL served **version A**: the deploy that started first but **finished last**.

Finding 17: **Makers accepts concurrent deploys, queues them and does not reject either one. The last to finish goes live, whatever order they started in.** Both report success, so a slower, older publish can silently overwrite a newer one. The release pipeline must therefore serialise publishes per project itself, one at a time with the newest intent winning, and verify what is live after every publish. It cannot rely on the host to refuse a collision.

## Proof of concept redeployed on the migrated schema — 23 September 2026

| Attempt | What was uploaded | Result |
| --- | --- | --- |
| 1 | `apps/platform` including a local `.next` (320 MB with build cache) | Upload about 4 min, then the remote build sat in `Process` for about 580 s: **Timeout**, 837 s in total. The live site kept serving the previous deployment (200 on `/`, `/admin`, `/api/users/me`) |
| 2 | The same folder with `.next` removed (`scripts/deploy-poc.ps1` now does this) | **Success in 177 s**, deployment `dpzceky1owv0` |

Afterwards the whole suite ran against Neon and the live URL: **34/34** (isolation 13, extended 7, audit 2, REST/GraphQL/tenant-cookie 3, RLS 7, RLS under Payload 2).

Finding 18: **the CLI uploads local build output**, and a large upload can push the remote build into a timeout. A failed or timed-out deploy does not replace the live version, which is the right failure mode. Deploys must start from a clean tree, in CI or with `.next` removed.

## CI on GitHub Actions — 23 September 2026

| Workflow | Run | Result |
| --- | --- | --- |
| `ci` (on push) | first run, `72a9ee0` | **Green on the first attempt in about 2 min**. It builds a Postgres from the committed migrations only, finds no schema drift, seeds 10 tenants, typechecks, runs the isolation, extended, audit and both RLS suites, does a production build, then runs REST/GraphQL/tenant-cookie against the built app. 34 tests in all |
| `deploy` (manual) | first run | Migrate Neon and re-apply RLS: **green from CI**. The Makers deploy step failed with `Invalid EDGEONE_PAGES_API_TOKEN` |

Finding 21: **the token saved on 22 September (a copy of the CLI's browser-login token) is not accepted for deploys from CI.** The CLI on the PC deploys with its own stored login instead, so the copy was never tested until now. Unattended deploys need a dedicated Makers API token created in the console, with the longest expiry, stored as the `EDGEONE_PAGES_API_TOKEN` GitHub secret and rotated on a calendar.

**Re-run with a dedicated Makers API token (16:25): green.** It migrated Neon, re-applied RLS and deployed to Makers in **171 s** (deployment `dpae1gtbybv0`); the live site answers 200. From now on, releases no longer depend on the owner's PC.

Finding 22: **adding a custom domain is disabled in the Makers console for this project** (reported by the owner, 23 September). Likely causes, to confirm with Tencent: the free plan, the direct-upload project type, or the project's area. Together with finding 20 (no `teo` API access to Makers domains), customers' own domains are the least-proven part of the Makers option. The domain test on `site.ouilockers.fr` is deferred until Tencent answers.
