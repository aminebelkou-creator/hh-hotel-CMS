# Checklist

Living checklist for the 90-day plan (28 September to 25 December 2026). Tick items in the commit that completes them, with a link to the evidence. Owner codes: **ENG** engineering, **BIZ** sales and partnerships, **OWN** project owner, **XT** another xedge team.

Last updated: 25 September 2026, session 14 (Phases 3–5 engineering deployed; Lumière 2.0 from the licensed Luxorefi template, Butler font; customer zero live on Lumière; a "Fix later" list started). The next phases and their deliverables: [`10-roadmap-phases.md`](10-roadmap-phases.md). Evidence: [`screenshots/`](screenshots/README.md). For the current state, plan deltas and ordered next actions, read [`../HANDOFF.md`](../HANDOFF.md) first.

## At a glance

| Area | Done | Open | Note |
| --- | --- | --- | --- |
| Owner actions before week 1 | 4 | 3 | Send the Tencent email, revoke the CAM key, share the repo |
| Week 1 | 9 | 4 | Engineering done early; BIZ and XT items not started |
| Week 2 | 8 | 6 | Proof items and the fact flow done; the Makers gate (waiting on Tencent), the `teo` API (needs a test domain), hotel pack types on paper, generation measured with the AI key, and BIZ items open |
| Weeks 3–13 | 2 | 44 | The weekly list still counts by calendar; most engineering rows are built already (see the phase view) — they are ticked when their gate evidence exists (domain, Tencent, real hotels) |
| Phase 1–5 (new list) | 25 | 11 | Engineering of Phases 1–4 and the Phase 5 mechanisms built by 25 Sep; open items are owner/BIZ (key, lawyer, audit, designer, hotels), RLS enforcing, the visual studio |
| Fix later | 0 | 9 | Small product gaps noticed in use, in a table at the end; started 25 Sep |
| **Total** | **48** | **77** | |

## Phase view (added 24 September)

The weekly items below map onto five phases, detailed in [`10-roadmap-phases.md`](10-roadmap-phases.md):

| Phase | Dates | Headline | Status |
| --- | --- | --- | --- |
| 0 — Proof and first site | 22–27 Sep | Isolation, hosting, CI, releases, customer zero's site | **Done**: site live and approved ([screenshots](screenshots/README.md)) |
| 1 — Hotelier self-service | 28 Sep – 11 Oct | Publish and preview from the admin, photo uploads, hotel pack v1, legal pages | **Done early (24 Sep)** except amenities as a type ([screenshots](screenshots/README.md)) |
| 2 — Own domain, templates, quality gates | 12 Oct – 1 Nov | Gate 1, custom domain, two templates, accessibility/performance in CI | **Engineering done 25 Sep** (own-domain serving, speed, phone photos, static map, plugins, contact form, security basics, quality gates); custom domains possible (project area overseas), waiting for a test domain and Tencent's answer for Gate 1 |
| 3 — Generate from a URL | 2 – 22 Nov | AI ingest, fact review, generation, translation; design partners | **Engineering done 25 Sep** (works without a model; the model features and the 80 % measure wait for the AI key); design partners: BIZ |
| 4 — Operated service | 23 Nov – 13 Dec | Scheduled checks, one-tap fixes, monthly report, RLS enforcing | **Engineering done 25 Sep** except RLS enforcing (after Gate 1) and Sentry (owner) |
| 5 — Five paying hotels | 14 – 25 Dec | Gate 4 | Mechanisms done (canary upgrades, backups, compliance drafts); hotels, lawyer, audit, pen test: BIZ/OWN |

Phase 1 items, tracked here until they land in the weekly list:

- [x] **ENG** Publish, roll back and "View site" from the admin; list of releases per site — `src/admin/PublishPanel.tsx`, [live as the owner](screenshots/phase-1/live-owner-publish.jpg)
- [x] **ENG** Draft preview link on each page — `/preview/pages/<id>`, signed-in users only, other tenants get 404 ([screenshot](screenshots/phase-1/preview-contact.jpg))
- [x] **ENG** Media pipeline v0: uploads, WebP variants (400/960/1920), alt text required; customer zero's 20 photos moved off the old site (0 hot-linked images live). Storage is Postgres in Frankfurt for now, not object storage (docs/05 finding 28)
- [x] **ENG** Hotel pack v1: offers (dated, RLS), policies block, FAQ block with FAQPage structured data
- [ ] **ENG** Hotel pack v1: amenities as a type (today a features block)
- [x] **ENG** Legal notice, privacy page, accessibility statement in the footer — drafts for the owner to validate ([screenshot](screenshots/phase-1/site-legal-notice-fr.jpg))
- [x] **OWN** Owner account for customer zero (tenant user, not super-admin) — created on Neon with `src/onboarding/owner.ts`; password in user env var `HH_OWNER_PASSWORD`
- [x] **OWN** Customer zero's demo content reviewed — approved 24 Sep ("the website info are alright")

Phase 2 and later items from the strategy session of 24 September ([`12-strategy-decisions.md`](12-strategy-decisions.md)):

- [x] **ENG** Design contract: tokens, brand fields, contrast gates, self-hosted fonts — [`11-design-contract.md`](11-design-contract.md)
- [x] **ENG** Three templates built in-house (Maison, Atelier, Soirée); a hotel switches with no content change — [screenshots](screenshots/README.md)
- [x] **ENG** Platform moved to a Makers project in area overseas, so custom domains can be added (finding 22)
- [x] **ENG** Guides: how the platform works ([`13-how-it-works.md`](13-how-it-works.md)); designer brief ([`14-designer-brief.md`](14-designer-brief.md)); template tokens for designers ([`design-tokens/`](design-tokens/)); example prompts ([`prompts/`](prompts/README.md)); README documentation section by audience
- [x] **ENG** Own-domain serving: hotel recognised from the domain, `/` instead of `/s/<site>`, `/admin` only on our domain — `src/proxy.ts`, `app/(sites)/h/`, `tests/int/own-domain.int.spec.ts` (tested locally with a fake host; live once a domain exists)
- [x] **ENG** Speed: public pages carry edge cache headers (10 s, stale for a minute) and the origin does one query per page instead of six — but the Makers CDN does not cache function responses (finding 31), so real edge caching waits for Gate 1
- [x] **ENG** Photo uploads from phones under the 6 MB function limit — shrunk in the browser (`src/admin/UploadShrinker.tsx`), 5 MB cap with a clear error
- [x] **ENG** Adopt Payload SEO, Redirects, Form Builder (tenant-scoped, RLS, isolation-tested; `tests/int/plugins.int.spec.ts`). Import/Export deferred: the per-hotel export already exists (`tenant-backup.ts`) and the plugin needs an upload collection on our storage adapter
- [x] **ENG** Contact form: form block, `POST /api/contact`, honeypot and timing checks, submissions in the admin per hotel; email through SMTP once the owner sets the provider (`SMTP_*` variables)
- [x] **ENG** Security basics: security headers on every response, login lockout (5 tries, 15 min), Dependabot, CodeQL. Edge rate limits are a console setting on the host (owner)
- [x] **ENG** Static map image at publish time instead of the OpenStreetMap embed — `src/media/static-map.ts`
- [x] **ENG** Quality gates in CI for every template: axe (WCAG 2.2 AA), structured data, page-weight budget, one h1/lang/canonical — `tests/quality/gates.mjs`, runs on every push. Lighthouse itself is not run (the budget covers its weight signal; scores come from the owner's PageSpeed checks)
- [x] **ENG** Brand proposal (accent from logo/photos, template from facts, apply after approval) — `src/design/propose-brand.ts`, Look panel; prompt `docs/prompts/onboard-hotel-self-service.md`
- [x] **ENG** Ingest v1 in the admin, fact review screen, generation from confirmed facts, translation with edit protection — `src/ingest/`, `src/generate/`, `/admin/review/<site>`; one model door `src/ai/provider.ts` (mock until the key exists)
- [ ] **ENG** Visual studio v0 on the same blocks (Phase 3) — not started; the admin forms plus preview cover editing today
- [x] **ENG** Hotel dashboard and team dashboard (admin home), issues with one-tap fixes, nightly checks and axe on live sites, monthly report, action log — `src/health/`, `src/admin/Dashboard.tsx`, `.github/workflows/nightly.yml`
- [x] **ENG** Uptime workflow every 30 min, action log, backup scope extended to every tenant table and restore drill re-run (Phase 4). Sentry not added (owner: account)
- [x] **ENG** Template upgrade path: canary channel per site, `[data-canary]` CSS sections, gates on both channels (Phase 5 mechanism)
- [ ] **ENG** RLS enforcing for live requests (after Gate 1: restricted role on Neon)
- [ ] **BIZ** Data processing agreement for hotels, providers list, processing register, breach procedure (before the first invoice) — engineering drafts in `docs/compliance/`; lawyer review needed
- [ ] **BIZ** External accessibility audit and penetration test (before the first invoice)
- [ ] **OWN** Delete the old Makers project `hh-platform-poc` in the console
- [ ] **OWN** Our platform domain and a test subdomain; email provider account
- [x] **ENG** Lumière 2.0: faithful adaptation of the licensed Luxorefi template, with the seven structural additions it needed (hero stars from facts + booking bar to the Book link, banners block, section head with link, room tag + facts with icons, feature icons, photo band, checklist) — handoff `Documents\hh-template-handoffs\luxorefi-lab`, CSS in `site.css`, gates on four templates
- [ ] **OWN** Butler licence confirmation **before a client goes live on Lumière**: the font files declare CC BY-SA 4.0 (installed for testing 25 Sep, `apps/platform/src/design/fonts/butler.LICENSE.txt`); confirm on the designer's page, put the attribution line in the legal notice, record the confirmation here
- [ ] **OWN** Hotelza ZIP from ThemeForest → same method (handoff by the design session, PR by the repo agent)
- [ ] **OWN** A designer to add and refine templates within the contract
- [ ] **OWN** Sentry (EU) account if error alerts beyond uptime are wanted; AI model key to switch on extraction, copy, translation

## Before week 1 — owner actions

- [ ] **OWN** Email Tencent Cloud — **draft ready to send: [`outreach/tencent-makers-platforms-email.md`](outreach/tencent-makers-platforms-email.md)** — for: Makers Platforms API reference, quotas at 100 / 500 / 1,000 tenants, commercial pricing, DPA covering edge processing, KV and Blob, Frankfurt pinning confirmed, whether Makers custom domains and EdgeOne alias domains are the same mechanism
- [ ] **OWN** Revoke the Tencent CAM API key beginning `IKIDTYWK` (it was pasted in chat); create a fresh one and store it as user environment variables `TENCENTCLOUD_SECRET_ID` / `TENCENTCLOUD_SECRET_KEY`
- [x] **OWN** Public proof-of-concept deployment: seeded passwords rotated to a random value (user env var `HH_NEON_SEED_PASSWORD`); default password returns 401 on the live URL
- [ ] **OWN** Share this repository and the plan with the team; let them push on the dates
- [x] GitHub repository created and scaffolded
- [x] EdgeOne CLI, Makers skills, MCP config installed; CLI logged in (Global)
- [x] Neon Postgres created in Frankfurt (`eu-central-1`)

## Week 1 (28 Sep) — started early, 22–23 Sep

- [x] **ENG** Isolation proof: Payload + Postgres, multi-tenant and MCP plugins, 7 collections — `apps/platform`
- [x] **ENG** 50 tenants seeded (local 6.3 s, Neon 257 s)
- [x] **ENG** Local API isolation matrix, 13 tests — `tests/int/isolation.int.spec.ts`
- [x] **ENG** `overrideAccess` audit with allowlist — `tests/int/override-access.int.spec.ts`
- [x] **ENG** REST and GraphQL isolation — `tests/int/rest-isolation.int.spec.ts`
- [x] **ENG** 17/17 green locally **and** on production infrastructure (Makers + Neon Frankfurt) — [`05-week1-spike-results.md`](05-week1-spike-results.md)
- [x] **ENG** First Makers deploys measured: static 49.6 s, Next.js + Payload 153 s
- [x] **ENG** Cross-team contract drafts v0.1 — [`contracts/`](contracts/)
- [ ] **ENG** Collection design on paper: platform primitives, provenance, locale — review with the team (**draft ready: [`07-content-model-and-hotel-pack.md`](07-content-model-and-hotel-pack.md)**)
- [x] **ENG** Ingest spike: scrape a hotel site and Google Business Profile into a fact base — site done on customer zero, 41 pages → 45 facts, 2 live conflicts ([`08-ingest-spike.md`](08-ingest-spike.md)); Google Business Profile needs the hotel's authorisation
- [ ] **BIZ** Shortlist 15 hotels; first conversations. The owner's own hotel is customer zero
- [ ] **BIZ** Draft DPA and sub-processor list
- [ ] **XT** Send contract drafts to PMS, CRM and booking-engine teams

## Week 2 (5 Oct)

- [x] **ENG** Remaining proof items (all six done 23 Sep):
  - [x] Postgres row-level security enabled on tenant tables; full suite still green — 26/26 on Neon, incl. Payload queries with access control off held by RLS alone ([results](05-week1-spike-results.md#row-level-security-as-defence-in-depth--evaluated-on-neon-frankfurt))
  - [x] Schema migration applied across 10, then 50 tenants; data verified per tenant — local and Neon (332 ms), 0 unintended changes ([results](05-week1-spike-results.md#migrations-schema-change-at-10-and-50-tenants-single-tenant-restore--23-september-2026))
  - [x] Payload upgrade path rehearsed 3.89.0 → 3.90.1 (3.90.1 is the latest stable); suites green; upgrades are one-way and can carry schema changes
  - [x] Single-tenant backup and restore without touching other tenants — local 35 ms, Neon 1.7 s, 0 of 50 tenants differ
  - [x] Admin UI tenant selector, bulk operations, imports and jobs covered by tests — `isolation-extended.int.spec.ts` (7) + forged tenant-cookie REST test; job pattern in `src/jobs/`
  - [x] Two colliding publishes on Makers' single build slot: both accepted, last to finish goes live (finding 17) — the pipeline must serialise publishes
- [ ] **ENG** Makers gate: quotas and pricing in writing, fifty custom domains, Frankfurt pinning confirmed
- [ ] **ENG** EdgeOne `teo` API exercised from code: `CreateAccelerationDomain` + `ModifyHostsCertificate` against a test site — client and read-only probe done; Makers domains are not reachable via `teo` (finding 20); write test needs a zone on a domain we control (e.g. `staging.hotel-herse-dor.com`)
- [ ] **ENG** Hotel pack types on paper: Room, Offer, Amenity, Outlet, Policy, LocalGuide (**draft ready: [`07-content-model-and-hotel-pack.md`](07-content-model-and-hotel-pack.md)**, needs team review)
- [x] **ENG** Fact confirmation flow — `facts` collection, normaliser, import with the owner's decisions; customer zero: 45 sightings → 35 facts, 3 confirmed, 1 rejected ([`08-ingest-spike.md`](08-ingest-spike.md#from-the-spike-to-the-fact-base-built-23-september))
- [ ] **ENG** Full draft site generated as JSON entries from confirmed facts — needs the AI model key (owner)
- [ ] **BIZ** Five hotels in serious talks; concierge offer written
- [ ] **BIZ** Service tiers drafted; accessibility target set per template

## Week 3 (12 Oct) — Gate 1: hosting and CMS

- [ ] **Gate 1**: every must-pass item in *Hosting provider decision* evidenced; isolation proof complete. If Makers fails, execute the Cloudflare EU fallback this week. CMS frozen regardless
- [ ] **ENG** Monorepo structure final; Payload running with multi-tenant and MCP plugins (done early)
- [ ] **ENG** Translation step for two locales
- [ ] **BIZ** **Three design partners signed**
- [ ] **BIZ** Consent management chosen and configured

## Week 4 (19 Oct)

- [x] **ENG** Release pipeline v0 for content: immutable snapshot + checksum, per-site lock, superseding, verification with automatic rollback, pointer-move rollback, public renderer — done 23 Sep ([`06-release-pipeline-design.md`](06-release-pipeline-design.md#what-v0-implements-23-september))
- [ ] **ENG** Release pipeline: domain bind — blocked, custom domains disabled on the Makers project (finding 22)
- [ ] **ENG** Canonical content model live; RLS decision recorded
- [ ] **ENG** Two template packages, accessibility- and Core Web Vitals-gated in CI
- [ ] **ENG** Customer 1 ingest and fact confirmation, by hand — done for customer zero (24 Sep): ingest, facts, and a full FR/EN marketing site built by hand from `src/onboarding/`, **approved by the owner** ([screenshots](screenshots/README.md)); stays open for the first design partner
- [ ] **XT** **Cross-team contracts signed**: erasure, chatbot boundary, booking embed
- [ ] **BIZ** Tiers priced

## Week 5 (26 Oct)

- [ ] **ENG** Media pipeline: object storage plus on-the-fly derivatives; domain and certificate flow
- [x] **ENG** Hotel pack implemented as a pack, with no core change — v0 done early (24 Sep): `packs/hotel` with room types, rooms block, schema.org Hotel; offers, amenity types and policies still to add
- [ ] **ENG** Generation pipeline v0 end to end, run by engineers
- [ ] **BIZ** Customer 1 draft site reviewed with the hotel
- [ ] **ENG** Accessibility statement generator; AI disclosure component

## Week 6 (2 Nov) — Gate 2: foundations

- [ ] **Gate 2**: publish to live under 60 s, rollback under 10 s, fifty domains served, CI gates blocking. *Content releases already meet it on Neon (publish 3.1 s, rollback 1.2 s; docs/05 finding 23). Proposed: the 60 s target applies to content releases; code deploys (about 3 min) are out of scope*
- [ ] **ENG** Provenance on every field; patch log
- [ ] **ENG** Puck studio v0 on Payload blocks, desktop
- [ ] **BIZ** **Customer 1 live on own domain**
- [ ] **BIZ** First invoice issued by hand

## Weeks 7–8 (9 and 16 Nov)

- [ ] **ENG** Structured data validation and CWV check on every publish
- [ ] **ENG** MCP server per tenant with scoped keys; `overrideAccess` audit extended
- [ ] **ENG** Mobile content editing; version history and rollback in the studio
- [ ] **ENG** Broken-link, stale-offer and accessibility scans as scheduled jobs
- [ ] **ENG** Tenant export that round-trips
- [ ] **ENG** Regeneration with three-way merge tested against human edits
- [ ] **BIZ** Customers 2 and 3 live; human minutes logged per task
- [ ] **BIZ** DPA signed by customers 1–3; pricing validated

## Week 9 (23 Nov) — Gate 3: service

- [ ] **Gate 3**: three customers live; scheduled checks running without a human
- [ ] **XT** Read-only inventory projection from the PMS for design partners
- [ ] **ENG** Scheduled content proposals with one-tap approval
- [ ] **BIZ** Customers 4 and 5 recruited; service catalogue finalised

## Weeks 10–12 (30 Nov to 14 Dec)

- [ ] **ENG** Template canary: upgrade one tenant, then all
- [ ] **XT** Booking-engine embed on the hotel's domain via the signed contract — on hold by owner decision (24 Sep: marketing site, no booking logic); the early adapter and mock are parked
- [ ] **ENG** Agent drafts local-guide pages for customers 1–3
- [ ] **ENG** Per-tenant health view, internal
- [ ] **XT** Chatbot widget rendered per the boundary, with disclosure and consent gating
- [ ] **BIZ** Customers 4 and 5 live; first month's human minutes analysed
- [ ] **BIZ** First monthly service report sent to customers 1–3
- [ ] **ENG** Backup and single-tenant restore rehearsed in production
- [ ] **ENG** Hotel pack v1 tagged; upgrade path tested

## Week 13 (21 Dec) — Gate 4: build phase

- [ ] **Gate 4**: five paying customers; human minutes per site per month known; renewal conversations started
- [ ] **BIZ** Retrospective with all five hotels
- [ ] **OWN** 12-month roadmap drafted from the evidence

## Open decisions

| Decision | Needed by | Status |
| --- | --- | --- |
| Hosting: Makers confirmed or Cloudflare EU fallback | Gate 1, week 3 | Waiting on Tencent |
| Studio editor: Puck, Payload enterprise visual editor, or built | Week 6 | Puck by default |
| Service tiers and pricing shape | Week 4 | Not started |
| 60 s publish target: content releases only, or all deploys | Gate 2, week 6 | Code deploys 153–171 s; content releases now measured in milliseconds (docs/06). Proposed: the target applies to content releases |
| Postgres RLS as defence in depth: on or off in production | Week 4 | Evaluated, works under Payload. Proposed: on, via a restricted app role and a per-request `SET LOCAL` hook, then deny-by-default (see docs/05) |
| Proof-of-concept deployment: keep public with rotated credentials, or take offline | Now | Kept public, credentials rotated |

## Fix later (small things noticed in use, not blocking)

| Noticed | What happens | Fix | Added |
| --- | --- | --- | --- |
| Template changed in the admin, then "Publish site" → the old look goes live | The sidebar's Publish reads the **stored** site; an unsaved form change is ignored (owner hit this on 25 Sep: r7 shipped Maison after choosing Lumière). Workaround: Save, then Publish | Website panel: disable "Publish site" while the form has unsaved changes and say "Save first", or save automatically before publishing | 25 Sep |
| Every hotel site needs the three French legal pages | Customer zero has *Mentions légales*, *Confidentialité & cookies* and *Accessibilité* (drafts). Missing: **Règlement intérieur et conditions générales de vente** (the hotel's current site has one) | Add a `reglement-cgv` legal page to the onboarding content (from the hotel's own text) and to the generator's page set, so every new hotel gets the three: cookies/privacy, mentions légales, règlement intérieur + CGV | 25 Sep |
| Guest reviews and testimonials | No reviews block; the quote block carries one Victor Hugo line. Real reviews only (rule 9) | `testimonials` block fed by real guest reviews (imported with permission from Google/Booking with their source shown, or entered by the hotel) — PROPOSAL.md §8 of the Lumière handoff | 25 Sep |
| Special offers and deals in view | The `offers` block and collection exist (hotel pack) but customer zero shows none on the home page | Put an offers block on the home page of every generated site (empty = hidden); an "Offres" nav entry when at least one is active | 25 Sep |
| Blog / news | No posts collection | `posts` collection + `news` block (PROPOSAL.md §8); generated home page shows the latest three | 25 Sep |
| Easy-to-find contact information | Contact page and footer carry address, phones, email; the header has no phone | Phone number (tel: link) in the header on desktop and a sticky "Call / Book" bar on phones | 25 Sep |
| Irresistible calls to action | One `cta` block per page at most; wording is the hotel's | Generator writes a CTA block on every page (home, rooms, services, neighbourhood) with a benefit line ("best rate, direct contact"); templates give it more presence | 25 Sep |
| Animated hero: static photo, video, or a slideshow | The hero is one static photo (Lumière adds the stars and booking bar); the licensed originals use video or sliding photos | A `media` option on the hero: `image` (today), `video` (self-hosted MP4/WebM ≤ 3 MB, muted, loops, poster = the photo, plays only when `prefers-reduced-motion` allows, with a pause button — WCAG 2.2.2) or `slideshow` (2–5 photos, CSS crossfade every 6 s, no JS beyond a few lines, paused on reduced motion). Lightweight: the page-weight gate stays; the video never counts on phones (poster only below 768 px) | 25 Sep |
| A "Book now" button impossible to miss | Header "Réserver" button exists; on phones it is inside the burger menu | Keep the Book button visible outside the burger on phones; sticky bottom bar (see contact row); the hero booking bar already helps on Lumière | 25 Sep |

## Metrics tracked from day one

| Metric | Target by day 90 | Current |
| --- | --- | --- |
| Human minutes per site per month | Known for all five customers | — |
| Ingest to live on own domain | Under one working day for customer 5 | — |
| Full-site generation | Under 5 minutes | — |
| Publish to live / rollback | Under 60 s / under 10 s | Content release: 14–27 ms / 16–18 ms (local); code deploy 171 s from CI |
| Isolation suite | Green on every commit and every Payload upgrade | All suites green locally at 10 and 50 tenants and in CI on every push (incl. public site over HTTP) |
| Service checks resolved without a human | Over half by week 12 | — |
