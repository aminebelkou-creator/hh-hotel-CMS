# System design, illustrated

How the Hotelier Website Platform fits together, as of 23 September 2026. Diagrams are Mermaid, so GitHub renders them and they are edited as text. Solid lines exist today; dotted lines are designed but not built. The spec is [`01-solution-definition.md`](01-solution-definition.md).

## 1. Context: who and what the platform talks to

```mermaid
flowchart LR
  H([Hotelier]) -->|edits, approves| P
  G([Hotel guests]) -->|browse, book| E
  A([Customer AI agents]) -->|MCP| P
  subgraph X [xedge]
    PMS[PMS]
    BE[Booking engine<br/>mock: clockPMS BE]
    CRM[CRM + chatbot]
  end
  P[Hotelier Website Platform] -->|release| E[Edge / CDN<br/>EdgeOne Makers]
  PMS -. read-only projection .-> P
  BE -->|rates, deep links| P
  CRM -. widget boundary .-> E
  W[Hotel's current website] -->|ingest| P
```

The platform masters **content and releases only**. Inventory, rates, bookings and guest data stay in the other xedge systems and arrive as projections or embeds, under signed [contracts](contracts/).

## 2. Containers: what runs where

```mermaid
flowchart TB
  subgraph EDGE [EdgeOne Makers · Frankfurt functions]
    APP[Next.js 16 + Payload 3<br/>admin, REST, GraphQL, MCP]
    R[Site renderer<br/>per-hotel releases]
  end
  subgraph DATA [Neon Postgres · Frankfurt]
    DB[(Content, tenants, facts,<br/>releases, jobs)]
    RLS{{Row-level security}}
  end
  subgraph CI [GitHub Actions]
    T[ci: isolation suite on<br/>throwaway Postgres]
    D[deploy: migrate, RLS, publish]
  end
  APP --> DB
  R --> DB
  DB --- RLS
  D -->|migrations| DB
  D -->|artifact| EDGE
  T -. gate .-> D
```

Code, database and functions all sit in the EU (Frankfurt). The application never talks to the host directly; only the `deploy` workflow and the release pipeline do (CLAUDE.md rule 5).

## 3. Tenant isolation: three layers, each tested

```mermaid
flowchart TB
  Q[Request from user A<br/>REST, GraphQL, admin, MCP, Local API] --> L1
  J[Background job<br/>no user] --> L2
  L1[Layer 1 · Payload access control<br/>multi-tenant plugin, field rules] --> DBQ
  L2[Layer 2 · Explicit tenant in job input<br/>every query filters on it] --> DBQ
  DBQ[SQL query] --> L3[Layer 3 · Postgres RLS<br/>restricted role + tenant context]
  L3 --> T[(Only tenant A rows)]
  AUD[[overrideAccess audit<br/>fails CI on any unlisted bypass]] -. guards .-> L1
```

| Layer | Proven by | Status |
| --- | --- | --- |
| Access control | `isolation.int.spec.ts` (13), `isolation-extended` (bulk, imports), `rest-isolation` (REST, GraphQL, forged tenant cookie) | Enforced |
| Job tenancy | `isolation-extended` (jobs) | Enforced by pattern (`src/jobs/`) |
| RLS | `rls.int.spec.ts`, `rls-payload.int.spec.ts` (Payload queries held by RLS alone) | Evaluated; enforcing mode due in week 4 |

## 4. From an existing hotel website to a live site

```mermaid
flowchart LR
  S[Hotel website<br/>+ Google profile] -->|ingest spike| F[Facts<br/>unconfirmed]
  PMSx[PMS projection] -. .-> F
  F -->|hotel confirms,<br/>conflicts resolved| FC[Confirmed facts]
  FC -->|generation<br/>AI key pending| C[Draft content<br/>provenance: generated]
  C -->|studio edits| C2[Content<br/>provenance: human]
  C2 -->|publish| REL[Immutable release]
  REL --> LIVE[Live site]
  REL -. rollback = pointer move .-> LIVE
```

Nothing is generated from an unconfirmed fact, and only confirmed facts enter a release (built 23 September; generation waits for the AI model key). On customer zero the ingest found two conflicting check-out times and two phone numbers. The hotel settled them on 23 September: check-out is 11:00, and both numbers are current. See [`08-ingest-spike.md`](08-ingest-spike.md).

## 5. Releases: serialised, verified, reversible

```mermaid
sequenceDiagram
  participant U as Hotelier / agent
  participant P as Payload
  participant Q as Publish job (per-site lock)
  participant S as Release store
  participant L as Live site
  U->>P: Publish site
  P->>Q: queue publish(tenant, site)
  Q->>Q: take lock, drop superseded requests
  Q->>S: snapshot pages → immutable release + checksum
  Q->>P: site.currentRelease = new release
  Q->>L: fetch page, check x-release
  alt verified
    Q->>P: release status = live
  else mismatch
    Q->>P: currentRelease = previous (rollback)
  end
```

Built as v0 on 23 September: a lease lock on the site row, a request sequence for superseding, and a stored snapshot served by `/s/<site>`. Why the lock matters: Makers queues concurrent deploys and **the last to finish goes live**, even if it is older (finding 17). The platform therefore serialises publishes itself. Design note: [`06-release-pipeline-design.md`](06-release-pipeline-design.md).

## 6. Schema change and code release

```mermaid
flowchart LR
  DEV[Change a collection] --> MC[payload migrate:create]
  MC --> RH[Rehearsal: 10 then 50 tenants,<br/>per-tenant checksums]
  RH --> PR[Pull request]
  PR --> CI[ci: fresh DB from migrations,<br/>drift check, 34 tests, build]
  CI --> DEP[deploy: migrate Neon,<br/>re-apply RLS, publish 171 s]
  DEP --> LIVE2[Live]
```

Rules learned the hard way: push is off for shared databases (it deleted the RLS policies), and Payload upgrades are one-way (the password-hash format changed in 3.90). Every Payload upgrade runs `scripts/upgrade-rehearsal.ps1`.

## 7. Where each concern lives in the repository

| Concern | Path |
| --- | --- |
| Collections (core) | `apps/platform/src/collections/` |
| Access rules and overrideAccess allowlist | `apps/platform/src/access/` |
| Background jobs (tenant in input) | `apps/platform/src/jobs/` |
| Database tools: RLS, fingerprint, checksums, backup/restore | `apps/platform/src/db/` |
| Migrations | `apps/platform/src/migrations/` |
| Ingest | `apps/platform/src/ingest/` |
| Host adapter (EdgeOne) | `apps/platform/src/host/` |
| Booking-engine adapter (mock clockPMS BE) | `apps/platform/src/booking/` |
| Release pipeline: publish, rollback, snapshot, checksum | `apps/platform/src/releases/` |
| Public renderer and booking step | `apps/platform/src/app/(sites)/s/[site]/` |
| Fact base: normaliser, import, owner decisions | `apps/platform/src/ingest/`, `src/collections/Facts.ts` |
| Hotel pack (types, blocks, schema.org) | `packs/hotel/`, planned |
| Rehearsal and deploy scripts | `scripts/` |
| CI and deploy | `.github/workflows/` |
