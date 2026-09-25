# hh-hotel-CMS

**Website-as-a-Service for independent hotels.** A multi-tenant platform that generates a hotel's direct-booking website from its own data, hosts it on managed EU infrastructure, and keeps it current on the hotel's behalf. Part of the **xedge** project.

> **Start here:** [`docs/13-how-it-works.md`](docs/13-how-it-works.md) for how the platform works in plain words · [`HANDOFF.md`](HANDOFF.md) for where things stand and what to do next · [`docs/CHECKLIST.md`](docs/CHECKLIST.md) for progress · [`docs/02-90-day-plan.md`](docs/02-90-day-plan.md) for the plan · [§15 Documentation](#15-documentation) for everything else, including [example prompts](docs/prompts/README.md).

| | |
| --- | --- |
| **Status** | Pre-launch. Engineering has built ahead of the 90-day plan: Phase 1 (hotelier self-service), Phase 2 (own-domain serving, speed, phone photos, static map, plugins, contact form, security basics, quality gates), Phase 3 (import of a hotel's website, fact review, page generation, translation, brand proposal — model features switch on with a key), Phase 4 (nightly checks, issues with one-tap fixes, monthly report, dashboards, action log, uptime) and the Phase 5 mechanisms (canary template upgrades, full-scope backups, compliance drafts). Customer zero's marketing website (FR/EN, room types, offers, FAQ, legal pages, photos on our own storage) is live on the proof of concept and its owner can publish from the admin; the 90-day plan runs 28 September to 25 December 2026 |
| **Proof** | 159 tests plus 18 quality-gate pages (stable and canary) green on every push (isolation, RLS on 15 tables, facts, releases, design contract, public site, own domain, plugins, ingest, generation, brand, health over HTTP; axe WCAG 2.2 AA, structured data and a page-weight budget on every template); nightly checks and axe on every live site. On production infrastructure (EdgeOne Makers + Neon, Frankfurt): content publish 3.1 s and rollback 1.2 s against Gate 2 targets of 60 s and 10 s |
| **Live proof of concept** | https://hh-platform.edgeone.dev — customer zero at [/s/hotel-herse-dor](https://hh-platform.edgeone.dev/s/hotel-herse-dor) (demo: a marketing website in French and English; admin at `/admin`) |
| **Next gate** | Gate 1, week 3 (12 October): hosting provider confirmed, CMS frozen. Waiting on Tencent. Custom domains now possible (project moved to area overseas, finding 22); waiting for a test domain |
| **Owner** | Hotel Hersedor Paris / xedge |

---

## What it looks like

Customer zero, Hôtel de la Herse d'Or, live on the proof of concept (24 September 2026, content approved by the owner). More in [`docs/screenshots/`](docs/screenshots/README.md).

<p>
<img src="docs/screenshots/2026-09-24/site-home-fr-top.jpg" alt="Home page of the hotel site: hero photo of the lounge, headline 'Au cœur du Marais, depuis 1790'" width="560">
<img src="docs/screenshots/2026-09-24/site-home-mobile-top.jpg" alt="The same home page on a phone" width="190">
</p>
<img src="docs/screenshots/2026-09-24/site-rooms-fr-detail.jpg" alt="Rooms page: Superior room with description, amenities and photos" width="560">

**Phase 1, hotelier self-service, is done** (24 September): the owner signs in to `/admin`, edits a page, previews the draft, and publishes or undoes a publish from the site's Website panel.

<img src="docs/screenshots/phase-1/live-owner-publish.jpg" alt="Admin, signed in as the hotel owner: the site with the Website panel, Publish site, Undo last publish, View site and the list of releases" width="560">

**Three templates** (24 September), same content, switched in the admin: Maison (classic), Atelier (modern) and Soirée (dark). A hotel picks one and sets its brand colour; readability is guaranteed by the design contract ([`docs/11-design-contract.md`](docs/11-design-contract.md)).

<p>
<img src="docs/screenshots/templates/atelier-home-mobile.jpg" alt="Customer zero in the Atelier template on a phone: split layout, sans-serif headline, green button" width="190">
<img src="docs/screenshots/templates/soiree-home-mobile.jpg" alt="Customer zero in the Soirée template on a phone: dark background, centred italic headline, outline button" width="190">
<img src="docs/screenshots/templates/maison-home-mobile.jpg" alt="Customer zero in the Maison template on a phone: full-width photo, serif headline" width="190">
</p>

**What comes next** is laid out in [`docs/10-roadmap-phases.md`](docs/10-roadmap-phases.md): own domain (templates done), generating a site from a hotel's URL, the operated service, then five paying hotels.

## 1. The problem

Independent hotels lose margin to online travel agencies because their own websites convert badly, go stale, and rarely rank. The fixes are known: fast pages, current rates and offers, structured data, good translations, accessibility, and a booking engine one click away. But nobody at a 30-room hotel has time to do all that every month, and agencies charge for a project, then leave.

## 2. What we sell

A subscription to an **operated website**, not a website builder:

1. **Generated.** An agent builds the first version from what the hotel already has: its current site, its Google Business Profile, and its PMS data (rooms, rates, policies). The hotel confirms the facts before anything is published.
2. **Refined.** The hotelier and our team edit in a structured block studio that works on a phone. There is no pixel canvas, so the design cannot be broken.
3. **Operated.** A service loop watches freshness, SEO and answer-engine visibility (AEO), structured data, Core Web Vitals, broken links, accessibility and consent. It fixes what it can and proposes the rest for one-tap approval. The hotel gets a monthly service report.
4. **Hosted.** Every site ships as an immutable release at the edge, on the hotel's own domain, with instant rollback.

The unit economics depend on one number, **human minutes per site per month**, and it is measured from the first customer.

## 3. Scope

**In scope (this repository):** the multi-tenant platform, content model, agentic generation and service loop, block studio, templates, release pipeline, domains, certificates and CDN, SEO/AEO, and compliance (RGPD/GDPR, WCAG 2.2 AA / EN 301 549, EU AI Act disclosure).

**Out of scope (other xedge teams, integrated by contract):**

| System | Owner | Integration |
| --- | --- | --- |
| PMS and distribution | xedge PMS team | Read-only inventory projection ([contract](docs/contracts/)) |
| Booking engine | xedge booking team | Embed on the hotel's domain ([`booking-engine-embed.md`](docs/contracts/booking-engine-embed.md)) |
| CRM, knowledge base, guest chatbot | xedge CRM team | Widget boundary with consent gating ([`chatbot-widget-boundary.md`](docs/contracts/chatbot-widget-boundary.md)) |
| Data-subject requests | Shared | Erasure and export ([`erasure-and-export.md`](docs/contracts/erasure-and-export.md)) |

## 4. Decisions already taken

Full reasoning, rejected alternatives and risks are in the spec, [**Hotelier Website Platform — Solution Definition**](docs/01-solution-definition.md).

| Area | Decision | Why |
| --- | --- | --- |
| Positioning | Website-as-a-Service, continuously managed | The service is the product; agents make it affordable for a small hotel |
| Core vs vertical | Horizontal core, vertical packs; **hotels first** | Room, Offer and Amenity live in `packs/hotel`, never in the core |
| Tenancy | Pooled: one application, one Postgres, tenant boundary in the data-access layer | Never an instance per customer. Optionally 5–10 concierge clients on the same schema |
| Delivery | Each published site is an immutable release artifact at the edge | Instant rollback; authoring and serving fail independently |
| CMS | Payload 3 on Postgres, upstream and unforked, with the official multi-tenant and MCP plugins | Typed model, MIT licence, MCP with per-key scoping. Security releases applied within days |
| Studio | Hybrid: prompt to generate, then structured blocks to edit. Puck by default | No pixel canvas, so accessibility and central fixes stay guaranteed |
| Primary user | Independent hoteliers, direct | Agencies and chains come later |
| Hosting | EdgeOne Makers (Frankfurt) behind a week-one gate; Cloudflare EU pre-wired as fallback | Nothing provider-specific in the app; only the release pipeline talks to the host |
| Database | Postgres in the EU; Neon Frankfurt for the proof | Residency and latency beside the Frankfurt functions |
| Defence in depth | Postgres row-level security under Payload's access control | Evaluated and working; enforcing mode to be decided in week 4 |

## 5. Architecture

```mermaid
flowchart LR
  subgraph CP [Control plane]
    S[Studio<br/>Puck blocks] --> API
    AG[Generation agent<br/>and service loop] --> API
    MCP[MCP clients<br/>customer agents] --> API
    API[Content API<br/>Payload, tenant-scoped]
  end
  API --> DB[(Postgres<br/>Neon Frankfurt<br/>+ RLS)]
  API --> RP[Release pipeline<br/>build, deploy, rollback]
  RP --> ED[Edge + CDN<br/>EdgeOne Makers]
  ED --> V[Hotel guests]
  PMS[xedge PMS] -. read-only projection .-> API
  BE[xedge booking engine] -. embed .-> ED
```

- **Control plane** (authoring): studio, agents and MCP clients all write through the same tenant-scoped API. Agents follow approval policies, and every change is audited and can be reverted.
- **Data plane** (serving): immutable releases at the edge. A studio outage never takes a hotel's site offline.
- **Tenant isolation** has three layers. Payload access control through the multi-tenant plugin is the primary boundary. Background jobs, which run without a user, carry the tenant in their input and filter on it. Postgres RLS underneath catches regressions.
- **Provenance**: every field records whether it was generated, edited by a human or locked. Regeneration and template upgrades do a three-way merge, so human edits are never silently overwritten.

### System design at a glance

The full illustrated design, with containers, schema-change flow and a repository map, is in [**docs/09-system-design.md**](docs/09-system-design.md). Solid lines exist today; dotted lines are designed but not built.

**Context: who and what the platform talks to.** The platform masters content and releases only. Inventory, rates, bookings and guest data stay in the other xedge systems. The public site is a marketing website: its "Book" button is a plain link (usually to the contact page), and no booking logic runs on the platform.

```mermaid
flowchart LR
  H([Hotelier]) -->|edits, approves| P
  G([Hotel guests]) -->|browse, book| E
  A([Customer AI agents]) -->|MCP| P
  subgraph X [xedge]
    PMS[PMS]
    BE[Booking engine]
    CRM[CRM + chatbot]
  end
  P[Hotelier Website Platform] -->|release| E[Edge / CDN<br/>EdgeOne Makers]
  PMS -. read-only projection .-> P
  BE -. later: link or embed .-> E
  CRM -. widget boundary .-> E
  W[Hotel's current website] -->|ingest| P
```

**Tenant isolation: three layers, each covered by tests in CI.**

```mermaid
flowchart TB
  Q[Request from user A<br/>REST, GraphQL, admin, MCP] --> L1
  J[Background job<br/>no user] --> L2
  L1[Layer 1 · Payload access control<br/>multi-tenant plugin] --> DBQ
  L2[Layer 2 · Tenant carried in job input<br/>every query filters on it] --> DBQ
  DBQ[SQL query] --> L3[Layer 3 · Postgres RLS<br/>restricted role + tenant context]
  L3 --> T[(Only tenant A rows)]
  AUD[[overrideAccess audit<br/>fails CI on any unlisted bypass]] -. guards .-> L1
```

**From an existing website to a live site.** Nothing is generated from an unconfirmed fact.

```mermaid
flowchart LR
  S[Hotel website<br/>+ Google profile] -->|ingest| F[Facts<br/>unconfirmed]
  F -->|hotel confirms| FC[Confirmed facts]
  FC -->|generation| C[Draft content]
  C -->|studio edits| C2[Content]
  C2 -->|publish, per-site lock| REL[Immutable release<br/>+ checksum]
  REL --> LIVE[Live site]
  REL -. rollback = pointer move .-> LIVE
```

## 6. What is built today

The proof-of-concept platform in `apps/platform` proved the risky parts first: tenant isolation, hosting and data residency. The first product slice now runs on top of it: a **fact base** with human confirmation, a **content release pipeline** with rollback, and a **hotel marketing website** rendered from the release, with the hotel's rooms coming from a separate **hotel pack**. Customer zero, Hôtel de la Herse d'Or, is the first real tenant.

| Collection | Tenant-scoped | Purpose |
| --- | --- | --- |
| `users` | Membership list | Roles `super-admin` / `owner` / `editor`; roles can only be changed by a super-admin. Hotel owners are created with `src/onboarding/owner.ts` |
| `tenants` | — | One per hotel: name, slug, plan |
| `sites` | Yes | Brand name, tagline, logo, locales, template and brand (accent, colours, fonts, corners), header "Book" link, status, current release pointer, publish lock |
| `pages` | Yes | Drafts and versions; menu label and order; blocks: hero, text and image, text, features, gallery, quote, FAQ, call to action, contact details, map, rich text, plus the hotel pack's rooms, offers and policies blocks; footer flag for legal pages; draft preview; provenance on generated blocks; SEO group |
| `media` | Yes | Photos stored in Postgres (`media_blobs`) and served at `/media/<key>`; WebP sizes 400/960/1920; alt text required; usage rights; source URL for imported photos |
| `domains` | Yes | Hostnames per site; only a super-admin can change them, and nobody can delete them |
| `releases` | Yes | Immutable snapshots (published pages + confirmed facts) with a sha256 checksum. Created only by the pipeline; only status and verification change afterwards; never deleted |
| `rooms` (hotel pack) | Yes | Room types: localized name, summary, description, occupancy, bed, view, features, photos |
| `offers` (hotel pack) | Yes | Offers and packages: title, highlight, summary, conditions, validity dates, photo, link; shown only while valid |
| `facts` | Yes | The fact base: key, value, source, method, confidence, evidence. Born unconfirmed; confirmation is stamped by the server. Agents may propose, never confirm |

| Capability | State |
| --- | --- |
| Multi-tenant access control | Done. 13-case isolation matrix across read, write, move, join and self-promotion |
| `overrideAccess` audit | Done. Every use in `src/` must be allowlisted with a reason, or the test fails |
| REST and GraphQL isolation | Done. Tested against the live URL |
| Postgres RLS | Done as an evaluation: policies on 12 tables, restricted role, 12 tests. Not yet enforced for live requests |
| Hotelier self-service | Done (Phase 1). Website panel in the admin (publish, undo, view site, releases), draft preview, photo uploads, owner accounts |
| Templates and brand | Done: design contract, three templates, brand fields with contrast gates, self-hosted fonts (`src/design/`) |
| MCP server | Plugin enabled: pages (find, create, update), sites (find, update), media (find), facts (find, create: agents propose, people confirm). No delete tools |
| Seed | 50 synthetic tenants, 51 users, 50 sites, 150 pages, 50 domains; idempotent; leaves real tenants (customer zero) alone |
| Migrations | Done. Baseline plus a first real migration, rehearsed at 10 and 50 tenants with per-tenant checksums (`scripts/migration-rehearsal.ps1`) |
| Single-tenant backup and restore | Done. Export plus a transactional restore of one hotel; the other 49 are proven untouched (`scripts/restore-rehearsal.ps1`) |
| Payload upgrades | Rehearsal script with a schema-drift check (`scripts/upgrade-rehearsal.ps1`). Upgrades are one-way |
| Deploy | EdgeOne Makers, Frankfurt cloud functions. From GitHub Actions (`deploy` workflow), 171 s including the Neon migration |
| CI | Every push: fresh Postgres from the committed migrations, drift check, seed, typecheck, all suites, production build, HTTP suites against the built app |
| Fact base | Done. Ingest → normaliser → `facts` → confirm/reject in the admin. Customer zero imported: 45 sightings became 35 facts; the owner's 4 decisions applied |
| Content releases v0 | Done. `POST /api/sites/:id/publish` and `/rollback`, `publishSite` job, per-site lease lock, superseding, verification with automatic rollback. Gate 2 targets (publish < 60 s, rollback < 10 s) met by a wide margin locally; see [docs/06](docs/06-release-pipeline-design.md) |
| Public renderer v0 | Done. `/s/<site>/<page>` serves the current release only, stamped with `<meta name="x-release">`; practical information comes only from confirmed facts |
| Hotel marketing website | Done for customer zero: home, rooms, services, neighbourhood, gallery, contact, in FR and EN; room cards and detail from the hotel pack; contact details and map from confirmed facts; schema.org `Hotel`, hreflang, sitemap and robots per site. **No booking logic**: the "Book" button is a link (the booking mock built on 23 Sep is parked in `src/booking/`) |
| Admin | Fixed 24 Sep: the admin rendered a blank page because its component map was stale. CI now fails if the map is out of date |
| Not started | Studio, AI generation (model key pending), hotel pack types, templates, media pipeline, domains automation, RLS enforcing mode |

## 7. Tech stack

| Layer | Choice | Version |
| --- | --- | --- |
| Language | TypeScript | 5.x |
| Framework | Next.js (App Router, Turbopack) | 16.3.3 |
| CMS | Payload with `@payloadcms/db-postgres`, `plugin-multi-tenant`, `plugin-mcp` | 3.90.1 |
| Database | Postgres (Neon serverless in production, Docker locally) | 16 |
| Tests | Vitest (integration), Playwright (end to end) | 4.x |
| Package manager | pnpm workspaces | 12.x |
| Hosting | EdgeOne Makers, CLI `edgeone` | 1.6.x |
| Planned | Puck (studio), OpenTelemetry (traces), OpenAPI 3.1 (contracts) | — |

## 8. Repository layout

```
.
├── HANDOFF.md                 where things stand, plan deltas, next actions, delta log
├── CLAUDE.md                  non-negotiable rules and gotchas for every coding agent
├── apps/
│   └── platform/              Next.js + Payload application
│       ├── src/collections/   Users, Tenants, Sites, Pages, Media, Domains, Releases, Facts
│       ├── src/admin/         Website panel (publish, undo, view site, releases)
│       ├── src/design/        design contract in code: templates, theme resolution, colour maths, fonts
│       ├── src/media/         photo storage adapter (Postgres); public route in src/app/media
│       ├── src/access/        access helpers + overrideAccess allowlist
│       ├── src/app/(sites)/   public site routes /s/<site>[/<locale>][/<page>], sitemap.xml, robots.txt
│       ├── src/site/          block renderers, header and footer, locale routing
│       ├── src/onboarding/    a hotel's first-site content (customer zero), apply, photo import, owner accounts
│       ├── src/packs.ts       loads vertical packs (hotel) into the app
│       ├── src/booking/       parked: booking adapter and mock, not used by the site
│       ├── src/db/            RLS policies, checksums, backup/restore, fingerprint tools
│       ├── src/ingest/        crawler spike, normaliser, fact import + owner decisions
│       ├── src/jobs/          background jobs (tenant carried in the input)
│       ├── src/migrations/    Payload migrations (the only way shared schemas change)
│       ├── src/releases/      publish, rollback, snapshot, checksum, renderer lookup
│       ├── src/seed/          seed, password rotation
│       ├── tests/int/         isolation, audit, REST/GraphQL, RLS, facts, releases, design, public site, self-service, own domain, plugins, ingest, generation, brand, health
│       ├── tests/quality/     quality gates (per template, both channels) and the nightly live run
│       ├── tests/visual/      screenshot scripts (site, admin, every template)
│       └── edgeone.json       Makers build and Frankfurt region
├── docs/
│   ├── 01-solution-definition.md   the spec (Hotelier Website Platform)
│   ├── 02-90-day-plan.md           the plan (baseline)
│   ├── CHECKLIST.md                progress against the plan
│   ├── 03-, 04-                    Webstudio and EdgeOne Makers evaluations
│   ├── 05-week1-spike-results.md   measured results, findings 1–30
│   ├── 06-release-pipeline-design.md   release pipeline (v0 implemented)
│   ├── 07-content-model-and-hotel-pack.md   content model and hotel pack, on paper
│   ├── 08-ingest-spike.md          ingest and fact base, customer zero
│   ├── 09-system-design.md         system design, illustrated
│   ├── 10-roadmap-phases.md        phases 1–5 with deliverables
│   ├── 11-design-contract.md       templates, brand, tokens, gates
│   ├── 12-strategy-decisions.md    architecture, domains, plugins, security, compliance, design
│   ├── 13-how-it-works.md          plain-words guide, glossary, repository map, reading guide
│   ├── 14-designer-brief.md        brief and example prompts for new templates
│   ├── design-tokens/              each template's tokens (W3C format)
│   ├── screenshots/                dated evidence
│   ├── contracts/                  cross-team contracts v0.1
│   └── outreach/                   vendor correspondence drafts
├── packages/                  reserved for shared packages (empty)
├── packs/hotel/               hotel pack (@hh/pack-hotel): room types, offers, rooms/offers/policies blocks, schema.org Hotel
├── templates/                 reserved; templates live in apps/platform/src/design for now
├── scripts/                   setup.ps1 / setup.sh
└── .claude/skills/            EdgeOne Makers skills for agents
```

## 9. Run it locally

Requires Node 22 or newer, pnpm and Docker. On Windows, run `scripts/setup.ps1` first (CLI, skills, MCP).

```bash
docker run -d --name hh-postgres -e POSTGRES_USER=hh -e POSTGRES_PASSWORD=hh_local_dev \
  -e POSTGRES_DB=hh_platform -p 5432:5432 -v hh-postgres-data:/var/lib/postgresql/data postgres:16-alpine
pnpm install
cd apps/platform
cp .env.example .env     # DATABASE_URL=postgres://hh:hh_local_dev@localhost:5432/hh_platform
                         # PAYLOAD_SECRET=<a long random string>
pnpm payload migrate     # build the schema from the committed migrations
pnpm exec tsx src/db/apply-rls.ts   # row-level security policies
pnpm seed                # 50 synthetic tenants (~6 s locally); real tenants are never touched
pnpm exec tsx src/ingest/import-facts.ts src/ingest/confirmations/hotel-herse-dor.json --publish
                         # customer zero: tenant, site, facts + owner decisions, first release
pnpm dev                 # http://localhost:3000/admin — super@example.test / the seed password
                         # http://localhost:3000/s/hotel-herse-dor — the public site
```

The ingest import reads `apps/platform/.ingest/www.hotel-herse-dor.com/facts.json`, which is not committed (third-party content). Produce it with `pnpm exec tsx src/ingest/spike.ts https://www.hotel-herse-dor.com`.

Publishing and rolling back, as a logged-in user of the site's tenant:

```bash
curl -X POST -H "Authorization: JWT <token>" http://localhost:3000/api/sites/<id>/publish    # ?queue=1 to queue a job
curl -X POST -H "Authorization: JWT <token>" http://localhost:3000/api/sites/<id>/rollback
```

Against a local database, Payload's schema push keeps tables in step with the collections automatically; set `PAYLOAD_DB_PUSH=false` to work from migrations only. Against any other database, push is off by design: schema changes go through migrations (`CLAUDE.md` rules 10 and 13).

## 10. Tests

| Suite | File | What it proves |
| --- | --- | --- |
| Isolation matrix | `tests/int/isolation.int.spec.ts` | 13 cases: a tenant user can reach only their own data via the Local API |
| `overrideAccess` audit | `tests/int/override-access.int.spec.ts` | No unlisted bypass of access control in `src/` |
| REST and GraphQL | `tests/int/rest-isolation.int.spec.ts` | The same boundary over HTTP; needs `PLATFORM_URL` |
| RLS, raw SQL | `tests/int/rls.int.spec.ts` | Postgres refuses cross-tenant read, update, delete and move |
| RLS under Payload | `tests/int/rls-payload.int.spec.ts` | With access control off, RLS alone keeps Payload's queries in-tenant |
| Bulk, imports, jobs | `tests/int/isolation-extended.int.spec.ts` | Bulk update/delete by `where`, row-by-row imports and background jobs stay in-tenant |
| Fact base | `tests/int/facts.int.spec.ts` | Facts are tenant-scoped; born unconfirmed; decision stamps cannot be forged |
| Releases | `tests/int/releases.int.spec.ts` | Immutability, superseding, lock, concurrent publishes, verification rollback, manual rollback, job tenancy, Gate 2 timings |
| Booking mock (parked) | `tests/int/booking.int.spec.ts` | Keeps the parked adapter compiling and correct |
| Normaliser | `tests/int/normalise.int.spec.ts` | The real extraction glitches from customer zero |
| Public site over HTTP | `tests/int/site-http.int.spec.ts` | Publish/rollback endpoints refuse other tenants; served page carries the release stamp; locales and hreflang; schema.org Hotel; sitemap and robots; no booking route; needs `PLATFORM_URL` |

```bash
pnpm test:isolation                                              # isolation + audit
pnpm exec vitest run --config ./vitest.config.mts tests/int      # everything (82 tests with a server running)
PLATFORM_URL=http://localhost:3000 pnpm exec vitest run --config ./vitest.config.mts tests/int/rest-isolation.int.spec.ts
```

Against Neon, first set `SEED_PASSWORD` to the rotated value. The tests refuse to start without it, because wrong-password logins lock the accounts.

## 11. Deploy (proof of concept)

```bash
cd apps/platform
edgeone makers link -n hh-platform        # note: link also pulls the project's variables into .env; restore a local .env afterwards
edgeone makers env set DATABASE_URL "<neon url>" -e production   # secrets live in Makers, never in .env
edgeone makers env set PAYLOAD_SECRET "<random>" -e production
# move .env out of the folder first: the CLI uploads the whole directory
edgeone makers deploy . -n hh-platform -a overseas -e production --json --skip-ai-gateway-sync
```

`-a overseas` (Global, Chinese mainland excluded) is required: the default area includes mainland China, which needs an ICP filing and disables custom domains (finding 22). `edgeone.json` pins cloud functions to `eu-frankfurt`. The earlier project `hh-platform-poc` (area global) still serves the same database at https://hh-platform-poc.edgeone.cool until it is retired. Build logs are not shown by the CLI; if a deploy fails, run `pnpm run build` locally.

## 12. Security and data protection

- Secrets never enter the repository or chat. They live in user environment variables and Makers project variables; `HANDOFF.md` lists the names and where each one is kept, never the values.
- Tenant isolation is a security-critical subsystem. Every PR that touches tenancy, access control or releases must extend the isolation suite, and the suite runs on every Payload upgrade.
- Payload security releases are applied within days. Payload is pinned, not floating.
- The data stays in the EU: functions and database are both in Frankfurt. The DPA and sub-processor list are week-1 deliverables.
- The public proof of concept holds synthetic test tenants plus customer zero's public business information (name, phones, check-out time). No guest data. Seeded passwords have been rotated.

## 13. How work is tracked

Three files, each with one job:

| File | Answers | Changes when |
| --- | --- | --- |
| [`docs/02-90-day-plan.md`](docs/02-90-day-plan.md) | What we intend to do, week by week, and the gates | Only by decision. It is the baseline |
| [`docs/CHECKLIST.md`](docs/CHECKLIST.md) | What is done, with evidence, and what is open | In the same commit that completes an item |
| [`HANDOFF.md`](HANDOFF.md) | Where we are right now, how reality differs from the plan, what to do next, what changed each session | At the end of every working session |

**Working loop.** Read `HANDOFF.md` first, then pick the top next action. Do the work, tick the checklist in the same commit, and put measured numbers in a results doc. Before stopping, rewrite *Current state*, update *Plan deltas*, and add a *Delta log* entry. Commits use conventional-commit prefixes (`feat`, `fix`, `docs`, `security`, `chore`).

## 14. Roadmap and gates

| Gate | Week | Date | Pass condition | If it fails |
| --- | --- | --- | --- | --- |
| 1. Hosting and CMS | 3 | 12 Oct 2026 | Makers must-pass items evidenced in writing; isolation proof complete | Cloudflare EU fallback that week; CMS frozen regardless |
| 2. Foundations | 6 | 2 Nov 2026 | Publish under 60 s, rollback under 10 s, fifty domains served, CI gates blocking | Slip customers 2–3 by a week |
| 3. Service | 9 | 23 Nov 2026 | Three hotels live; scheduled checks running unattended | A week of hardening before customers 4–5 |
| 4. Build phase | 13 | 21 Dec 2026 | Five paying hotels; human minutes per site known | Extend the concierge phase |

Not in the first 90 days: self-serve signup, billing automation, the control-plane dashboard, the autonomous service loop at fleet scale, agency workspaces, multi-property, a second hosting adapter, or any vertical other than hotels.

## 15. Documentation

All documentation lives in [`docs/`](docs/README.md). Start with the first row that matches you.

**Start here**

| Document | What it is |
| --- | --- |
| [`docs/13-how-it-works.md`](docs/13-how-it-works.md) | **How the platform works**, in plain words: one multi-tenant Payload for all hotels, the words we use, what happens when a hotel publishes or a guest visits, where everything lives, common questions, what to read next |
| [`HANDOFF.md`](HANDOFF.md) | **Where things stand**: current state, plan deltas, next actions, delta log of every session |
| [`docs/CHECKLIST.md`](docs/CHECKLIST.md) | **Progress**: 90-day plan items, phase lists, gates, open decisions, metrics |

**For the owner and the business**

| Document | What it is |
| --- | --- |
| [`docs/01-solution-definition.md`](docs/01-solution-definition.md) | The spec: service model, capabilities, domain model, architecture, decisions, risks |
| [`docs/02-90-day-plan.md`](docs/02-90-day-plan.md) | The baseline plan, week by week, to the first paying hotels (changes only by decision) |
| [`docs/10-roadmap-phases.md`](docs/10-roadmap-phases.md) | The next phases (self-service, own domain and templates, generation, operated service, paying hotels) with deliverables |
| [`docs/12-strategy-decisions.md`](docs/12-strategy-decisions.md) | Strategy decisions (24 Sep): what a hotel gets, domains, plugins, EdgeOne features, security, GDPR and accessibility, email, design |
| [`docs/outreach/`](docs/outreach/) | Vendor correspondence, starting with the Tencent Makers email |

**For engineers and coding agents**

| Document | What it is |
| --- | --- |
| [`CLAUDE.md`](CLAUDE.md) | Non-negotiable rules and known gotchas for anyone changing the code |
| [`docs/09-system-design.md`](docs/09-system-design.md) | System design, illustrated: context, containers, isolation, ingest, releases, schema changes |
| [`docs/06-release-pipeline-design.md`](docs/06-release-pipeline-design.md) | Release pipeline: per-site lock, immutable releases, verification, rollback |
| [`docs/07-content-model-and-hotel-pack.md`](docs/07-content-model-and-hotel-pack.md) | Platform primitives, provenance, locales, hotel pack types |
| [`docs/08-ingest-spike.md`](docs/08-ingest-spike.md) | Ingest on customer zero: facts, conflicts, site audit |
| [`docs/contracts/`](docs/contracts/) | Cross-team contracts: erasure and export, chatbot widget, booking-engine embed |

**For designers**

| Document | What it is |
| --- | --- |
| [`docs/14-designer-brief.md`](docs/14-designer-brief.md) | The brief: what a designer decides, what is fixed, every block, deliverables, checklist |
| [`docs/11-design-contract.md`](docs/11-design-contract.md) | The rules: templates, brand, tokens, contrast gates, fonts, block classes, who designs what |
| [`docs/design-tokens/`](docs/design-tokens/) | Each template's colours, fonts and corners in W3C design-token format, and what a hotel can change |
| [`docs/screenshots/`](docs/screenshots/README.md) | Real hotel content in every template, and dated screenshots of the live site and admin |

**Example prompts** — [`docs/prompts/`](docs/prompts/README.md)

| Prompt | For |
| --- | --- |
| [Start a working session](docs/prompts/start-session.md) | A coding agent picking up the next action and finishing with docs updated |
| [Implement a designer's template](docs/prompts/implement-template.md) | A coding agent, once a designer delivers |
| [Propose a new template](docs/prompts/propose-template.md) | An AI design assistant, when there is no designer |
| [Brief a freelance designer](docs/prompts/designer-brief-email.md) | An email to a designer |
| [Propose a template and brand for a hotel](docs/prompts/brand-proposal.md) | An AI assistant choosing among our templates |
| [Onboard a new hotel](docs/prompts/onboard-hotel.md) | A coding agent putting a hotel on the platform from its website |
| [Add a feature or a plugin](docs/prompts/add-feature.md) | A coding agent extending the core, the hotel pack, or adopting a Payload plugin |

**Evidence and evaluations**

| Document | What it is |
| --- | --- |
| [`docs/05-week1-spike-results.md`](docs/05-week1-spike-results.md) | Measured results and findings 1–30: isolation, deploys, Neon, RLS, migrations, CI, releases, photos, domains |
| [`docs/04-edgeone-makers-evaluation.md`](docs/04-edgeone-makers-evaluation.md) | Hosting: verified facts, quotas, residency, EdgeOne API |
| [`docs/03-webstudio-evaluation.md`](docs/03-webstudio-evaluation.md) | Prior art: what to take, why not to adopt |

The spec is edited as a Claude Docs artifact, *Hotelier Website Platform — Solution Definition*, and exported to `docs/01-solution-definition.md` after each change. The checklist and `HANDOFF.md` are the operational source of truth; the artifact is the design source of truth.

## 16. Contributing

Read [`CLAUDE.md`](CLAUDE.md) before writing code, whether you are a person or an agent. The rules that are hardest to undo:

1. No industry concept in the core. Hotel types live in `packs/hotel`.
2. One application, pooled tenancy, immutable releases. Never an instance per customer.
3. Tenant isolation in the data-access layer. Every `overrideAccess: true` is allowlisted and justified.
4. Nothing provider-specific in the application. Only the release pipeline talks to the host.
5. Payload upstream, unforked.
6. Every field carries provenance. Human edits are never silently overwritten.
