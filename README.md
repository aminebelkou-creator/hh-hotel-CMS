# hh-hotel-CMS

**Website-as-a-Service for hotels.** A multi-tenant platform that generates, hosts and continuously operates an independent hotel's direct-booking website. Part of the xedge project.

The customer does not buy a website project; they subscribe to a website that is built by an agent from their own data, hosted on managed infrastructure, and kept current on their behalf.

| | |
| --- | --- |
| Status | Week 1 of the 90-day plan. Isolation proof of concept live on production infrastructure, 17/17 tests green. |
| Launch segment | Hotels first; the core stays industry-neutral and hotels are the first vertical pack |
| Live proof of concept | https://hh-platform-poc.edgeone.cool (test data only) |
| Checklist | [`docs/CHECKLIST.md`](docs/CHECKLIST.md) |
| Spec | [`docs/01-solution-definition.md`](docs/01-solution-definition.md) |

## What it is

- A managed service delivered by software: the subscription buys an operated website, not a tool
- Generation-first: an agent builds the site from the hotel's existing site, profile and PMS data; people refine it in a structured block studio
- Continuously managed: freshness, SEO, structured data, performance, accessibility and consent are monitored and fixed by a service loop, and the customer gets a monthly report
- Agent-native: bring your own model, MCP in and out, approvals and audit on every agent action
- Compliance as product: WCAG 2.2 AA / EN 301 549, RGPD consent and data residency, EU AI Act disclosure

## Decisions already taken

| Area | Decision |
| --- | --- |
| Tenancy | Pooled: one application, one Postgres, tenant boundary enforced in the data-access layer. Never an instance per customer |
| Delivery | Each published site is an immutable release artifact at the edge. "Independent deployment" means independent artifacts, not independent applications |
| CMS | Payload on Postgres, upstream and unforked, with the official multi-tenant and MCP plugins |
| Studio | Structured blocks, no pixel canvas. Puck by default |
| Hosting | EdgeOne Makers (Frankfurt) behind a week-one gate; Cloudflare EU pre-wired as fallback |
| Database | Postgres in the EU. Neon Frankfurt for the proof of concept |
| Core model | No industry concept in the core. Room, Offer, Amenity live in `packs/hotel` |
| Clients differ by | Data, configuration, templates and feature flags. Never application code |

Full reasoning, alternatives rejected, and risks: [`docs/01-solution-definition.md`](docs/01-solution-definition.md).

## Architecture in one picture

```
 Studio ─┐                                    ┌─ Edge renderer + CDN ── visitors
 Agent  ─┼─ Content API ── Postgres ── Release pipeline ── immutable releases
 MCP    ─┘   (Payload,      (Neon,       (build, deploy,   (one per site,
              tenant-scoped) Frankfurt)   rollback)          instant rollback)
```

The control plane (authoring) and data plane (serving) fail independently: a studio outage never takes a customer's site offline.

## Repository layout

```
apps/platform/    Next.js 16 + Payload 3.90 on Postgres: collections, tenancy, MCP, seed, isolation tests
docs/             spec, plan, checklist, evaluations, contracts, spike results
packages/         shared code (content model, tokens, components, release pipeline) — not started
packs/            vertical packs; hotel first — not started
templates/        versioned template packages — not started
scripts/          setup scripts
.claude/skills/   EdgeOne Makers skills for AI coding agents
CLAUDE.md         rules every AI coding agent in this repo must follow
```

## Run it locally

Requires Node 22+, pnpm, Docker.

```bash
docker run -d --name hh-postgres -e POSTGRES_USER=hh -e POSTGRES_PASSWORD=hh_local_dev \
  -e POSTGRES_DB=hh_platform -p 5432:5432 -v hh-postgres-data:/var/lib/postgresql/data postgres:16-alpine
pnpm install
cd apps/platform
cp .env.example .env          # DATABASE_URL=postgres://hh:hh_local_dev@localhost:5432/hh_platform, PAYLOAD_SECRET=<random>
pnpm seed                     # 50 tenants, 51 users, 50 sites, 150 pages, 50 domains
pnpm test:isolation           # Local API isolation matrix + overrideAccess audit
pnpm dev                      # http://localhost:3000/admin
pnpm exec vitest run --config ./vitest.config.mts tests/int/rest-isolation.int.spec.ts   # REST/GraphQL, needs dev server
```

## Deploy (proof of concept)

```bash
cd apps/platform
edgeone makers link -n hh-platform-poc
edgeone makers env set DATABASE_URL "<neon url>" -e production     # secrets live in Makers, never in .env
edgeone makers env set PAYLOAD_SECRET "<random>" -e production
# move .env out of the folder before deploying: the CLI uploads the whole directory
edgeone makers deploy . -n hh-platform-poc -e production --json --skip-ai-gateway-sync
```

## Documents

| Document | What it is |
| --- | --- |
| [`docs/CHECKLIST.md`](docs/CHECKLIST.md) | Living checklist: 90-day plan, gates, open decisions, owner actions |
| [`docs/01-solution-definition.md`](docs/01-solution-definition.md) | The spec: service model, capability map, domain model, architecture, decisions, risks, metrics |
| [`docs/02-90-day-plan.md`](docs/02-90-day-plan.md) | Week-by-week plan to first paying hotels |
| [`docs/03-webstudio-evaluation.md`](docs/03-webstudio-evaluation.md) | Prior art: what to take, why not to adopt |
| [`docs/04-edgeone-makers-evaluation.md`](docs/04-edgeone-makers-evaluation.md) | Hosting: verified facts, quotas, residency, gate criteria, EdgeOne API |
| [`docs/05-week1-spike-results.md`](docs/05-week1-spike-results.md) | Measured results of the isolation proof and the Makers deploys |
| [`docs/contracts/`](docs/contracts/) | Cross-team contracts: erasure/export, chatbot widget, booking-engine embed |

The living versions of the spec, plan and evaluations are in the Claude Docs artifact "Agentic Website Platform — Solution Definition". The repository copies are exports; when they diverge, the checklist in this repository is the operational source of truth and the artifact is the design source of truth.
