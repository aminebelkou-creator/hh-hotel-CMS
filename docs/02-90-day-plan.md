# 90-day plan

Day 90 ends with three to five hotels paying for sites live on their own domains, served by the minimal pooled platform, with the isolation proof passed, the hosting gate settled, and human minutes per site measured for every one of them. Starts Monday 28 September 2026; ends Friday 25 December 2026.

**Assumptions** — adjust the plan if these are wrong: a core team of four to six engineers with Next.js and Postgres experience, one product or design lead, one person from xedge who can sell to hotels and one who can support them. Payload, Puck and object storage are used as they ship; nothing is forked. Other xedge teams provide read access to PMS data for the design partners by week four.

## Principles for the 90 days

1. Customers before platform. The first three hotels are served by scripts and people; the platform is built from what that teaches.
2. Every gate has written pass criteria and a pre-wired fallback, so a failure costs a week, not a quarter.
3. Nothing provider-specific in the application. The release pipeline talks to the host; nothing else does.
4. Measure human minutes per site from customer one. It is the number the business runs on.
5. No hotel concept enters the core. The hotel pack is content types, templates, connectors and agent tools.

## Workstreams

| Workstream | Owns | Done at day 90 when |
| --- | --- | --- |
| A. Proof and infrastructure | Isolation proof, hosting gate, release pipeline, domains, media | Fifty-tenant proof green; publish-to-live under 60 s; rollback under 10 s |
| B. Content core | Payload collections, tenancy, provenance, hotel pack types, MCP | Canonical model and hotel pack in production; MCP server per tenant scoped and audited |
| C. Generation and studio | Ingest, fact base, generation, translation, Puck block studio | A hotel site generated from URL plus PMS record in under 5 minutes; content editable on a phone |
| D. Customers | Design partners, concierge onboarding, service delivery, reports | Three to five hotels live and paying; first monthly service report sent |
| E. Commercial and compliance | Tiers, pricing, DPA, consent, accessibility statement, AI disclosure, cross-team contracts | Tiers priced and signed by real customers; every live site conformant and consented |

## Week by week

| Week | Dates | A. Proof and infra | B. Content core | C. Generation and studio | D. Customers | E. Commercial and compliance |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 28 Sep | Isolation proof begins on Payload + Postgres; Makers gate begins: obtain platform API docs, exercise create/deploy/domain from code | Collection design on paper: platform primitives, provenance, locale | Ingest spike: scrape a hotel site and GBP into the fact base | Shortlist 15 hotels; first conversations | Draft the DPA and sub-processor list; open cross-team contract drafts |
| 2 | 5 Oct | Proof: fifty tenants, isolation matrix across all paths; Makers: quotas and pricing in writing, Frankfurt pinning, fifty domains | Hotel pack types on paper: Room, Offer, Amenity, Outlet, Policy, LocalGuide | Fact confirmation flow; generation of a full draft site as JSON entries | Five hotels in serious talks; concierge offer written | Service tiers drafted; accessibility target set per template |
| 3 | 12 Oct | **Gate 1**: Makers pass or fallback to Cloudflare EU; proof results; CMS frozen | Repository and monorepo structure; Payload with multi-tenant and MCP plugins running | Translation step for two locales | **Three design partners signed** | Consent management chosen and configured |
| 4 | 19 Oct | Release pipeline v0: build, immutable artifact, deploy, domain bind, rollback | Canonical content model live; RLS evaluated per the proof | Two template packages, accessibility- and CWV-gated in CI | Customer 1 ingest and fact confirmation, by hand | **Cross-team contracts signed**: erasure, chatbot boundary, booking embed; tiers priced |
| 5 | 26 Oct | Media pipeline: object storage plus on-the-fly derivatives; domain and certificate flow | Hotel pack types implemented as a pack, no core change | Generation pipeline v0 end to end, run by engineers | Customer 1 draft site reviewed with the hotel | Accessibility statement generator; AI disclosure component |
| 6 | 2 Nov | **Gate 2**: foundations review — publish under 60 s, rollback under 10 s, fifty domains served | Provenance on every field; patch log | Puck studio v0 on Payload blocks, desktop | **Customer 1 live on own domain** | First invoice issued by hand |
| 7 | 9 Nov | Structured data validation and CWV check on every publish | MCP server per tenant with scoped keys; audit of overrideAccess | Mobile content editing; version history and rollback in the studio | Customer 2 and 3 ingested; human minutes logged per task | DPA signed by customers 1–3 |
| 8 | 16 Nov | Broken-link, stale-offer and accessibility scans as scheduled jobs | Export that round-trips a tenant | Regeneration with three-way merge tested against human edits | Customers 2 and 3 live | Pricing validated against what the three actually pay |
| 9 | 23 Nov | **Gate 3**: three customers live; service checks running unattended | Inventory projection from PMS for design partners, read-only | Scheduled content proposals with one-tap approval | Customers 4 and 5 recruited; onboarding time targeted under one day | Service catalogue finalised from what customers asked for |
| 10 | 30 Nov | Release canary: template upgrade to one tenant, then all | Booking-engine embed on the hotel's domain via the signed contract | Agent drafts local-guide pages for customers 1–3 | Customers 4 and 5 ingested | Monthly service report v0 designed |
| 11 | 7 Dec | Per-tenant health view, internal | Chatbot widget rendered per the boundary, with disclosure and consent gating | Studio hardening from customer feedback | Customers 4 and 5 live; first month's human minutes analysed | First monthly service report sent to customers 1–3 |
| 12 | 14 Dec | Backup and single-tenant restore rehearsed | Hotel pack v1 tagged; upgrade path tested | Generation quality review against the fact base | Renewal conversations; references requested | Tiers, DPA and catalogue finalised as templates |
| 13 | 21 Dec | **Gate 4**: go or no-go on the build phase | — | — | Retrospective with all five hotels | 12-month roadmap drafted from the evidence |

## Gates

| Gate | Week | Pass condition | If it fails |
| --- | --- | --- | --- |
| 1. Hosting and CMS | 3 | Every must-pass item in *Hosting provider decision* evidenced; isolation proof green | Execute Cloudflare EU fallback that week; CMS frozen regardless |
| 2. Foundations | 6 | Publish-to-live under 60 s, rollback under 10 s, fifty domains served, CI gates blocking | Slip customers 2–3 by a week; do not skip |
| 3. Service | 9 | Three customers live; scheduled checks running without a human | Add a week of hardening before customers 4–5 |
| 4. Build phase | 13 | Five paying customers; human minutes per site per month known; NRR conversation started | Extend the concierge phase; do not start the build phase on hope |

## Measured from day one

| Metric | Target by day 90 |
| --- | --- |
| Human minutes per site per month | Known for all five; trend down from customer 1 to 5 |
| Time from ingest to live on own domain | Under one working day for customer 5 |
| Full-site generation time | Under 5 minutes |
| Publish to live, rollback | Under 60 s, under 10 s |
| Isolation suite | Green on every commit and every Payload upgrade |
| Service checks resolved without a human | Over half by week 12 |
| Service report open rate | All five customers open the first report |

## Explicitly not in the 90 days

Self-serve signup, billing automation, the control-plane dashboard, the autonomous service loop at fleet scale, agency workspaces, multi-property, a second hosting adapter, and any vertical other than hotels. Each is on the 12-month roadmap the week-13 retrospective produces.

## Risks specific to these 90 days

| Risk | Mitigation |
| --- | --- |
| Makers gate stalls on access to enterprise documentation or a sales process | Start the request on day one; the fallback is pre-wired and costs the same week either way |
| Design partners sign late | Recruit fifteen to sign three; offer the concierge phase free in exchange for reference rights and the migration risk borne by the platform |
| Engineers build platform instead of serving customers | Weeks 4–8 have named customers with named deliverables; platform work that does not unblock a customer waits |
| PMS data access slips from the other xedge team | The generation pipeline runs from public sources first; PMS grounding is added when access lands |
| Generation quality embarrasses a customer | The fact-confirmation step is mandatory; nothing publishes without the hotel approving the fact base |
