# hh-hotel-CMS

**Website-as-a-Service for independent hotels.** A multi-tenant platform that generates a hotel's direct-booking website from its own data, hosts it on managed EU infrastructure, and keeps it current on the hotel's behalf. Part of the **xedge** project.

> **Start here:** [`HANDOFF.md`](HANDOFF.md) for where things stand and what to do next · [`docs/CHECKLIST.md`](docs/CHECKLIST.md) for progress · [`docs/02-90-day-plan.md`](docs/02-90-day-plan.md) for the plan.

| | |
| --- | --- |
| **Status** | Pre-launch. Week-1 engineering finished early; the 90-day plan runs 28 September to 25 December 2026 |
| **Proof** | Tenant isolation 26/26 green on production infrastructure (EdgeOne Makers Frankfurt + Neon Postgres Frankfurt), including Postgres row-level security. Migrations at 50 tenants, single-tenant restore and the Payload upgrade path rehearsed |
| **Live proof of concept** | https://hh-platform-poc.edgeone.cool (test data only) |
| **Next gate** | Gate 1, week 3 (12 October): hosting provider confirmed, CMS frozen |
| **Owner** | Hotel Hersedor Paris / xedge |

---

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
- **Tenant isolation** has two layers. Payload access control through the multi-tenant plugin is the primary boundary. Postgres RLS underneath catches regressions.
- **Provenance**: every field records whether it was generated, edited by a human or locked. Regeneration and template upgrades do a three-way merge, so human edits are never silently overwritten.

## 6. What is built today

The proof-of-concept platform in `apps/platform` exists to prove the risky parts first: tenant isolation, hosting and data residency. There are no customer-facing features yet.

| Collection | Tenant-scoped | Purpose |
| --- | --- | --- |
| `users` | Membership list | Roles `super-admin` / `user`; roles can only be changed by a super-admin |
| `tenants` | — | One per hotel: name, slug, plan |
| `sites` | Yes | Enabled locales, default locale, theme tokens, status |
| `pages` | Yes | Drafts and versions; `hero` and `richText` blocks with a provenance group (generated, human or locked, plus the source fact); SEO group |
| `media` | Yes | Focal point, image sizes, alt text, usage rights |
| `domains` | Yes | Hostnames per site; only a super-admin can change them, and nobody can delete them |
| `releases` | Yes | Immutable release records; only a super-admin can change them, and nobody can delete them |

| Capability | State |
| --- | --- |
| Multi-tenant access control | Done. 13-case isolation matrix across read, write, move, join and self-promotion |
| `overrideAccess` audit | Done. Every use in `src/` must be allowlisted with a reason, or the test fails |
| REST and GraphQL isolation | Done. Tested against the live URL |
| Postgres RLS | Done as an evaluation: policies, restricted role, 9 tests. Not yet enforced for live requests |
| MCP server | Plugin enabled: pages (find, create, update), sites (find, update), media (find). No delete tools |
| Seed | 50 tenants, 51 users, 50 sites, 150 pages, 50 domains; idempotent |
| Migrations | Done. Baseline plus a first real migration, rehearsed at 10 and 50 tenants with per-tenant checksums (`scripts/migration-rehearsal.ps1`) |
| Single-tenant backup and restore | Done. Export plus a transactional restore of one hotel; the other 49 are proven untouched (`scripts/restore-rehearsal.ps1`) |
| Payload upgrades | Rehearsal script with a schema-drift check (`scripts/upgrade-rehearsal.ps1`). Upgrades are one-way |
| Deploy | EdgeOne Makers, Frankfurt cloud functions, 153 s end to end |
| Not started | Release pipeline, studio, generation, hotel pack, templates, media pipeline, domains automation |

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
│       ├── src/collections/   Users, Tenants, Sites, Pages, Media, Domains, Releases
│       ├── src/access/        access helpers + overrideAccess allowlist
│       ├── src/db/            RLS policies, apply/inspect scripts
│       ├── src/seed/          50-tenant seed, password rotation
│       ├── tests/int/         isolation, audit, REST/GraphQL, RLS suites
│       └── edgeone.json       Makers build and Frankfurt region
├── docs/
│   ├── 01-solution-definition.md   the spec (Hotelier Website Platform)
│   ├── 02-90-day-plan.md           the plan (baseline)
│   ├── CHECKLIST.md                progress against the plan
│   ├── 03-, 04-                    Webstudio and EdgeOne Makers evaluations
│   ├── 05-week1-spike-results.md   measured results
│   ├── contracts/                  cross-team contracts v0.1
│   └── outreach/                   vendor correspondence drafts
├── packages/                  shared core packages — not started
├── packs/                     vertical packs (hotel first) — not started
├── templates/                 versioned template packages — not started
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
pnpm seed                # 50 tenants, 51 users, 50 sites, 150 pages, 50 domains (~6 s locally)
pnpm dev                 # http://localhost:3000/admin — super@example.test / the seed password
```

Against a local database, Payload's schema push keeps tables in step with the collections automatically. Against any other database, push is off by design: schema changes go through migrations (see `HANDOFF.md`, next action 1).

## 10. Tests

| Suite | File | What it proves |
| --- | --- | --- |
| Isolation matrix | `tests/int/isolation.int.spec.ts` | 13 cases: a tenant user can reach only their own data via the Local API |
| `overrideAccess` audit | `tests/int/override-access.int.spec.ts` | No unlisted bypass of access control in `src/` |
| REST and GraphQL | `tests/int/rest-isolation.int.spec.ts` | The same boundary over HTTP; needs `PLATFORM_URL` |
| RLS, raw SQL | `tests/int/rls.int.spec.ts` | Postgres refuses cross-tenant read, update, delete and move |
| RLS under Payload | `tests/int/rls-payload.int.spec.ts` | With access control off, RLS alone keeps Payload's queries in-tenant |

```bash
pnpm test:isolation                                              # isolation + audit
pnpm exec vitest run --config ./vitest.config.mts tests/int      # everything (26 tests)
PLATFORM_URL=http://localhost:3000 pnpm exec vitest run --config ./vitest.config.mts tests/int/rest-isolation.int.spec.ts
```

Against Neon, first set `SEED_PASSWORD` to the rotated value. The tests refuse to start without it, because wrong-password logins lock the accounts.

## 11. Deploy (proof of concept)

```bash
cd apps/platform
edgeone makers link -n hh-platform-poc
edgeone makers env set DATABASE_URL "<neon url>" -e production   # secrets live in Makers, never in .env
edgeone makers env set PAYLOAD_SECRET "<random>" -e production
# move .env out of the folder first: the CLI uploads the whole directory
edgeone makers deploy . -n hh-platform-poc -e production --json --skip-ai-gateway-sync
```

`edgeone.json` pins cloud functions to `eu-frankfurt`. Build logs are not shown by the CLI; if a deploy fails, run `pnpm run build` locally.

## 12. Security and data protection

- Secrets never enter the repository or chat. They live in user environment variables and Makers project variables; `HANDOFF.md` lists the names and where each one is kept, never the values.
- Tenant isolation is a security-critical subsystem. Every PR that touches tenancy, access control or releases must extend the isolation suite, and the suite runs on every Payload upgrade.
- Payload security releases are applied within days. Payload is pinned, not floating.
- The data stays in the EU: functions and database are both in Frankfurt. The DPA and sub-processor list are week-1 deliverables.
- The public proof of concept holds test data only. Its seeded passwords have been rotated.

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

## 15. Documents

| Document | What it is |
| --- | --- |
| [`HANDOFF.md`](HANDOFF.md) | Current state, plan deltas, next actions, delta log |
| [`docs/CHECKLIST.md`](docs/CHECKLIST.md) | Living checklist: 90-day plan items, gates, open decisions, metrics |
| [`docs/01-solution-definition.md`](docs/01-solution-definition.md) | **Hotelier Website Platform — Solution Definition**: service model, capability map, domain model, architecture, decisions, risks |
| [`docs/02-90-day-plan.md`](docs/02-90-day-plan.md) | Week-by-week plan to the first paying hotels |
| [`docs/03-webstudio-evaluation.md`](docs/03-webstudio-evaluation.md) | Prior art: what to take, why not to adopt |
| [`docs/04-edgeone-makers-evaluation.md`](docs/04-edgeone-makers-evaluation.md) | Hosting: verified facts, quotas, residency, EdgeOne API |
| [`docs/05-week1-spike-results.md`](docs/05-week1-spike-results.md) | Measured results: isolation, deploys, Neon, RLS |
| [`docs/contracts/`](docs/contracts/) | Cross-team contracts: erasure and export, chatbot widget, booking-engine embed |
| [`docs/outreach/`](docs/outreach/) | Vendor correspondence, starting with the Tencent Makers email |
| [`CLAUDE.md`](CLAUDE.md) | Rules and gotchas for AI coding agents working in this repository |

The spec is edited as a Claude Docs artifact, *Hotelier Website Platform — Solution Definition*, and exported to `docs/01-solution-definition.md` after each change. The checklist and `HANDOFF.md` in this repository are the operational source of truth; the artifact is the design source of truth.

## 16. Contributing

Read [`CLAUDE.md`](CLAUDE.md) before writing code, whether you are a person or an agent. The rules that are hardest to undo:

1. No industry concept in the core. Hotel types live in `packs/hotel`.
2. One application, pooled tenancy, immutable releases. Never an instance per customer.
3. Tenant isolation in the data-access layer. Every `overrideAccess: true` is allowlisted and justified.
4. Nothing provider-specific in the application. Only the release pipeline talks to the host.
5. Payload upstream, unforked.
6. Every field carries provenance. Human edits are never silently overwritten.
