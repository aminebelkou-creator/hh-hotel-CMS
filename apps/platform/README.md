# apps/platform

The one application: Next.js + Payload on Postgres. Studio, renderer and control plane will all live here; today it holds the platform primitives and the tenant-isolation proof.

## Run locally

```bash
docker run -d --name hh-postgres -e POSTGRES_USER=hh -e POSTGRES_PASSWORD=hh_local_dev -e POSTGRES_DB=hh_platform -p 5432:5432 -v hh-postgres-data:/var/lib/postgresql/data postgres:16-alpine
pnpm install            # from the repository root
pnpm --filter platform seed
pnpm --filter platform test:int
pnpm --filter platform dev   # http://localhost:3000/admin
```

Seeded logins: `super@example.test` (super-admin) and `user-01@example.test` … `user-50@example.test`, password `Passw0rd!seed`. Local only.

## What is enforced, and where

| Rule | Mechanism | Test |
| --- | --- | --- |
| A tenant user reads, writes and deletes only their tenant's documents | `@payloadcms/plugin-multi-tenant` wraps access on sites, pages, media, domains, releases | `tests/int/isolation.int.spec.ts` |
| A user cannot join another tenant | field-level access on the users `tenants` array: super-admin only | same |
| A user cannot promote themselves | field-level access on `roles`: super-admin only | same |
| Releases are immutable | collection access: update super-admin only, delete never | — |
| Every `overrideAccess: true` is justified | `src/access/override-access.allowlist.json` | `tests/int/override-access.int.spec.ts` |
| Isolation holds over REST and GraphQL | same server, JWT per tenant | `tests/int/rest-isolation.int.spec.ts` (needs `pnpm dev` running) |

Postgres row-level security is evaluated in the proof of concept, not enabled by default; see the solution definition.

## MCP

The MCP plugin exposes `pages` (find, create, update), `sites` (find, update) and `media` (find) at `/api/mcp`, scoped per API key. Create keys under **MCP → API Keys** in the admin. Deletes are never exposed.
