# Checklist

Living checklist for the 90-day plan (28 September to 25 December 2026). Tick items in the commit that completes them, with a link to the evidence. Owner codes: **ENG** engineering, **BIZ** sales and partnerships, **OWN** project owner, **XT** another xedge team.

Last updated: 23 September 2026. For the current state, plan deltas and ordered next actions, read [`../HANDOFF.md`](../HANDOFF.md) first.

## At a glance

| Area | Done | Open | Note |
| --- | --- | --- | --- |
| Owner actions before week 1 | 4 | 3 | Send the Tencent email, revoke the CAM key, share the repo |
| Week 1 | 9 | 4 | Engineering done early; BIZ and XT items not started |
| Week 2 | 8 | 6 | All six proof items and the fact confirmation flow done; the Makers gate (waiting on Tencent), the `teo` API (needs a fresh key and a test domain), hotel pack types, fact flow and BIZ items open |
| Weeks 3–13 | 1 | 45 | Content release pipeline v0 done early (week 4 item); the four gates open; Gate 1 on 12 October |
| **Total** | **22** | **58** | |

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
- [ ] **ENG** Customer 1 ingest and fact confirmation, by hand — tooling proven on customer zero (`src/ingest/import-facts.ts`)
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
- [ ] **XT** Booking-engine embed on the hotel's domain via the signed contract — adapter and same-domain booking step built early against the **clockPMS BE** mock ([contract](contracts/booking-engine-embed.md#interim-the-clockpms-be-mock))
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

## Metrics tracked from day one

| Metric | Target by day 90 | Current |
| --- | --- | --- |
| Human minutes per site per month | Known for all five customers | — |
| Ingest to live on own domain | Under one working day for customer 5 | — |
| Full-site generation | Under 5 minutes | — |
| Publish to live / rollback | Under 60 s / under 10 s | Content release: 14–27 ms / 16–18 ms (local); code deploy 171 s from CI |
| Isolation suite | Green on every commit and every Payload upgrade | 82/82 locally incl. facts, releases, booking; green in CI on every push |
| Service checks resolved without a human | Over half by week 12 | — |
