# Checklist

Living checklist for the 90-day plan (28 September to 25 December 2026). Tick items in the commit that completes them, with a link to the evidence. Owner codes: **ENG** engineering, **BIZ** sales and partnerships, **OWN** project owner, **XT** another xedge team.

Last updated: 23 September 2026.

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
- [ ] **ENG** Collection design on paper: platform primitives, provenance, locale — review with the team
- [ ] **ENG** Ingest spike: scrape a hotel site and Google Business Profile into a fact base
- [ ] **BIZ** Shortlist 15 hotels; first conversations. The owner's own hotel is customer zero
- [ ] **BIZ** Draft DPA and sub-processor list
- [ ] **XT** Send contract drafts to PMS, CRM and booking-engine teams

## Week 2 (5 Oct)

- [ ] **ENG** Remaining proof items:
  - [x] Postgres row-level security enabled on tenant tables; full suite still green — 26/26 on Neon, incl. Payload queries with access control off held by RLS alone ([results](05-week1-spike-results.md#row-level-security-as-defence-in-depth--evaluated-on-neon-frankfurt))
  - [ ] Schema migration applied across 10, then 50 tenants; data verified per tenant
  - [ ] Payload upgrade to the next release; isolation suite re-run
  - [ ] Single-tenant backup and restore without touching other tenants
  - [ ] Admin UI tenant selector, bulk operations, imports and jobs covered by tests
  - [ ] Two colliding publishes on Makers' single build slot: observed behaviour recorded
- [ ] **ENG** Makers gate: quotas and pricing in writing, fifty custom domains, Frankfurt pinning confirmed
- [ ] **ENG** EdgeOne `teo` API exercised from code: `CreateAccelerationDomain` + `ModifyHostsCertificate` against a test site
- [ ] **ENG** Hotel pack types on paper: Room, Offer, Amenity, Outlet, Policy, LocalGuide
- [ ] **ENG** Fact confirmation flow; full draft site generated as JSON entries
- [ ] **BIZ** Five hotels in serious talks; concierge offer written
- [ ] **BIZ** Service tiers drafted; accessibility target set per template

## Week 3 (12 Oct) — Gate 1: hosting and CMS

- [ ] **Gate 1**: every must-pass item in *Hosting provider decision* evidenced; isolation proof complete. If Makers fails, execute the Cloudflare EU fallback this week. CMS frozen regardless
- [ ] **ENG** Monorepo structure final; Payload running with multi-tenant and MCP plugins (done early)
- [ ] **ENG** Translation step for two locales
- [ ] **BIZ** **Three design partners signed**
- [ ] **BIZ** Consent management chosen and configured

## Week 4 (19 Oct)

- [ ] **ENG** Release pipeline v0: build, immutable artifact, deploy, domain bind, rollback
- [ ] **ENG** Canonical content model live; RLS decision recorded
- [ ] **ENG** Two template packages, accessibility- and Core Web Vitals-gated in CI
- [ ] **ENG** Customer 1 ingest and fact confirmation, by hand
- [ ] **XT** **Cross-team contracts signed**: erasure, chatbot boundary, booking embed
- [ ] **BIZ** Tiers priced

## Week 5 (26 Oct)

- [ ] **ENG** Media pipeline: object storage plus on-the-fly derivatives; domain and certificate flow
- [ ] **ENG** Hotel pack implemented as a pack, with no core change
- [ ] **ENG** Generation pipeline v0 end to end, run by engineers
- [ ] **BIZ** Customer 1 draft site reviewed with the hotel
- [ ] **ENG** Accessibility statement generator; AI disclosure component

## Week 6 (2 Nov) — Gate 2: foundations

- [ ] **Gate 2**: publish to live under 60 s, rollback under 10 s, fifty domains served, CI gates blocking. *Open question: code deploys currently take 153 s — decide whether the 60 s target applies to content releases only, or move the build to CI*
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
- [ ] **XT** Booking-engine embed on the hotel's domain via the signed contract
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
| 60 s publish target: content releases only, or all deploys | Gate 2, week 6 | Measured 153 s for code deploys |
| Postgres RLS as defence in depth: on or off in production | Week 4 | Evaluated, works under Payload. Proposed: on, via a restricted app role and a per-request `SET LOCAL` hook, then deny-by-default (see docs/05) |
| Proof-of-concept deployment: keep public with rotated credentials, or take offline | Now | Kept public, credentials rotated |

## Metrics tracked from day one

| Metric | Target by day 90 | Current |
| --- | --- | --- |
| Human minutes per site per month | Known for all five customers | — |
| Ingest to live on own domain | Under one working day for customer 5 | — |
| Full-site generation | Under 5 minutes | — |
| Publish to live / rollback | Under 60 s / under 10 s | 153 s code deploy / not measured |
| Isolation suite | Green on every commit and every Payload upgrade | 26/26 (with RLS) |
| Service checks resolved without a human | Over half by week 12 | — |
