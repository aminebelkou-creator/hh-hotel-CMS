# Handoff

Read this first when you pick the project up, whether you are a person or an AI agent. It says where things stand, what changed since the last handoff, and what to do next.

**How this file works**

- **Current state** is rewritten at the end of every working session. It is always true as of the commit named in it.
- **Delta log** is append-only, newest first. One entry per working session: what changed, what was learned, what was left undone. Never edit an old entry; correct it in a new one.
- The plan is [`docs/02-90-day-plan.md`](docs/02-90-day-plan.md) (the baseline, changed only by decision). Progress is tracked in [`docs/CHECKLIST.md`](docs/CHECKLIST.md) (ticked in the commit that completes an item). This file connects the two: how today differs from the plan, and why.

---

## Current state — 23 September 2026, 18:40 local time

### Where we are

| | |
| --- | --- |
| Plan position | Day −5. The 90-day plan starts Monday 28 September; engineering started early on 22 September |
| Week 1 engineering | **Done early**: isolation proof, 50-tenant seed, first Makers deploys, cross-team contract drafts, ingest spike |
| Week 2 | **All six proof items done**, plus the **fact confirmation flow** (built 23 Sep) |
| First product slice | **Live on the proof of concept**: fact base, content release pipeline v0 with rollback, public renderer, booking step on the **clockPMS BE** mock. Customer zero at https://hh-platform-poc.edgeone.cool/s/hotel-herse-dor |
| Gate 2 (content) | **Met on Neon**: publish 3.1 s including HTTP verification through the edge, rollback 1.2 s (targets 60 s / 10 s). Locally 14–27 ms / 16–18 ms |
| Suites on production | **82/82 green on Neon against the live app** (18:28): isolation, RLS, facts, releases, booking, and the HTTP suites through the edge. Release timings in-suite on Neon: publish ~1.0 s, rollback 1.2 s |
| CI / deploy | Every push: migrations on a fresh Postgres, drift check, seed, typecheck, 11 suites, build, HTTP suites. `deploy` workflow: migrate Neon + RLS + Makers in 3 min 23 s (`dp0ytz87whim`) |
| Gate 1 (week 3) | Waiting on Tencent (email not sent). Custom domains are disabled on the Makers project (finding 22) |

### What exists

| Thing | Where | State |
| --- | --- | --- |
| Platform app | `apps/platform` | Next.js 16.3.3, Payload 3.90.1. Eight collections (Facts added), multi-tenant plugin, MCP plugin (facts: find and create only; no delete tools anywhere) |
| Fact base | `src/collections/Facts.ts`, `src/ingest/` | Normaliser, import with owner decisions. Customer zero on Neon and local: 35 facts, 3 confirmed (check-out 11:00, both phones), 1 rejected (10:30), 31 to review |
| Release pipeline v0 | `src/releases/`, `src/jobs/publishSite.ts` | Lease lock per site, request sequence (superseding), immutable snapshot + sha256, verification (in-process, plus HTTP when `RELEASE_VERIFY_BASE_URL` is set), automatic rollback, manual rollback. `POST /api/sites/:id/publish` and `/rollback` |
| Public renderer | `src/app/(sites)/s/[site]/` | Serves the current release only; `<meta name="x-release">`; FR/EN; practical information from confirmed facts only |
| Booking | `src/booking/` | Adapter interface + deterministic **clockPMS BE** mock; `/s/<site>/book` and `/s/<site>/book/availability` on the hotel's domain |
| Migrations | `src/migrations` | baseline, site_brand_timezone, add_jobs, **facts_booking_releases** (rehearsed at 10 and 50 tenants: 37–41 ms, 0 tenants changed; Neon 464 ms). All applied on local and Neon |
| Test suites | `tests/int` | 11 files, 82 tests: isolation (13), isolation-extended (7), audit (2), REST (3), RLS (7), RLS under Payload (2), facts (9), releases (13), booking (13), normaliser (5), site over HTTP (7) |
| RLS | `src/db/rls.sql` | 7 tables incl. `facts`, context-optional, restricted role `hh_app_rls`. Not yet enforcing for live requests |
| Live proof of concept | https://hh-platform-poc.edgeone.cool | Deployment `dp0ytz87whim`. Admin `/admin`; customer zero `/s/hotel-herse-dor` |
| Database | Neon Frankfurt | 51 tenants (50 synthetic + customer zero) |
| Local databases | Docker `hh-postgres` | `hh_platform` (50 tenants), `hh_check` (10 tenants + customer zero), both migrated |
| Documents | `docs/` | Spec, plan, checklist (22 done / 58 open), evaluations, findings 1–22, release design (v0 implemented), ingest + fact base, **system design illustrated (docs/09)**, contracts (booking mock section) |

### Watch out

- **Schema changes go through migrations only** (CLAUDE.md 10, 13). New job tasks are migrations too (enum).
- **Releases only through `src/releases/publish.ts`** (CLAUDE.md 18); **nothing unconfirmed reaches a guest** (CLAUDE.md 19).
- **Never downgrade Payload** (password-hash format).
- **Seed password** in user env var `HH_NEON_SEED_PASSWORD`, for local and Neon. Wrong-password runs lock accounts.
- **A `next dev` from this morning may be listening on port 3000** against `hh_platform` with push on (wrapper `cmd /c next dev`, PID 71316). It is harmless now that `hh_platform` is migrated, but run test servers on port 3100. Stop it only by exact PID.
- The seed now deletes only the synthetic `tenant-NN` tenants, so customer zero survives a reseed.

### Next actions, in order

| # | Owner | Action | Why now | Done when |
| --- | --- | --- | --- | --- |
| 1 | OWN | Review customer zero's 31 unconfirmed facts in `/admin` → Facts (check-in 15:30, address, email, amenities, room names; three `0x-1600-1200` numbers look like Wi-Fi instructions and should be rejected), then publish from the API or ask the agent | Only confirmed facts appear on the site | Facts reviewed; release r3 live |
| 2 | OWN | Provide the AI model API key | Generation of the draft site from confirmed facts (week 2 item) | Key in a user env var and a GitHub secret |
| 3 | OWN | Send the Tencent email (now also asking why custom domains are disabled) | Gate 1, 12 October | Written answer |
| 4 | ENG | Studio publish button: call `POST /api/sites/:id/publish` from the admin (Payload custom component) and show releases per site | Hoteliers cannot call an API | Publish and rollback from `/admin` |
| 5 | ENG | Hotel pack v0 in `packs/hotel`: Room, Offer, Amenity, Policy as a pack (docs/07), with schema.org `Hotel` output in the renderer | Biggest SEO gap found on customer zero | `Hotel` JSON-LD validated on `/s/hotel-herse-dor` |
| 6 | ENG | RLS enforcing mode (restricted login role, per-request `SET LOCAL`) | Week 4 decision | Owner-role connections limited to migrations and allowlisted jobs |
| 7 | DEFERRED | Custom-domain test on `site.ouilockers.fr` — blocked, domains disabled on the Makers project (finding 22) | Gate 1 evidence | Timings in docs/04 |

### Waiting on the owner

| Action | Blocks |
| --- | --- |
| Send the Tencent email: [`docs/outreach/tencent-makers-platforms-email.md`](docs/outreach/tencent-makers-platforms-email.md) | Gate 1 (week 3). With no written answer by 9 October, we fall back to Cloudflare EU |
| Revoke the Tencent CAM key beginning `IKIDTYWK` | Security hygiene |
| AI model API key | Draft-site generation |
| Review customer zero's unconfirmed facts | A fuller practical-information panel |
| Share the repository with the team; shortlist 15 hotels | Anyone else working on it; design partners by week 3 |

### Secrets map (names only; values are never written to the repo or to chat)

| Secret | Lives in |
| --- | --- |
| Neon connection string | Windows user env var `NEON_DATABASE_URL`; Makers project variable `DATABASE_URL`; GitHub secret `NEON_DATABASE_URL` |
| Payload secret (production) | Makers project variable `PAYLOAD_SECRET` |
| Seeded users' password | Windows user env var `HH_NEON_SEED_PASSWORD` |
| EdgeOne Makers API token | Windows user env var `EDGEONE_PAGES_API_TOKEN`; GitHub secret `EDGEONE_PAGES_API_TOKEN` (dedicated CI token; rotate before it expires) |
| Tencent CAM key (new) | Windows user env vars `TENCENTCLOUD_SECRET_ID` / `TENCENTCLOUD_SECRET_KEY` |

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
| Isolation proof in weeks 1–2, local | Proven on production infrastructure (Makers + Neon Frankfurt) in week 0 | Gate 1's isolation criterion is evidenced in full; all six week-2 proof items done in week 0 |
| Makers publishes (Gate 2) | Concurrent deploys are queued, both succeed, the last to finish goes live | The release pipeline must serialise publishes per project and verify what is live (finding 17) |
| Payload upgrade to "the next release" | 3.90.1 is already the latest stable; the path 3.89 → 3.90.1 was rehearsed instead | Upgrades are one-way (password-hash format) and can carry schema changes; the release runbook must say so |
| RLS evaluated in week 4 | Evaluated in week 0; works under Payload with access control off | Week 4 now only decides on enforcing mode; proposal in docs/05 |
| Publish to live under 60 s (Gate 2) | Code deploy measured at 153 s, of which the remote build is ~110 s | Decide before Gate 2: the target applies to content releases, or the build moves to CI with artifact upload |
| Makers gate opens on day 1 with Tencent | Email drafted, not sent | Every day unsent is a day off the three-week gate |
| Schema push during development | Push restricted to localhost after it deleted the RLS policies | Migrations from now on for every shared database, earlier than planned |
| Release pipeline v0 in week 4 | Content releases built in week 0 (23 Sep), Gate 2 content targets met on Neon | Week 4 keeps the domain bind and the ISR-or-static decision; code deploys stay at ~3 min and are proposed out of the 60 s target |
| Booking-engine embed in weeks 10–12 (XT) | Adapter and same-domain booking step built now against the clockPMS BE mock | Integration with the real engine is a swap behind `bookingAdapterFor` once the xedge team signs the contract |
| Customers before platform (principle 1) | No hotel conversations yet | BIZ work has to start in week 1 regardless of engineering progress |

## Delta log

### 2026-09-23 · session 7 · `6b7a0ba` → this commit

**Changed**
- Docs: `docs/09-system-design.md` (seven Mermaid diagrams), system-design section in the README, GitHub About (description, homepage, 10 topics). The owner's answers recorded: check-out 11:00, both phone numbers current, booking engine mocked as **clockPMS BE**.
- `facts` collection, normaliser, `import-facts.ts` with the owner's decisions; customer zero imported locally and on Neon.
- Booking adapter + clockPMS BE mock; site booking settings; `/s/<site>/book` and availability JSON.
- Release pipeline v0: publish/rollback endpoints, `publishSite` job, lease lock, request sequence, immutable snapshot + checksum, verification with automatic rollback; public renderer `/s/<site>`.
- Migration `facts_booking_releases` (rehearsed 10/50 tenants, applied on Neon by the deploy workflow in 464 ms). RLS extended to `facts`. Site slugs made unique. Seed no longer deletes real tenants.
- CI runs 11 suites incl. HTTP against the built app; green (2 min 16 s). Deploy workflow green (3 min 23 s, `dp0ytz87whim`).

**Learned**
- Findings 23–25 in docs/05: content releases need no rebuild and meet Gate 2 by three orders of magnitude; a lease lock plus a request sequence is enough to neutralise "the last to finish wins"; a required localized field must exist in every locale before a page validates there.
- Publishing identical content twice gives the same checksum (r1 and r2 on Neon), so checksums can later skip no-op publishes.

**Left undone**
- Admin publish button, hotel pack types and `Hotel` JSON-LD, AI generation (key), RLS enforcing mode, domain test (blocked).

### 2026-09-23 · session 6 · `467c074` → this commit

**Changed**
- Isolation proof completed: `isolation-extended.int.spec.ts` (bulk update/delete, re-tenant, imports, background jobs) and a forged `payload-tenant` cookie REST test. The `runIf` bug in the REST suite is fixed (it always ran).
- Reference job pattern `src/jobs/touchPageSeo.ts` (tenant in the input, enforced in the query; allowlisted) and migration `add_jobs`, applied on local and Neon.
- Colliding Makers publishes measured with `scripts/collide-publishes.ps1`; `scripts/deploy-poc.ps1` redeploys the proof of concept with `.env` held out of the upload.
- CI (`.github/workflows/ci.yml`) and a manual production deploy (`deploy.yml`) written but NOT pushed: GitHub refuses workflow files without the `workflow` token scope.

**Learned**
- Findings 15–17 in docs/05: jobs bypass access control, so their tenant must be explicit; every job task is a schema migration (enum); Makers queues concurrent deploys and the last to finish goes live.

**Left undone**
- CI push and secrets (waiting on the owner's `gh auth refresh`), `teo` API test (key and domain), release pipeline design.

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
