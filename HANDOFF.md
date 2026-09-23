# Handoff

Read this first when you pick the project up, whether you are a person or an AI agent. It says where things stand, what changed since the last handoff, and what to do next.

**How this file works**

- **Current state** is rewritten at the end of every working session. It is always true as of the commit named in it.
- **Delta log** is append-only, newest first. One entry per working session: what changed, what was learned, what was left undone. Never edit an old entry; correct it in a new one.
- The plan is [`docs/02-90-day-plan.md`](docs/02-90-day-plan.md) (the baseline, changed only by decision). Progress is tracked in [`docs/CHECKLIST.md`](docs/CHECKLIST.md) (ticked in the commit that completes an item). This file connects the two: how today differs from the plan, and why.

---

## Current state — 23 September 2026, 11:25 local time (code at `0d88e5b`; documentation updated since)

### Where we are

| | |
| --- | --- |
| Plan position | Day −5. The 90-day plan starts Monday 28 September; engineering started early on 22 September |
| Week 1 engineering | **Done early**: isolation proof, 50-tenant seed, first Makers deploys, cross-team contract drafts |
| Week 2 proof items | 1 of 6 done (row-level security) |
| Checklist | 13 done, 65 open (most open items are weeks 2–13, as planned) |
| Isolation suite | **26/26 green** on production infrastructure (Makers Frankfurt + Neon Frankfurt), with RLS applied |
| Deploy time | 153 s for a code deploy; the plan's target is 60 s (open decision, Gate 2) |
| Gate 1 (week 3) | Waiting on Tencent. The email is drafted but not sent |
| Uncommitted work | None. `main` equals `origin/main` |

### What exists

| Thing | Where | State |
| --- | --- | --- |
| Platform app | `apps/platform` | Next.js 16.3.3, Payload 3.90.1, Postgres. Seven collections (Users, Tenants, Sites, Pages, Media, Domains, Releases), multi-tenant plugin, MCP plugin (no delete tools) |
| Test suites | `apps/platform/tests/int` | isolation (13), overrideAccess audit (2), REST/GraphQL (2), RLS raw SQL (7), RLS under Payload (2) |
| RLS | `src/db/rls.sql`, `apply-rls.ts`, `inspect-rls.ts` | Context-optional policies plus the restricted role `hh_app_rls`. **Applied on Neon; not applied on local Docker.** Not yet enforced for real requests: the app still connects as the owner role |
| Live proof of concept | https://hh-platform-poc.edgeone.cool | Makers project `hh-platform-poc` (`makers-gznjppyen95y`), Frankfurt cloud functions. Test data only; seeded passwords rotated |
| Database | Neon free tier, `eu-central-1`, pooled endpoint, database `neondb` | 50 tenants, 51 users, 50 sites, 150 pages, 50 domains |
| Local database | Docker container `hh-postgres`, port 5432 | Same seed; the default seed password still works here |
| Documents | `docs/` | Spec (*Hotelier Website Platform — Solution Definition*, exported from the Claude Docs artifact), plan, checklist, evaluations, spike results, contracts v0.1, Tencent email draft |

### Watch out

- **`apps/platform/.env` currently points at Neon**, not local Docker. Any `pnpm dev`, `pnpm seed` or test run hits the shared database. Switch `DATABASE_URL` back to `postgres://hh:hh_local_dev@localhost:5432/hh_platform` for local work.
- **Schema changes no longer reach Neon automatically.** Payload's dev push is now enabled only for localhost, because it deleted the RLS policies. Neon needs a baseline migration before any collection changes (next action 1).
- **Against Neon, set `SEED_PASSWORD`** from the user environment variable `HH_NEON_SEED_PASSWORD`. The tests refuse to run without it, because the wrong password locks the accounts.
- A dev server may still be running on port 3000 (PID 73616). Stop it by that exact PID only, never by process name.

### Next actions, in order

| # | Owner | Action | Why now | Done when |
| --- | --- | --- | --- | --- |
| 1 | ENG | Generate a Payload baseline migration from the current schema; run migrations on Neon; re-apply RLS after them (`apply-rls.ts` as a post-migration step) | Push is off for Neon, so this is the only way to change its schema | `payload migrate:status` clean on Neon; 26/26 still green |
| 2 | ENG | Schema migration across 10, then 50 tenants: add a field with a data backfill, verify per tenant, time it on Neon | Week 2 proof item; also tests batching over the network (seed took 257 s row by row) | Per-tenant verification script green; time recorded in docs/05 |
| 3 | ENG | Payload upgrade to the latest 3.x; re-run the suite | Week 2 proof item; Payload security releases must land within days | 26/26 on the new version; notes in docs/05 |
| 4 | ENG | Single-tenant backup and restore: export one tenant, damage it, restore it, prove the other 49 are untouched | Week 2 proof item | Script plus a test; checksums of other tenants unchanged |
| 5 | ENG | Admin tenant selector, bulk operations, imports, jobs: extend the isolation suite | Week 2 proof item | New tests green |
| 6 | ENG | Two colliding Makers publishes (one build slot on the free plan) | Gate 1 evidence | Behaviour recorded in docs/04 |
| 7 | ENG | EdgeOne `teo` API from code: `CreateAccelerationDomain` + `ModifyHostsCertificate` on a test domain | Gate 1 evidence for custom domains | Script in `scripts/`, result in docs/04 |
| 8 | ENG | RLS enforcing mode: restricted login role for the app, per-request `SET LOCAL` hook, then deny-by-default | Week 4 decision; proposal already in docs/05 | Owner-role connections limited to migrations and allowlisted system jobs |

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
$env:SEED_PASSWORD = [Environment]::GetEnvironmentVariable('HH_NEON_SEED_PASSWORD','User')   # only when .env points at Neon
pnpm exec vitest run --config ./vitest.config.mts tests/int    # expect 26/26 (set PLATFORM_URL for the REST tests)
```

---

## Plan deltas — where reality differs from the 90-day plan

Kept current. When a delta becomes permanent, change the plan by decision and move the row to the delta log.

| Plan says | Reality | Consequence |
| --- | --- | --- |
| Week 1 starts 28 September | Engineering started 22 September | Week-1 engineering items are done before the plan starts; buffer for Gate 1 |
| Isolation proof in weeks 1–2, local | Proven on production infrastructure (Makers + Neon Frankfurt) in week 0 | Gate 1's isolation criterion is mostly evidenced; five proof items remain |
| RLS evaluated in week 4 | Evaluated in week 0; works under Payload with access control off | Week 4 now only decides on enforcing mode; proposal in docs/05 |
| Publish to live under 60 s (Gate 2) | Code deploy measured at 153 s, of which the remote build is ~110 s | Decide before Gate 2: the target applies to content releases, or the build moves to CI with artifact upload |
| Makers gate opens on day 1 with Tencent | Email drafted, not sent | Every day unsent is a day off the three-week gate |
| Schema push during development | Push restricted to localhost after it deleted the RLS policies | Migrations from now on for every shared database, earlier than planned |
| Customers before platform (principle 1) | No hotel conversations yet | BIZ work has to start in week 1 regardless of engineering progress |

## Delta log

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
