# Handoff

Read this first when you pick the project up, whether you are a person or an AI agent. It says where things stand, what changed since the last handoff, and what to do next.

**How this file works**

- **Current state** is rewritten at the end of every working session. It is always true as of the commit named in it.
- **Delta log** is append-only, newest first. One entry per working session: what changed, what was learned, what was left undone. Never edit an old entry; correct it in a new one.
- The plan is [`docs/02-90-day-plan.md`](docs/02-90-day-plan.md) (the baseline, changed only by decision). Progress is tracked in [`docs/CHECKLIST.md`](docs/CHECKLIST.md) (ticked in the commit that completes an item). This file connects the two: how today differs from the plan, and why.

---

## Current state — 24 September 2026, end of session 9

### Where we are

| | |
| --- | --- |
| Plan position | Day −4. The 90-day plan starts Monday 28 September; engineering started early on 22 September |
| Product focus | **Changed by the owner on 24 Sep: a hotel marketing website, no booking logic, no PMS work.** The booking step is removed from the site and its code parked (`src/booking/`) |
| Customer zero | **Marketing website live, content approved by the owner (24 Sep)**: release r4, now served by the new Makers project **`hh-platform` (area overseas)** at https://hh-platform.edgeone.dev/s/hotel-herse-dor (deployment `dpq71p13okqa`). The old project `hh-platform-poc` (area global, custom domains impossible without ICP) still serves the same database at https://hh-platform-poc.edgeone.cool until retired. 6 pages + 3 legal pages, FR/EN, room types, offer, house rules, FAQ, map, schema.org Hotel and FAQPage, sitemap. **Photos now on our own storage** (0 images from the old site). Owner account `proprietaire@hotel-herse-dor.demo` (password in user env var `HH_OWNER_PASSWORD`) |
| Look | **Three templates** (Maison, Atelier, Soirée) and a brand per site, under the design contract (`docs/11`); customer zero stays on Maison |
| Admin | **Phase 1 done**: Website panel on sites and pages (Publish site, Undo last publish, View site, releases), Preview button on pages, photo uploads with WebP sizes. Checked live as the owner, who sees only their hotel |
| Gate 2 (content) | Met on Neon on 23 Sep: publish 3.1 s including HTTP verification, rollback 1.2 s (targets 60 s / 10 s) |
| CI / deploy | Every push: migrations on a fresh Postgres, drift check, **import-map check**, seed, typecheck, suites, build, HTTP suites. `deploy` workflow: migrate Neon + RLS + Makers |
| Gate 1 (week 3) | Waiting on Tencent (email not sent). Custom domains: **unblocked** — finding 22 was the project's area (global includes mainland China, needs ICP); the new `overseas` project can add them. Next: a test subdomain the owner controls |

### What exists

| Thing | Where | State |
| --- | --- | --- |
| Platform app | `apps/platform` | Next.js 16.3.3, Payload 3.90.1. Collections: users, tenants, sites, pages, media, domains, releases, facts, plus `rooms` from the hotel pack. Multi-tenant and MCP plugins (no delete tools) |
| Hotel pack | `packs/hotel` (`@hh/pack-hotel`) | Room types and offers collections; rooms, offers and policies blocks; snapshot contribution (offers filtered by date at render); schema.org `Hotel`. Loaded only through `src/packs.ts` |
| Page blocks | `src/collections/Pages.ts` | hero, text and image, text (with subheadings), features, gallery, quote, FAQ, call to action, contact details, map, rich text; menu label and order, footer flag; reserved slugs refused |
| Admin self-service | `src/admin/PublishPanel.tsx`, `src/app/(sites)/preview/` | Website panel (publish, undo, view site, last 6 releases); draft preview for signed-in users (other tenants: 404, noindex) |
| Photos | `src/media/`, `src/app/media/`, `src/collections/Media.ts` | Bytes in Postgres `media_blobs` through a cloud-storage adapter; public `/media/<key>`, immutable cache; random filename prefix per upload |
| Public site | `src/app/(sites)/s/[site]/`, `src/site/` | `/s/<site>[/<locale>][/<page>]`, default locale without prefix; hreflang, canonical, Open Graph, schema.org Hotel on home, `sitemap.xml`, `robots.txt`; sticky header with mobile menu; "Book" button = link set per site |
| Onboarding | `src/onboarding/` | Customer zero's site as content (`sites/hotel-herse-dor*.ts`, legal pages in `.legal.ts`); `import-images.ts` copies photos into media; `apply.ts` builds every locale and publishes; `owner.ts` creates the owner account |
| Fact base | `src/collections/Facts.ts`, `src/ingest/` | Customer zero: 21 confirmed, 6 rejected, 12 unconfirmed. Engineering confirmed what the hotel's own site supports ("Demo" note); coordinates approximate |
| Release pipeline v0 | `src/releases/`, `src/jobs/publishSite.ts` | Unchanged; snapshots now carry pack data (rooms) and site tagline/logo/CTA (schema 2) |
| Booking (parked) | `src/booking/` | Adapter + clockPMS BE mock, unused by the site; unit tests keep it compiling |
| Migrations | `src/migrations` | Latest: `phase1_selfservice` (additive: offers, text/FAQ/offers/policies blocks, footer flag, media source URL, `media_blobs`). Rehearsed on 50 tenants + customer zero: 185 ms locally, 0 of 51 changed; 1.3 s on Neon |
| Test suites | `tests/int` | 12 files, 94 tests: isolation (incl. rooms, offers), extended, audit (scans `packs/`), REST/GraphQL, RLS (9 tables), RLS under Payload, facts, releases, booking (parked), normaliser, public site over HTTP, self-service (preview, uploads, offers, FAQ) |
| RLS | `src/db/rls.sql` | 9 tables incl. `facts`, `rooms`, `offers`, context-optional. Not yet enforcing for live requests |
| Local databases | Docker `hh-postgres` | `hh_platform` rebuilt from migrations (50 tenants + customer zero), `hh_check` (10 + customer zero). The old `next dev` that pushed schema into `hh_platform` is stopped |

### Watch out

- **Schema changes go through migrations only**; if a change both drops and adds, split it (CLAUDE.md 25).
- **After changing plugins or admin components, regenerate the import map** (CLAUDE.md 24); CI fails otherwise.
- **Hotel concepts go in `packs/hotel`** (CLAUDE.md 23). Releases only through `src/releases/publish.ts`; nothing unconfirmed reaches a guest.
- **Seed password** in user env var `HH_NEON_SEED_PASSWORD`. Never downgrade Payload.
- Photos live in Postgres (`media_blobs`); fine for tens of hotels. Moving to object storage replaces only the adapter (CLAUDE.md 27).
- The legal pages are drafts: the owner must validate them before the site replaces the hotel's current one.
- Never run `next dev` against `hh_platform` or `hh_check` for long: dev mode pushes schema. Use `next start` on port 3100 for local checks.

### Next actions, in order

Phase 2 of [`docs/10-roadmap-phases.md`](docs/10-roadmap-phases.md). Done so far: design contract and three templates (24 Sep). Decisions behind the list: [`docs/12-strategy-decisions.md`](docs/12-strategy-decisions.md).

| # | Owner | Action | Done when |
| --- | --- | --- | --- |
| 1 | ENG | Own-domain serving: hotel recognised from the host, `/` instead of `/s/<site>`, `/admin` only on our domain | Works locally with a test host; live once a domain exists |
| 2 | ENG | Edge cache of published pages (EdgeOne KV, keyed by release) | Pages under 1 s from Paris |
| 3 | ENG | Photo uploads under the 6 MB function limit; static map image at publish | A phone photo uploads; no third-party request on public pages |
| 4 | ENG | Adopt Payload SEO, Redirects, Form Builder, Import/Export; contact form with EU email (SMTP) | Tenant-scoped, isolation-tested; messages stored in the admin |
| 5 | ENG | Security basics (edge rate limits, headers, Dependabot, code scanning); quality gates in CI for every template | Rules live; a failing page blocks the merge |
| 6 | OWN | Send the Tencent email (updated draft); delete `hh-platform-poc`; validate the legal pages | Gate 1 answers by 9 Oct |
| 7 | OWN | Our platform domain + test subdomain; email provider account | Own domain and email live |
| 8 | OWN | AI model key; shortlist of hotels; a designer later | Phase 3 |

### Waiting on the owner

| Action | Blocks |
| --- | --- |
| Send the Tencent email: [`docs/outreach/tencent-makers-platforms-email.md`](docs/outreach/tencent-makers-platforms-email.md) | Gate 1, custom domains |
| A test domain for the custom-domain work | Phase 2 |
| AI model key | Phase 3 |
| Revoke the Tencent CAM key beginning `IKIDTYWK` | Security hygiene |
| Share the repository with the team; shortlist 15 hotels | Anyone else working on it; design partners |

### Secrets map (names only; values are never written to the repo or to chat)

| Secret | Lives in |
| --- | --- |
| Neon connection string | Windows user env var `NEON_DATABASE_URL`; Makers project variable `DATABASE_URL`; GitHub secret `NEON_DATABASE_URL` |
| Payload secret (production) | Makers project variable `PAYLOAD_SECRET` |
| Seeded users' password | Windows user env var `HH_NEON_SEED_PASSWORD` |
| Customer zero owner's password (`proprietaire@hotel-herse-dor.demo`) | Windows user env var `HH_OWNER_PASSWORD` |
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
| Publish to live under 60 s (Gate 2) | Content releases: 3.1 s publish, 1.2 s rollback on Neon. Code deploys: about 3 min from CI | Proposed decision: the 60 s target applies to content releases (met). Record it at Gate 2 |
| Makers gate opens on day 1 with Tencent | Email drafted, not sent | Every day unsent is a day off the three-week gate |
| Schema push during development | Push restricted to localhost after it deleted the RLS policies | Migrations from now on for every shared database, earlier than planned |
| Release pipeline v0 in week 4 | Content releases built in week 0 (23 Sep), Gate 2 content targets met on Neon | Week 4 keeps the domain bind and the ISR-or-static decision; code deploys stay at ~3 min and are proposed out of the 60 s target |
| Booking-engine embed in weeks 10–12 (XT) | Owner decision 24 Sep: no booking logic on the site for now; the 23 Sep adapter and mock are parked | The site's "Book" button is a link; the XT embed item waits until the owner asks for it |
| Hotelier self-service (Phase 1) from 28 Sep to 11 Oct | Done on 24 Sep, except amenities as a type. Photos in Postgres, not object storage | Phase 2 can start early; object storage becomes a later swap of the storage adapter |
| Hotel pack in week 5 | Pack v0 built in week 0 (rooms collection, rooms block, schema.org Hotel) as a workspace package, with no hotel concept in the core | Week 5 extends it (offers, amenities as a type, policies) rather than creating it |
| Customers before platform (principle 1) | No hotel conversations yet | BIZ work has to start in week 1 regardless of engineering progress |

## Delta log

### 2026-09-24 · session 10 · `8d4850e` → this commit

**Changed**
- Strategy session with the owner, recorded in [`docs/12-strategy-decisions.md`](docs/12-strategy-decisions.md): what a hotel gets (one multi-tenant, multi-site Payload), domains (hotels keep their DNS, one CNAME), the plugins rule and list, EdgeOne KV/Blob/agents, security layers, GDPR and accessibility duties, email provider (Scaleway TEM proposed), design approach. Roadmap and checklist updated with the resulting items.
- **Design contract** ([`docs/11-design-contract.md`](docs/11-design-contract.md)) and code in `src/design/`: tokens, `resolveTheme()` (derives button text, accent-as-text, secondary text and focus so a brand cannot produce unreadable text; only a text/background pair can be refused), W3C token export, self-hosted OFL fonts (Inter, Manrope, Playfair Display, Cormorant Garamond) through `next/font/local`.
- **Three templates** built in-house (no designer yet): Maison (customer zero's look, now with its real fonts), Atelier (modern, split hero, square), Soirée (dark, gold, centred italic). `site.css` uses tokens only; per-template layout in `[data-template]` sections.
- Sites get a `template` select and a `brand` group (accent, background, text, fonts, corners) with validation; the old `theme` JSON is hidden. Releases carry template and brand, so a look change is published and rolled back like content.
- Migration `site_templates` (additive; rehearsed on 51 tenants: 0 changed). Tests: `design.int.spec.ts` (every template passes; 600 random accents per template and 400 random background/text pairs produce no failing pair) and two HTTP tests (owner switches template and brand; unreadable pair refused). Local-10: 104/104 with HTTP; local-50: 82 + 22 skipped.
- Tencent email draft updated (new project, staff access, limits). The seeded users' password was rotated on all databases after a fragment appeared in a tool log.

**Learned**
- A dark background chosen on a light template needs cards that follow the background's lightness, not the template's scheme (first version failed the random-pair test).
- Full-page screenshots need an explicit wait for lazy images, and the map iframe can keep the network busy: wait on `load`, then images.

**Left undone**
- Own-domain serving, KV caching, plugins, contact form, security basics (Phase 2 list). The owner still has to delete `hh-platform-poc` in the console.

### 2026-09-24 · session 9b · `3bc7201` → this commit

**Changed**
- Finding 22 solved with the owner: "add custom domain" is disabled because `hh-platform-poc` was created in area `global` (includes mainland China, so ICP filing and identity verification are required). The area cannot be changed after creation.
- New Makers project `hh-platform` in area `overseas` (Global, Chinese mainland excluded), same Neon database, variables copied without displaying them. Live at https://hh-platform.edgeone.dev; the full live check passed there (pages, legal pages, FAQ JSON-LD, `/media`, preview redirect, owner login, upload and delete).
- Deploy workflow, `deploy-poc.ps1` (new `-Area`, default `overseas`), `run-suites.ps1` and the README point at the new project.

**Learned**
- `edgeone makers deploy -a global|overseas` picks the area at creation (default `global`). Overseas projects get `*.edgeone.dev` addresses.
- `edgeone makers link` silently writes the project's production variables into `apps/platform/.env`; a local `.env` pointing at localhost was put back afterwards (CLAUDE.md 31).
- Cloud functions cap requests at 6 MB and 120 s (Makers skills); photo uploads need a size limit before hotels use phones.
- Dynamic pages take about 2.2 s from Paris on both projects: caching is a Phase 2 item.

**Left undone**
- Retiring `hh-platform-poc` (owner's call). Adding a custom domain (needs a domain the owner controls).

### 2026-09-24 · session 9 · `739a195` → this commit (code `9f17a11`)

**Changed**
- Phase 1, hotelier self-service, done early. Admin Website panel on sites and pages: Publish site, Undo last publish, View site, last six releases. It calls the existing access-checked endpoints.
- Draft preview (`/preview/pages/<id>`, Preview button on pages): signed-in users only, with their own access; another tenant's page is a 404; noindex. Page slugs that collide with routes are refused.
- Media v0: photos stored in Postgres (`media_blobs`) through the cloud-storage plugin's adapter, served at `/media/<key>` with immutable caching. WebP sizes 400/960/1920, alt text required, random filename prefix per upload.
- Customer zero's 20 photos imported (`import-images.ts`), so the live site loads 0 images from the old site.
- Hotel pack v1: `offers` collection (tenant-scoped, RLS, validity dates) with offers block, and a policies block (check-in/out from facts plus house rules). Core text and FAQ blocks; the FAQ adds FAQPage structured data.
- Footer legal links: legal notice, privacy and cookies, accessibility statement. They are drafts from the hotel's current legal notice.
- Owner account script (`owner.ts`); customer zero's owner created on Neon.
- Migration `phase1_selfservice`, additive. Rehearsed on 50 tenants + customer zero: 0 changed. RLS is now on 9 tables.
- New suite `self-service.int.spec.ts`: preview auth, uploads, same-name uploads across tenants, delete, offers date filter, FAQ JSON-LD. 94/94 locally with HTTP, 74 + 20 skipped at 50 tenants, CI green.
- Deployed `dpl4w2ghpe63` (deploy workflow, Neon migrated in 1.3 s). Customer zero release r4 was published with HTTP verification in 5.3 s.
- Checked live as the owner: login, sees only their hotel, uploads a photo (201 in 3.6 s, sizes served), deletes it (files gone).

**Learned**
- Findings 28–30 in docs/05. Serverless needs non-disk upload storage. Payload's duplicate-filename check is tenant-scoped but storage keys are global. Publishing from the admin needed no new server code.

**Left undone**
- Amenities as a hotel-pack type. The owner has not validated the legal pages. Object storage (Postgres is enough for now).

### 2026-09-24 · session 8 · `339a46b` → this commit

**Changed**
- Admin fixed: the stale import map left the admin blank (finding 26); CI now fails on a stale map.
- Product focus changed by the owner: a hotel marketing website, no booking logic. `/book` routes and the booking settings removed; adapter and mock parked in `src/booking/`.
- Hotel pack `packs/hotel` (`@hh/pack-hotel`): room types, rooms block, snapshot contribution, schema.org Hotel. Loaded through `src/packs.ts`; the audit covers pack files.
- Generic page blocks (text and image, features, gallery, quote, call to action, contact details, map), menu fields on pages, tagline/logo/"Book" link on sites.
- Public site rewritten: locale paths (`/s/<site>/en/...`), hreflang, canonical, Open Graph, sitemap and robots per site, responsive design with a mobile menu.
- Customer zero's full site (6 pages, FR/EN, 2 room types) as onboarding content, applied and published; demo facts confirmed from the hotel's own site.
- Migrations `hotel_site_content` + `drop_booking_mock_settings`, rehearsed on 50 tenants + customer zero (0 of 51 changed). `tenant-checksums` now names the tables that changed.
- The morning's `next dev` (pushing schema into `hh_platform`) stopped; `hh_platform` rebuilt from migrations.
- Deploy: Makers installs only `apps/platform`, so the first deploy failed on the `workspace:*` pack; `scripts/vendor-packs.mjs` now vendors packs for the upload (CLAUDE.md 26). Live deployment `dp9l9q9ymanq` (171 s), then `dp0ew3tuxuyf` with the snapshot upgrade (183 s).
- Neon: migrations applied by the deploy workflow; 50 synthetic tenants reseeded with a room type (548 s on the free tier); customer zero's facts and site applied (41 s) and published with HTTP verification through the edge in 4.9 s (release r3).
- Renderer tolerates older snapshots (`upgradeSnapshot`), so a rollback to a release written before this change still renders.

**Learned**
- Findings 26–27 in docs/05: stale import map = blank admin; `migrate:create` prompts (and hangs) when a change both drops and adds.
- A pack block named like a collection (`rooms`) collides in GraphQL; blocks from packs set their own `interfaceName`.

**Left undone**
- Publish button and preview in the admin, media upload, second theme, AI generation, domain test.

**Afterwards (same day)**
- The owner approved the demo site's content. Screenshots added (`docs/screenshots/`), next phases written up (`docs/10-roadmap-phases.md`), checklist given a phase view.

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
