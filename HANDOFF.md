# Handoff

Read this first when you pick the project up, whether you are a person or an AI agent. It says where things stand, what changed since the last handoff, and what to do next.

**How this file works**

- **Current state** is rewritten at the end of every working session. It is always true as of the commit named in it.
- **Delta log** is append-only, newest first. One entry per working session: what changed, what was learned, what was left undone. Never edit an old entry; correct it in a new one.
- The plan is [`docs/02-90-day-plan.md`](docs/02-90-day-plan.md) (the baseline, changed only by decision). Progress is tracked in [`docs/CHECKLIST.md`](docs/CHECKLIST.md) (ticked in the commit that completes an item). This file connects the two: how today differs from the plan, and why.

---

## Current state — 25 September 2026, end of session 13 (overnight autonomous run)

### Where we are

| | |
| --- | --- |
| Plan position | Day −3. The 90-day plan starts Monday 28 September; engineering started early on 22 September. **Phases 1–4 engineering built ahead of the plan** (Phase 3: ingest, review, generation, translation, brand proposal; Phase 4: nightly checks, issues with one-tap fixes, monthly report, dashboards, action log, uptime); Phase 5 mechanisms (canary template upgrades, full-scope backups) and compliance drafts in place. What is missing needs the owner: a domain, Tencent's answer, an email provider, the AI model key, a lawyer, real hotels |
| Product focus | **Changed by the owner on 24 Sep: a hotel marketing website, no booking logic, no PMS work.** The booking step is removed from the site and its code parked (`src/booking/`) |
| Customer zero | **Marketing website live, content approved by the owner (24 Sep)**: release r5 (25 Sep: static map, SEO fields, templates), served by the Makers project **`hh-platform` (area overseas)** at https://hh-platform.edgeone.dev/s/hotel-herse-dor (code `0d11e41` deployed 25 Sep 11:35 UTC with Phases 3–5 and Lumière 2.0; customer zero on **Lumière** since r8 (13:50 UTC, switched by the owner), stable channel, home page with the new elements: stars, booking bar, banners, photo band, feature icons, room tags and facts). First live nightly run: platform checks 1 open issue (a missing search description on the gallery page, one-tap fix offered), axe 0 violations on the home page. The old project `hh-platform-poc` (area global, custom domains impossible without ICP) still serves the same database at https://hh-platform-poc.edgeone.cool until retired. 6 pages + 3 legal pages, FR/EN, room types, offer, house rules, FAQ, map, schema.org Hotel and FAQPage, sitemap. **Photos now on our own storage** (0 images from the old site). Owner account `proprietaire@hotel-herse-dor.demo` (password in user env var `HH_OWNER_PASSWORD`) |
| Look | **Four templates**: Maison, Atelier, Soirée (built in-house) and **Lumière 2.0**, a faithful adaptation of the licensed Luxorefi template (owner's licence, handoff by the design session in `Documents\hh-template-handoffs\luxorefi-lab`), all under the design contract (`docs/11`). The Luxorefi look needed seven structural additions to the core (hero stars from facts + booking bar to the Book link, banners block, section head with link, room tag + facts with icons, feature icons, photo band, checklist): every template can use them. Customer zero stays on Maison, its home page now carries the new elements |
| Admin | **Home = dashboard** (hotel: live version, domain, health, open issues with Apply/Dismiss/Check now, this month's numbers; our team: the fleet table). Sites carry four panels: Website (publish/undo), **Import the current website** (crawl → facts, Review facts screen, Draft pages, Translate), **Look** (propose/apply a template and accent), Publish. Collections added: Crawls, Issues, Action log. Phase 1–2 items unchanged |
| Gate 2 (content) | Met on Neon on 23 Sep: publish 3.1 s including HTTP verification, rollback 1.2 s (targets 60 s / 10 s) |
| CI / deploy | Every push: migrations on a fresh Postgres, drift check, import-map check, seed, typecheck, suites, build, HTTP suites (now 9 files), quality gates on **both design channels**; CodeQL; Dependabot weekly. **Nightly** (`nightly.yml`, 03:17 UTC): platform checks + axe on every live site → issues. **Uptime** every 30 min. `deploy` workflow: migrate Neon + RLS + Makers `hh-platform` |
| Gate 1 (week 3) | Waiting on Tencent (email not sent). Custom domains: **unblocked** (project area overseas) and **own-domain serving is built** (`src/proxy.ts`: a verified domain answers at `/`, `/admin` only on ours). Next: a test subdomain the owner controls, then add it in the Makers console and in the admin |
| Speed | Origin: one query per page, in-process release cache, cache headers. About 1.1 s per page from Paris, 0.3 s of it is the function. **The Makers CDN does not cache function responses (finding 31)**; Neon free tier adds 2–5 s on a cold start. Under 1 s needs the host's cache rules or a paid Neon plan |

### What exists

| Thing | Where | State |
| --- | --- | --- |
| Platform app | `apps/platform` | Next.js 16.3.3, Payload 3.90.1. Collections: users, tenants, sites, pages, media, domains, releases, facts, redirects, forms, form-submissions, plus `rooms` and `offers` from the hotel pack. Plugins: multi-tenant, MCP (no delete tools), SEO, redirects, form builder; nodemailer email when `SMTP_*` is set |
| Own domain | `src/proxy.ts`, `src/site/hosts.ts`, `app/(sites)/h/[host]/` | A request on a non-platform host is rewritten to `/h/<host>/…`; only `verified`/`active` domains are served; www/apex twin → 308 to the primary; canonical, hreflang, sitemap and robots use the primary host; `/admin`, `/api` (except `POST /api/contact`), `/preview`, `/s` answer 404 there. `PLATFORM_HOSTS` env lists our hosts |
| Contact form | `src/forms/contactEndpoint.ts`, `src/site/FormBlock.tsx` | The form block posts JSON to `POST /api/contact` (honeypot, 2.5 s timing check, required fields), which creates the submission under the form's tenant through the Local API — the multi-tenant plugin refuses anonymous REST writes (finding 32) |
| Security | `src/proxy.ts`, `Users.ts`, `.github/` | Security headers on every response (nosniff, referrer policy, frame options, permissions policy, HSTS, COOP); login lockout 5 tries / 15 min; Dependabot weekly (no Payload majors); CodeQL |
| Quality gates | `tests/quality/gates.mjs` | Every push, on seeded site-10 in all three templates: axe WCAG 2.2 AA zero violations, JSON-LD parses (Hotel on home, FAQPage on contact), one h1/lang/canonical/viewport, page weight over the wire without photos under 450 KB (measured 218–271 KB; JS 136 KB, fonts 73–125 KB). `pnpm test:gates <base-url> [site-slug]` locally; `PW_CHANNEL=chrome` to use the installed Chrome |
| AI door | `src/ai/provider.ts` | `getAi()`: mock by default; `AI_PROVIDER=anthropic|openai` + `AI_API_KEY` (+ `AI_MODEL`, `AI_BASE_URL`) switch on extraction, page copy, translation, brand rationale. Tests script it with `setAiForTests` |
| Ingest v1 | `src/ingest/{crawl,run,extract-ai,facts,endpoints}.ts`, `collections/Crawls.ts`, `admin/IngestPanel.tsx` | Chunked polite crawl from the admin (8 pages / 30 s per request, browser-driven), deterministic extraction with sources, optional model pass (allow-listed keys, unconfirmed, method `agent`); facts merge evidence per sighting |
| Fact review | `admin/ReviewView.tsx`, `admin/FactReview.tsx` | `/admin/review/<siteId>`: grouped by kind, edit value, confirm / reject / undo, "confirm the sure ones" (≥ 0.8) |
| Generation | `src/generate/{generate,copy,protect,endpoints}.ts` | Drafts home/rooms/services/contact and room types from confirmed facts; slots `gen:<page>:<block>`; a person's edit marks the block `human` (hook) and survives regeneration; model copy checked (numbers no fact backs are dropped) |
| Translation | `src/generate/translate.ts` | Field-by-field from the collection's field definitions; generated blocks rewritten, human text only filled when empty; needs a model |
| Brand proposal | `src/design/{propose-brand,brand-endpoints}.ts`, `admin/BrandPanel.tsx` | Accent from the logo or photos (sharp, saturated dominant colour), template from stars / words / photo mood, readable on the template; `sites.brandProposal`, applied on approval through the contrast gates |
| Health | `src/health/{check,report,endpoints,kinds}.ts`, `collections/Issues.ts`, `tests/quality/nightly.mjs` | Checks on the live release: links (internal slugs and external URLs), photos without alt, missing search text (fix), stale releases, expired offers (fix), missing hotel facts, uptime/speed of the home page; issues de-duplicated by fingerprint, auto-resolved when gone, dismissed stay dismissed. `POST /api/sites/:id/check`, `/api/issues/:id/apply`, service endpoints `/api/health/run` and `/report` behind `HEALTH_TOKEN` |
| Dashboards | `admin/Dashboard.tsx`, `admin/IssueList.tsx` | Admin home; reads with the user's own access; super-admins get the fleet |
| Action log | `collections/AuditLog.ts` | `withAudit` hooks on sites, pages, facts, domains, media, redirects, forms, rooms, offers, crawls: who, what, changed field names (never values); read-only |
| Design channel | `sites.designChannel`, `src/site/theme.ts`, `site.css` (last section) | Canary sites get `[data-canary]`; the upgrade path is in `docs/11` §upgrades; gates run both channels |
| Tenant tables | `src/db/tenant-tables.ts` | The one list (15 tables) behind RLS, checksums, backup/restore; a test checks `rls.sql` agrees |
| Compliance drafts | `docs/compliance/` | Register, sub-processors, DPA skeleton, breach procedure, accessibility statement template |
| Hotel pack | `packs/hotel` (`@hh/pack-hotel`) | Room types and offers collections; rooms, offers and policies blocks; snapshot contribution (offers filtered by date at render); schema.org `Hotel`. Loaded only through `src/packs.ts` |
| Page blocks | `src/collections/Pages.ts` | hero, text and image, text (with subheadings), features, gallery, quote, FAQ, call to action, contact details, map (static image made at publish from OpenStreetMap tiles, no third-party request), form, rich text; menu label and order, footer flag; reserved slugs refused. Seeded tenants carry every core block so the gates exercise the full CSS |
| Design | `src/design/`, `docs/11`, `docs/14`, `docs/design-tokens/` | Design contract, three templates (Maison, Atelier, Soirée), brand fields with contrast gates, self-hosted fonts; designer brief with example prompts; tokens exported for designers |
| Guides | `docs/13-how-it-works.md`, `docs/12-strategy-decisions.md` | How the platform works in plain words (glossary, flows, repository map, reading guide); strategy decisions of 24 Sep |
| Admin self-service | `src/admin/PublishPanel.tsx`, `src/app/(sites)/preview/` | Website panel (publish, undo, view site, last 6 releases); draft preview for signed-in users (other tenants: 404, noindex) |
| Photos | `src/media/`, `src/app/media/`, `src/collections/Media.ts` | Bytes in Postgres `media_blobs` through a cloud-storage adapter; public `/media/<key>`, immutable cache; random filename prefix per upload |
| Public site | `src/app/(sites)/s/[site]/`, `src/site/` | `/s/<site>[/<locale>][/<page>]`, default locale without prefix; hreflang, canonical, Open Graph, schema.org Hotel on home, `sitemap.xml`, `robots.txt`; sticky header with mobile menu; "Book" button = link set per site |
| Onboarding | `src/onboarding/` | Customer zero's site as content (`sites/hotel-herse-dor*.ts`, legal pages in `.legal.ts`); `import-images.ts` copies photos into media; `apply.ts` builds every locale and publishes; `owner.ts` creates the owner account |
| Fact base | `src/collections/Facts.ts`, `src/ingest/` | Customer zero: 21 confirmed, 6 rejected, 12 unconfirmed. Engineering confirmed what the hotel's own site supports ("Demo" note); coordinates approximate |
| Release pipeline v0 | `src/releases/`, `src/jobs/publishSite.ts` | Unchanged; snapshots now carry pack data (rooms) and site tagline/logo/CTA (schema 2) |
| Booking (parked) | `src/booking/` | Adapter + clockPMS BE mock, unused by the site; unit tests keep it compiling |
| Migrations | `src/migrations` | Latest: `phase3_ingest`, `phase3_generation_provenance`, `phase3_brand_proposal`, `phase4_issues_audit_log`, `phase5_design_channel` (all additive). Earlier: `plugins_seo_redirects_forms`, `drop_pages_seo_group`, `site_templates`, `phase1_selfservice` |
| Test suites | `tests/int`, `tests/quality` | 20 files, 159 tests (ingest, generate/translate, brand, health added): isolation (incl. rooms, offers, redirects, forms), extended, audit (scans `packs/`), REST/GraphQL, RLS (12 tables), RLS under Payload, facts, releases, booking (parked), normaliser, design contract, public site over HTTP, self-service, own domain (fake `Host` header), plugins and contact form; plus the quality gates (9 pages) |
| RLS | `src/db/rls.sql`, `src/db/tenant-tables.ts` | 15 tables (+ `crawls`, `issues`, `audit_log`), context-optional. Not yet enforcing for live requests |
| Local databases | Docker `hh-postgres` | `hh_platform` rebuilt from migrations (50 tenants + customer zero), `hh_check` (10 + customer zero). The old `next dev` that pushed schema into `hh_platform` is stopped |

### Watch out

- **Schema changes go through migrations only**; if a change both drops and adds, split it (CLAUDE.md 25).
- **After changing plugins or admin components, regenerate the import map** (CLAUDE.md 24); CI fails otherwise.
- **Hotel concepts go in `packs/hotel`** (CLAUDE.md 23). Releases only through `src/releases/publish.ts`; nothing unconfirmed reaches a guest.
- **Seed password** in user env var `HH_NEON_SEED_PASSWORD`. Never downgrade Payload.
- Photos live in Postgres (`media_blobs`); fine for tens of hotels. Moving to object storage replaces only the adapter (CLAUDE.md 27).
- The legal pages are drafts: the owner must validate them before the site replaces the hotel's current one.
- Never run `next dev` against `hh_platform` or `hh_check` for long: dev mode pushes schema. Use `next start` on port 3100 for local checks.
- CI once ran `payload migrate` with no output and no migrations (run 36086946504, 25 Sep); the seed then failed on a missing table. A re-run passed. If it repeats, add a `migrate:status` check after the migrate step.
- Dependabot: actions bumps and the Next group merge after CI; toolchain majors (TypeScript, @types/node, vitest, eslint, jsdom) and GraphQL/dotenv majors are ignored in `dependabot.yml` and taken by hand.
- **A non-draft `payload.update` on a page that has a newer draft version flips the page to draft** (CLAUDE.md 37): pass `_status: 'published'` or save with `draft: true`. Generation and translation always save drafts.
- **`HEALTH_TOKEN`** (Makers production variable and GitHub secret, value in Windows user var `HH_HEALTH_TOKEN`) protects the nightly endpoints; `PUBLIC_BASE_URL` on Makers is the address the uptime check calls.
- Sites' `designChannel` is render-time only; never put it in a release.
- **"Publish site" publishes the stored document, not the unsaved form.** Change → Save → Publish. Listed under "Fix later" in docs/CHECKLIST.md (25 Sep).
- `edgeone makers link` overwrites `apps/platform/.env` with the project's variables (CLAUDE.md 31); restore the local one afterwards.
- The Makers CDN ignores `Cache-Control` on function responses (finding 31): do not expect edge hits; speed work belongs at the origin or in the host's cache rules.
- Anonymous writes through REST are refused by the multi-tenant plugin (finding 32): a visitor-facing write needs a custom endpoint that uses the Local API under the right tenant, as `/api/contact` does.
- A block whose slug matches a collection name collides in GraphQL (finding 33): give it an `interfaceName` and `graphQL.singularName`.

### Next actions, in order

Engineering has built ahead of the plan (Phases 1–4 and the Phase 5 mechanisms, 25 Sep). The list is now mostly the owner's; engineering items are the ones that need no external input.

| # | Owner | Action | Done when |
| --- | --- | --- | --- |
| 1 | OWN | Send the Tencent email (add the Makers Agents questions only if the guest agent study is revived); delete `hh-platform-poc`; validate the legal pages | Gate 1 answers by 9 Oct |
| 2 | OWN | Our platform domain + a test subdomain (Makers console, then the admin); an email provider (Scaleway TEM proposed) → Makers variables `SMTP_*`; the **AI model key** → Makers variables `AI_PROVIDER`, `AI_API_KEY` (`AI_MODEL` optional) | Own domain live; contact form and monthly report emails; extraction, copy and translation switched on |
| 3 | ENG | Once the domain exists: mark it `verified`, set `PLATFORM_HOSTS` on Makers, check redirects, canonical, sitemap live; republish customer zero | Gate 1 evidence |
| 4 | ENG | With the model key: run the Phase 3 flow on customer zero's own website as the 80 % measure (import → review → compare with the hand-written facts), tune prompts | Number in the checklist |
| 5 | ENG | RLS enforcing for live requests: restricted role on Neon, `SET LOCAL ROLE` + tenant ids per request (docs/05 proposal) | Owner-role connections limited to migrations |
| 6 | ENG | Visual studio v0 spike (Puck on the same blocks) — only if the admin forms + preview prove insufficient with the design partners | Decision recorded |
| 7 | OWN | Lawyer review of `docs/compliance/`; external accessibility audit and pen test before the first invoice; Sentry account if wanted; shortlist of hotels; a designer | Phase 5 |

### Waiting on the owner

| Action | Blocks |
| --- | --- |
| Send the Tencent email: [`docs/outreach/tencent-makers-platforms-email.md`](docs/outreach/tencent-makers-platforms-email.md) | Gate 1, custom domains |
| A test domain for the custom-domain work; an email provider (SMTP); the AI model key | Gate 1 evidence; contact form and report emails; Phase 3 model features |
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
| Nightly health token | Windows user env var `HH_HEALTH_TOKEN`; Makers project variable `HEALTH_TOKEN`; GitHub secret `HEALTH_TOKEN` |
| AI model key (when it exists) | Makers project variables `AI_PROVIDER`, `AI_API_KEY`; locally in `apps/platform/.env` only |

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
| Two template packages, accessibility- and performance-gated, in week 4 | Three templates built in-house on 24 Sep (no designer yet) under a written design contract; they live in `apps/platform/src/design`, not separate packages; gates in CI since 25 Sep (axe, structured data, page-weight budget; no Lighthouse run) | Designers work from `docs/14-designer-brief.md`; a template that fails a gate cannot merge |
| Phase 2 engineering in weeks 3–5 | Done in week 0 (25 Sep) except what needs a real domain and an email provider; edge caching is not possible on Makers (finding 31) | Weeks 3–5 become domain go-live, Gate 1 evidence and Phase 3 preparation |
| Hosting on the first Makers project | The first project (area global, includes mainland China) cannot add custom domains without an ICP filing; the platform moved to project `hh-platform` (area overseas) on 24 Sep | Old project to be deleted by the owner; custom domains unblocked |
| Hotel pack in week 5 | Pack v0 built in week 0 (rooms collection, rooms block, schema.org Hotel) as a workspace package, with no hotel concept in the core | Week 5 extends it (offers, amenities as a type, policies) rather than creating it |
| Customers before platform (principle 1) | No hotel conversations yet | BIZ work has to start in week 1 regardless of engineering progress |

## Delta log

### 2026-09-25 · session 14 · `fc0074a` → this commit (Lumière 2.0 from the licensed Luxorefi template)

**Changed**
- **Core additions (PR 1)** from the handoff's PROPOSAL.md, industry-neutral and optional: hero `rating` (classification from the confirmed facts, through the pack's `HeroRating`) and `bookingBar` (a GET form to the site's Book link with arrival/departure/guests — no availability, no prices), `banners` and `mediaBand` blocks, `points` checklist on text-and-image, `icon` on feature items (built-in line-icon set `src/site/icons.tsx`, our own paths), rooms block `linkLabel`/`linkHref` → `.hh-section-head--split`, room cards with `.hh-room-tag` (category) and `.hh-room-facts` (occupancy, bed, size with icons). Migration `lumiere_blocks` (additive). Base CSS for every template; seeded pages and customer zero's home use the new elements; `site-http` test checks the exact markup; health checks cover banner photos and links.
- **Template Lumière 2.0 (PR 2)**: `templates.ts` entry, the handoff's CSS section in `site.css` (tokens only, `:has()` for the header over the photo hero; one fix: without a photo hero the booking bar sits on a navy band, found by axe), migration `lumiere_template` (enum value), gates and screenshots on four templates, tokens exported, design contract §5/§6, checklist.
- **Font**: Butler installed later the same day at the owner's request (testing; licence to confirm before a client goes live). The OTF files carry the licence in their metadata — CC BY-SA 4.0, embedding allowed — recorded in `fonts/butler.LICENSE.txt`; three static weights subset to WOFF2 (58 KB), `butler` in FONT_IDS, Lumière heading font switched, migration for the brand font options.
- Fact key `rating.stars` (crawler, seed) and `hotel.stars` (customer zero's import) both feed the stars and the schema.org rating; the crawler's key is the one going forward.

**Measured**
- Gates: 4 templates × 3 pages, stable and canary, 0 axe violations; Lumière pages 235–237 KB over the wire (fonts 87 KB). 159 tests green locally and in CI (`0d11e41`).
- Live: deploy run 36130136396 green; customer zero republished on Neon as r6 (9 pages, 2 rooms, 20 photos, 79 s apply, 5.9 s publish); the home page serves the stars line, the booking bar (GET to `/s/hotel-herse-dor/contact`), banners, photo band, feature icons, room tags and facts.

**Not done**
- Testimonials, news and video backgrounds (PROPOSAL.md §8): need real reviews, posts and a video policy first.
- Hotelza: waiting for the owner's ThemeForest ZIP; same method (design session makes the handoff, this side builds it).

### 2026-09-25 · session 13 · `984c7e9` → this commit (overnight run: Phases 3, 4 and the Phase 5 mechanisms)

**Changed**
- **Phase 3** (`8242767`): one model door (`src/ai/provider.ts`, mock unless configured); ingest v1 in the admin (crawls collection, chunked crawl driven from the browser, deterministic extraction with sources, optional model pass); fact review screen `/admin/review/<site>`; generation of pages and room types from confirmed facts with provenance slots and the human-edit hook; translation field by field with edit protection; brand proposal from logo/photos/facts with apply-on-approval. Three additive migrations. 32 new tests.
- **Phase 4** (this commit): `issues` collection and `src/health` (checks on the live release, one-tap fixes under the approver's rights, monthly report, service endpoints behind `HEALTH_TOKEN`), nightly workflow with axe on every live home page, uptime workflow, admin home dashboards (hotel and fleet), action log with hooks on every content collection. `HEALTH_TOKEN` and `PUBLIC_BASE_URL` set on Makers production; `HEALTH_TOKEN` as a GitHub secret.
- **Phase 5 mechanisms**: design channel (canary first) with `[data-canary]` CSS sections and gates on both channels; `src/db/tenant-tables.ts` as the single list behind RLS, checksums and backup (backup scope grew from 6 root tables to 15, 123 with children; restore drill passed: 116 rows, 190 ms, 0 other tenants changed); compliance drafts in `docs/compliance/`.
- Docs: roadmap Phases 3–5 rows, checklist, CLAUDE.md 37–39, design contract §upgrades, prompts (self-service onboarding), docs index.

**Measured**
- Local hh_check: 159 tests green (20 files) with the 3100 server; gates 9/9 pages on stable and canary; restore rehearsal 0/11 tenants changed after restore.
- Live after deploy: owner dashboard and review screen 200; `POST /api/sites/51/check` found 32 issues, 31 of them false (photo addresses read as page slugs) → fixed in `be044e6`, next check resolved them; nightly workflow run by hand: checks + axe on customer zero, 0 accessibility violations; uptime workflow green.

**Not done, and why**
- Visual studio v0 (Puck): a spike with no design partner to judge it would be guesswork; the admin forms + preview are the editing path until a hotel says otherwise.
- RLS enforcing for live requests: needs a restricted role on Neon (owner console) and a session-role hop per request; scheduled after Gate 1.
- Sentry: needs an account (owner). Uptime alerts exist through the workflow.
- Model-dependent measures (80 % of facts, translation quality): wait for the AI key; every path runs deterministically meanwhile.

### 2026-09-25 · session 12 · `e314d4f` → this commit (Phase 2 engineering, run without prompts)

**Changed**
- **Own-domain serving** (`f7e11b4`): `src/proxy.ts` (Next 16 `proxy`) rewrites a non-platform host to `/h/<host>/…`; only verified/active domains are served; www/apex twin redirects to the primary; canonical, hreflang, sitemap, robots use the primary host; platform-only paths answer 404 on a hotel domain; `Domains` normalises and validates hostnames, only super-admins change status. Test `own-domain.int.spec.ts` with a fake `Host` header.
- **Speed** (`6196d0c`, `f1eed61`): cache headers on public pages, one SQL round trip per page (`SITE_SQL`), immutable in-process release cache, publish verification by release id. Finding 31: the Makers CDN never caches function responses, so the gain is at the origin (about 1.1 s from Paris, was 2.2 s).
- **Phone photos and static map** (`f1eed61`): `UploadShrinker` admin provider shrinks photos over 4 MB or 2400 px in the browser; 5 MB cap; the map block is a WebP image made at publish from OpenStreetMap tiles (`src/media/static-map.ts`), no iframe, no third-party request.
- **Plugins and contact form** (`c6a8c06`): SEO (`meta` per page, share image localized), Redirects (in the release, `permanentRedirect`), Form Builder (forms and submissions per hotel, `form` block, `POST /api/contact` with honeypot and timing check — finding 32), nodemailer behind `SMTP_*`. Migrations `plugins_seo_redirects_forms` and `drop_pages_seo_group`; RLS on 12 tables; finding 33 (block/collection name collision in GraphQL). Import/Export deferred.
- **Security basics** (`c6a8c06`): security headers on every response, login lockout, Dependabot, CodeQL.
- **Quality gates** (this commit): `tests/quality/gates.mjs` runs in CI after the HTTP suites on seeded site-10 in every template: axe WCAG 2.0–2.2 A/AA, JSON-LD, h1/lang/canonical/viewport, page-weight budget over the wire; seeded pages now carry every core block. `pnpm test:gates`. Lighthouse not run: the budget covers its weight signal; scores stay an owner check on PageSpeed.
- Docs: checklist, roadmap rows, design contract §gates, how-it-works glossary (redirect, form, SEO fields, gates), README status and proof, findings 28–33 in `docs/05`.
- [`docs/15-guest-agent-design.md`](docs/15-guest-agent-design.md): a **strategy study of a guest agent, not in the plan** (owner, 25 Sep: "I was just studying the strategy"). The CRM team owns the chatbot and will see if it fits. Kept as reference; nothing scheduled.

**Measured**
- Local hh_check: 117 tests green with the 3100 server; gates 9/9 pages, 0 axe violations, JS 136 KB, fonts 73–125 KB, 218–271 KB per page without photos.
- Migration rehearsal on 50 tenants + customer zero: 0 of 51 changed.

**Answered**
- Retire `hh-platform-poc`: only the owner can delete it in the console; nothing references it any more (deploy targets `hh-platform`).
- Email provider: Scaleway TEM (EU, cheap, SMTP) proposed, Brevo as alternative; the platform only needs the `SMTP_*` variables.
- Why send the Tencent email: platforms API for domains, quotas and pricing at 100–1,000 tenants, a DPA that covers edge processing, staff access.

### 2026-09-24 · session 11 · `8caa70e` → this commit

**Changed**
- [`docs/13-how-it-works.md`](docs/13-how-it-works.md): how the platform works in plain words (one multi-tenant Payload, glossary, what happens when a hotel publishes or a guest visits, what Payload gives vs what we built, repository map, common questions, which document to read by role). Linked first from the README and the docs index.
- [`docs/14-designer-brief.md`](docs/14-designer-brief.md): what a designer decides and what is fixed, the blocks with their content, deliverables, handover checklist, and three example prompts (a coding agent implementing a designer's template; an AI design assistant proposing a template; an email brief to a freelancer).
- [`docs/design-tokens/`](docs/design-tokens/): each template's tokens in W3C format and the brand fields, generated by `src/design/export-tokens.ts`.
- README (status, proof count, repository tree, document table), docs index, checklist, plan deltas; `templates/` and `packages/` READMEs now say where things actually live.

- Then (25 Sep): README section 15 rewritten as **Documentation**, grouped by audience (start here, owner, engineers, designers, example prompts, evidence); [`docs/prompts/`](docs/prompts/README.md) with seven example prompts (start a session, implement a template, propose a template, brief a designer, propose a brand, onboard a hotel, add a feature or plugin); the designer brief now links to them.

**Answered**
- A designer does not need only the design contract: the contract is the rulebook; the brief says what to deliver and how it is judged, the token files give the starting values, the screenshots show real content.

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
