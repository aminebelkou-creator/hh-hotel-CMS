# Handoff

Read this first when you pick the project up, whether you are a person or an AI agent. It says where things stand, what changed since the last handoff, and what to do next.

**How this file works**

- **Current state** is rewritten at the end of every working session. It is always true as of the commit named in it.
- **Delta log** is append-only, newest first. One entry per working session: what changed, what was learned, what was left undone. Never edit an old entry; correct it in a new one.
- The plan is [`docs/02-90-day-plan.md`](docs/02-90-day-plan.md) (the baseline, changed only by decision). Progress is tracked in [`docs/CHECKLIST.md`](docs/CHECKLIST.md) (ticked in the commit that completes an item). This file connects the two: how today differs from the plan, and why.

---

## Current state — 23 September 2026, 14:10 local time

### Where we are

| | |
| --- | --- |
| Plan position | Day −5. The 90-day plan starts Monday 28 September; engineering started early on 22 September |
| Week 1 engineering | **Done early**: isolation proof, 50-tenant seed, first Makers deploys, cross-team contract drafts |
| Week 2 proof items | **4 of 6 done**: row-level security, schema migration at 10 and 50 tenants, Payload upgrade path, single-tenant restore. Open: admin/bulk/imports/jobs coverage, colliding publishes |
| Isolation suite | **26/26 green on Neon** after the new migration, REST/GraphQL against the live URL; 24/24 locally at 10 and 50 tenants |
| Deploy time | 153 s for a code deploy; the plan's target is 60 s (open decision, Gate 2) |
| Gate 1 (week 3) | Waiting on Tencent. The email is drafted but not sent |
| Tooling | Remote Desktop Commander drops its connection every few minutes. Recommended: move to Claude Code on the PC with Remote Control (see Next actions 1) |

### What exists

| Thing | Where | State |
| --- | --- | --- |
| Platform app | `apps/platform` | Next.js 16.3.3, Payload 3.90.1 (latest stable), Postgres. Seven collections, multi-tenant plugin, MCP plugin (no delete tools). Sites now have `brandName` and `timezone` |
| Migrations | `apps/platform/src/migrations` | `20260923_120049_baseline` (whole schema), `20260923_132537_site_brand_timezone` (columns + set-based backfill). Applied on local and Neon; `migrate:status` clean |
| Test suites | `apps/platform/tests/int` | isolation (13), overrideAccess audit (2), REST/GraphQL (2), RLS raw SQL (7), RLS under Payload (2). Scale with `SEED_TENANTS` |
| Database tools | `apps/platform/src/db` | `rls.sql` + `apply-rls.ts`, `inspect-rls.ts`, `schema-fingerprint.ts`, `mark-baseline.ts`, `tenant-checksums.ts`, `tenant-backup.ts` (export/restore one tenant), `damage-tenant.ts` (rehearsal only), `verify-site-brand.ts` |
| Rehearsal scripts | `scripts/` | `migration-rehearsal.ps1`, `restore-rehearsal.ps1`, `upgrade-rehearsal.ps1`, `run-suites.ps1` (local-10, local-50, Neon) |
| RLS | `src/db/rls.sql` | Context-optional policies plus restricted role `hh_app_rls`, applied on Neon and local. Not yet enforced for real requests: the app connects as the owner role |
| Live proof of concept | https://hh-platform-poc.edgeone.cool | Makers project `hh-platform-poc` (`makers-gznjppyen95y`), Frankfurt. **Still runs the code from before today's migration** (works: the new columns are nullable). Redeploy when convenient |
| Database | Neon free tier, `eu-central-1`, pooled endpoint, database `neondb` | 50 tenants, 51 users, 50 sites, 150 pages, 50 domains; migrations applied |
| Local databases | Docker `hh-postgres`, port 5432 | `hh_platform` (50 tenants) and `hh_check` (10 tenants, built purely from migrations) |
| Documents | `docs/` | Spec (*Hotelier Website Platform — Solution Definition*), plan, checklist, evaluations, spike results (findings 1–14), contracts v0.1, Tencent email draft |

### Watch out

- **Schema changes go through migrations only**: change the collection, `pnpm payload migrate:create <name>`, rehearse with `scripts/migration-rehearsal.ps1` locally, then `payload migrate` on Neon. Push is on only for localhost, and `PAYLOAD_DB_PUSH=false` turns it off there too.
- **Never downgrade Payload.** 3.90 changed the password-hash format; older versions lock users out. Every upgrade runs `scripts/upgrade-rehearsal.ps1` and ships the migration it reveals.
- **One seed password everywhere**: local and Neon users both use the value in user environment variable `HH_NEON_SEED_PASSWORD`; set `SEED_PASSWORD` from it before tests. Wrong-password runs lock accounts; `rotate-passwords.ts` unlocks them.
- `apps/platform/.env` now points at local Docker. Neon is reached by setting `DATABASE_URL` from `NEON_DATABASE_URL` for one command.
- A dev server may still be running on port 3000 (PID 73616, started against Neon before the migration). Stop it by that exact PID only, never by process name.

### Next actions, in order

| # | Owner | Action | Why now | Done when |
| --- | --- | --- | --- | --- |
| 1 | OWN + ENG | Switch tooling: Claude Code on the PC with Remote Control (`claude --remote-control "hh-hotel-CMS"`), plus a permissions allow-list in `.claude/settings.json` | Desktop Commander's relay drops every few minutes | A session runs the suites from the phone without drops |
| 2 | ENG | GitHub Actions: isolation suite on a Postgres service at every push; migrations and Makers deploy on `main` with secrets in GitHub | Nothing should depend on one PC being awake | Green check on a PR; deploy from CI |
| 3 | ENG | Admin tenant selector, bulk operations, imports, jobs: extend the isolation suite | Last week-2 proof item on isolation | New tests green |
| 4 | ENG | Two colliding Makers publishes (one build slot on the free plan) | Gate 1 evidence | Behaviour recorded in docs/04 |
| 5 | ENG | EdgeOne `teo` API from code: `CreateAccelerationDomain` + `ModifyHostsCertificate` on a test domain | Gate 1 evidence for custom domains; needs the fresh CAM key | Script in `scripts/`, result in docs/04 |
| 6 | ENG | Redeploy the proof of concept with a `payload migrate` step before the build | Live code is one migration behind | Live site on current code; release notes in docs/05 |
| 7 | ENG | RLS enforcing mode: restricted login role, per-request `SET LOCAL` hook, deny-by-default | Week 4 decision; proposal in docs/05 | Owner-role connections limited to migrations and allowlisted jobs |

### Waiting on the owner

| Action | Blocks |
| --- | --- |
| Send the Tencent email: [`docs/outreach/tencent-makers-platforms-email.md`](docs/outreach/tencent-makers-platforms-email.md). Add your name, title and phone | Gate 1 (week 3). With no written answer by 9 October, we fall back to Cloudflare EU |
| Revoke the Tencent CAM key beginning `IKIDTYWK` (it was pasted in chat) | Security hygiene; the `teo` API work (action 7) needs a fresh key |
| Share the repository with the team | Anyone but the owner working on it |
| Shortlist 15 hotels; first conversations | Three design partners signed by week 3 |
| Collection design review with the team | Canonical content model (week 4) |

### Secrets map (names only; values are never written to the repo or to chat)

| Secret | Lives in |
| --- | --- |
| Neon connection string | Windows user environment variable `NEON_DATABASE_URL`; Makers project variable `DATABASE_URL` (production and preview) |
| Payload secret (production) | Makers project variable `PAYLOAD_SECRET` |
| Seeded users' password on Neon | Windows user environment variable `HH_NEON_SEED_PASSWORD` |
| EdgeOne Makers API token | Windows user environment variable `EDGEONE_PAGES_API_TOKEN` (used by `.mcp.json` and the CLI) |
| Tencent CAM key | To be recreated as `TENCENTCLOUD_SECRET_ID` / `TENCENTCLOUD_SECRET_KEY` after the revocation |

### Resume in five commands

```powershell
cd C:\Users\belko\Documents\repos\hh-hotel-CMS ; git pull
docker start hh-postgres
cd apps\platform ; pnpm install
pnpm payload migrate:status                                   # every migration Ran = Yes
..\..\scripts\run-suites.ps1                                  # local-10, local-50, Neon; summary in %TEMP%\suites
```

---

## Plan deltas — where reality differs from the 90-day plan

Kept current. When a delta becomes permanent, change the plan by decision and move the row to the delta log.

| Plan says | Reality | Consequence |
| --- | --- | --- |
| Week 1 starts 28 September | Engineering started 22 September | Week-1 engineering items are done before the plan starts; buffer for Gate 1 |
| Isolation proof in weeks 1–2, local | Proven on production infrastructure (Makers + Neon Frankfurt) in week 0 | Gate 1's isolation criterion is mostly evidenced; two proof items remain (admin/bulk/imports/jobs, colliding publishes) |
| Payload upgrade to "the next release" | 3.90.1 is already the latest stable; the path 3.89 → 3.90.1 was rehearsed instead | Upgrades are one-way (password-hash format) and can carry schema changes; the release runbook must say so |
| RLS evaluated in week 4 | Evaluated in week 0; works under Payload with access control off | Week 4 now only decides on enforcing mode; proposal in docs/05 |
| Publish to live under 60 s (Gate 2) | Code deploy measured at 153 s, of which the remote build is ~110 s | Decide before Gate 2: the target applies to content releases, or the build moves to CI with artifact upload |
| Makers gate opens on day 1 with Tencent | Email drafted, not sent | Every day unsent is a day off the three-week gate |
| Schema push during development | Push restricted to localhost after it deleted the RLS policies | Migrations from now on for every shared database, earlier than planned |
| Customers before platform (principle 1) | No hotel conversations yet | BIZ work has to start in week 1 regardless of engineering progress |

## Delta log

### 2026-09-23 · session 5 · `f7e7712` → this commit

**Changed**
- Migrations adopted: `baseline` generated, proved identical to the pushed schemas by fingerprint, marked applied on local and Neon (`mark-baseline.ts`).
- First real migration `site_brand_timezone`: two columns plus a set-based backfill, rehearsed at 10 and 50 tenants locally and on Neon (332 ms), with per-tenant checksums proving no other data changed.
- Single-tenant export and transactional restore (`tenant-backup.ts`), rehearsed with a deliberately damaged tenant locally (35 ms) and on Neon (1.7 s): 0 of 50 tenants differ afterwards.
- Payload upgrade rehearsal 3.89.0 → 3.90.1 (`upgrade-rehearsal.ps1`).
- Push can be switched off locally (`PAYLOAD_DB_PUSH=false`); `.env` points at local again; tests scale with `SEED_TENANTS`; one seed password for all databases.

**Learned**
- Neon's newer Postgres catalogues NOT NULL as constraints; schema comparisons must ignore `contype = 'n'`.
- Payload 3.90 added `users.reset_password_requested_at` and changed the password-hash format. Upgrades need a migration and cannot be rolled back by downgrading packages.
- A test run at the wrong version or password locks users (five attempts); the lock lasts ten minutes or until `rotate-passwords.ts`.
- Desktop Commander's remote relay dropped roughly every five minutes; long steps survived only because every script logs to a file.

**Left undone**
- Admin/bulk/imports/jobs isolation coverage; colliding publishes; `teo` API; redeploy of the live proof of concept onto the migrated schema; CI.

### 2026-09-23 · session 4 · `0d88e5b` → docs-only commit

**Changed**
- Added `HANDOFF.md` (this file): current state, plan deltas, next actions, secrets map and delta log.
- Rewrote `README.md` as a full project description: problem, offer, scope, decisions, architecture, what is built, stack, layout, running, tests, deploy, security, tracking, gates.
- Spec renamed **Hotelier Website Platform — Solution Definition** in the Claude Docs artifact. Stale "hotels deferred" wording fixed; proof results and RLS findings added. Re-exported to `docs/01-solution-definition.md`.
- Added an "At a glance" table to the checklist; the plan links to the checklist and to plan deltas; CLAUDE.md requires a `HANDOFF.md` update every session.

**Learned**
- Nothing technical; code is unchanged since `0d88e5b`.

**Left undone**
- Everything under Next actions.

### 2026-09-23 · session 3 · `cd49ded` → `0d88e5b`

**Changed**
- Seeded passwords on the public proof of concept rotated to a random value; the old one returns 401 on the live URL (`cd49ded`).
- Postgres RLS added: context-optional `tenant_isolation` policy on six tenant tables, plus the restricted role `hh_app_rls`. 7 raw-SQL tests and 2 tests running Payload queries through RLS (`0d88e5b`).
- Full suite 26/26 on Neon with RLS applied, including REST/GraphQL against the live URL.
- Payload dev push limited to localhost. Seed constants refuse to run against a non-local database without `SEED_PASSWORD`. Rotation also clears lockouts.
- Tencent email drafted in `docs/outreach/`. CLAUDE.md gotchas 10–12 added.

**Learned**
- With Payload's own access control switched off (`overrideAccess`), `find` and `update` still could not cross tenants once the transaction was RLS-scoped. Defence in depth works under Payload.
- Neon's `neondb_owner` has BYPASSRLS and local `postgres` is superuser, so the policies do nothing until the app uses a restricted role.
- Payload's dev push silently drops RLS policies and disables RLS. It had been running against Neon from scripts and tests.
- One test run with the wrong password locked the Neon test users (Payload's login lockout).

**Left undone**
- RLS is not applied on local Docker, and not yet enforced for real requests.
- The other five week-2 proof items. See Next actions.

### 2026-09-23 · session 2 · `18297eb` → `376ed85`

**Changed**
- Payload platform app scaffolded in `apps/platform`: seven collections, multi-tenant and MCP plugins, access helpers, idempotent 50-tenant seed, isolation suite (13 + 2 + 2).
- Deployed to Makers Frankfurt against Neon Frankfurt; secrets set as Makers variables; `.env` kept out of the upload.
- Results written to docs/05; README, checklist and CLAUDE.md gotchas 1–9 added.

**Learned**
- A field named `locales` collides with Payload's localisation tables on Postgres. Vitest injects `BASE_URL`. Turbopack needs the monorepo root. PowerShell 5 writes a BOM. The Makers CLI uploads `.env` and shows no build logs.
- Seed: 6.3 s locally against 257 s to Neon over the network. Code deploy: 153–154 s.

**Left undone**
- RLS, migrations, upgrade, restore (picked up in session 3 or still open).

### 2026-09-22/23 · session 1 · `fbabfc3` → `54af8ac`

**Changed**
- Repository scaffolded: spec, 90-day plan, Webstudio and EdgeOne evaluations, CLAUDE.md, setup scripts, PR template.
- EdgeOne CLI, Makers MCP and skills installed; CLI logged in (Global site); token kept in a user environment variable.

**Decided** (see docs/01)
- Website-as-a-Service; horizontal core with a hotel pack; pooled tenancy; Payload on Postgres, unforked; Puck; EdgeOne Makers behind a week-one gate with a Cloudflare EU fallback; Neon Frankfurt.
