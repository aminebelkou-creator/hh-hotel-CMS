# Week-1 spike results — 23 September 2026

## Isolation proof of concept

| Item | Result |
| --- | --- |
| Stack | Next.js 16.3.3, Payload 3.90.1, Postgres 16 (Docker), `@payloadcms/plugin-multi-tenant`, `@payloadcms/plugin-mcp` |
| Seed | 50 tenants, 51 users, 50 sites, 150 pages, 50 domains in 6.3 s |
| Local API isolation matrix | 13/13 green: read, find-by-where, create, update, delete, move-to-other-tenant, join-other-tenant, self-promotion, tenant list, sites/domains/releases, 10 random pairs both directions |
| overrideAccess audit | Green; caught an unlisted debug file on first run, which is the point |
| REST + GraphQL isolation | 2/2 green against a live server |
| **Total** | **17/17** |

Not yet covered: Postgres RLS as defence in depth, admin-UI tenant selector behaviour, bulk operations, imports, jobs, backup/restore of a single tenant, schema migration at 50 tenants, a Payload upgrade. These are the rest of the proof.

## Makers deploy

| Measure | Value |
| --- | --- |
| Static hello-world, first deploy | 49.6 s end to end |
| Static re-publish | 37.7 s |
| Next.js + Payload app, end to end | **154 s** (upload ~40 s, remote build ~110 s) |
| Local production build for comparison | ~16 s warm |
| Result | Build and deploy succeed; runtime returns 500 on every route because `DATABASE_URL` points at localhost |

The CLI uploads the project folder and builds remotely. Build logs are not available from the CLI; a failed build shows only "Deployment failed". Reproducing locally with `pnpm run build` found the cause in minutes.

## Findings

1. **Field named `locales` breaks Payload on Postgres.** A `hasMany` select called `locales` creates `sites_locales`, which collides with the table Payload uses for localised fields. Renamed `enabledLocales`. Worth a lint rule.
2. **The MCP plugin adds an auth collection**, so `req.user` can be an API key without `email`. Any code reading user fields must narrow the type first.
3. **Vitest injects `BASE_URL="/"`**, shadowing any variable of that name. Use `PLATFORM_URL`.
4. **Turbopack in a pnpm monorepo** needs `turbopack.root` at the repository root, not the app.
5. **UTF-8 BOMs** written by Windows PowerShell break `tsx`'s package.json parser. Write files as UTF-8 without BOM.
6. **The deploy uploads the whole app folder, including `.env`.** Production must use Makers environment variables and must not ship `.env`; confirm an ignore mechanism before any real secret exists.
7. **Publish-to-live of 154 s misses the 60 s target** in the plan. Remote build dominates. Options: build in CI and upload the artifact, trim the server bundle, or accept that the 60 s target applies to content releases, not code deploys. Decide before Gate 2.

## Running on Makers against Neon Frankfurt — done

| Measure | Value |
| --- | --- |
| Database | Neon free tier, pooled endpoint, `eu-central-1` (Frankfurt) |
| Configuration | `DATABASE_URL` and a fresh `PAYLOAD_SECRET` set as Makers project environment variables (production and preview); `.env` excluded from the upload |
| Seed over the network | 257 s (6.3 s against local Postgres): per-row round trips dominate |
| Deploy end to end | 153 s |
| Live responses, cold | `/` 1.9 s, `/admin` 0.96 s, `/api/users/me` 0.71 s, login 0.58 s |
| Tenant 1 via live API | sees exactly its 3 pages |
| REST + GraphQL isolation against the live URL | **2/2 green** |
| Local API isolation + overrideAccess audit against Neon | **15/15 green** (54 s over the network) |
| **Total on production infrastructure** | **17/17** |

The platform runs end to end on EdgeOne Makers with EU data: Frankfurt cloud functions, Frankfurt Postgres.

Consequences to carry forward: the 257 s seed shows that bulk operations (imports, migrations, generation writes) must be batched or run close to the database, never row-by-row across regions. Latencies above are single cold requests from Paris, not a benchmark.
