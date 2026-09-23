# Instructions for AI coding agents

This repository builds a Website-as-a-Service platform for hotels. Read `docs/01-solution-definition.md` before proposing architecture. The decisions there are settled; argue with them in a PR description, not by silently diverging.

## Rules that are not negotiable

1. **No industry concept in the core.** Room, Offer, Amenity live in `packs/hotel`, never in `packages/` or `apps/`. If building the hotel pack needs a core change, the extension point is wrong: fix the extension point.
2. **Structured blocks, no pixel canvas.** Layout comes from responsive primitives; users control content, order and theme tokens.
3. **One application, pooled tenancy, immutable releases.** Never an instance per customer. What is deployed per site is a release artifact, not an application.
4. **Tenant isolation is enforced in the data-access layer** (Payload access control via the multi-tenant plugin, with Postgres RLS evaluated as defence in depth), never by a filter the calling code remembers to add. Every use of `overrideAccess: true` is enumerated and justified in `docs/`.
5. **Nothing provider-specific in the application.** Only the release pipeline talks to the host, through one thin adapter.
6. **Payload upstream, unforked.** Configuration, official plugins, our plugins, our collections. Postgres only. Apply Payload security releases within days.
7. **Every field carries provenance**: generated, human-edited, or locked. Regeneration and template upgrades do a three-way merge; human edits are never silently overwritten.
8. **Accessibility in components, contrast at token level.** WCAG 2.2 AA is a CI gate, not an audit.
9. **Generated content is grounded.** No claim about a customer's business without a fact in the fact base.
10. **Agents write through the same API as humans**, with approval by policy, audit and revert.

## Stack

TypeScript everywhere. Next.js, Payload CMS, Postgres, Puck for the block studio, pnpm workspaces, OpenAPI 3.1 for contracts, OpenTelemetry for traces. EdgeOne Makers is the assumed host (see `docs/04-edgeone-makers-evaluation.md`); do not assume it in application code.

## Skills

EdgeOne Makers skills are installed under `.claude/skills/` by `scripts/setup.*` (`npx skills add TencentEdgeOne/edgeone-makers-tools`). Use `makers-deploy`, `makers-cli` and `makers-middleware` for anything touching the host; use `makers-cloud-functions` and `makers-edge-functions` only inside the release pipeline and edge layer.

## Commit conventions

Conventional commits. Small PRs. Every PR that touches tenancy, access control or the release pipeline must add or extend the isolation test suite.

## Working agreements

- **Start every session by reading `HANDOFF.md`; end it by updating it**: rewrite *Current state*, update *Plan deltas*, and prepend a *Delta log* entry (changed, learned, left undone, commit range). Never edit old delta entries.
- **Update `docs/CHECKLIST.md` in the same commit** that completes an item, with a link to the evidence (file, test, or results doc). Measured numbers go in `docs/05-week1-spike-results.md` or a successor results doc.
- The spec in `docs/01-solution-definition.md` is an export of the Claude Docs artifact. Propose spec changes in a PR description; do not silently rewrite it.

## Known gotchas (learned the hard way)

1. **Never name a Payload field `locales`** (or anything ending up as `<collection>_locales`). On Postgres it collides with the table Payload creates for localised fields and breaks queries with `Cannot read properties of undefined (reading 'referencedTable')`.
2. **The MCP plugin adds an API-key auth collection.** `req.user` may be an API key with no `email`; narrow the type before reading user fields.
3. **Vitest injects `BASE_URL="/"`.** Use `PLATFORM_URL` for the server under test.
4. **Turbopack in this pnpm monorepo** needs `turbopack.root` at the repository root (`next.config.ts`), or it cannot find `next`.
5. **Write files as UTF-8 without BOM.** Windows PowerShell 5 `Set-Content -Encoding utf8` adds a BOM, which breaks `tsx`'s package.json parser. Use `[IO.File]::WriteAllText($p, $t, (New-Object System.Text.UTF8Encoding($false)))`.
6. **`edgeone makers deploy` uploads the whole folder, including `.env`.** Move `.env` out before deploying; production secrets live in `edgeone makers env set`.
7. **The Makers CLI shows no build log on failure.** Reproduce with `pnpm run build` locally first.
8. **Never stop processes by name** (`Stop-Process -Name node`, `pkill node`). Agents and tooling on the developer machine run on Node. Stop by exact PID only.
9. **Bulk writes across regions are slow** (seed: 6 s local, 257 s to Neon Frankfurt). Batch them or run them close to the database.
10. **Payload's dev schema push drops what it doesn't manage**, including RLS policies. Push is enabled only for a localhost `DATABASE_URL`; shared databases change through migrations, and RLS is (re)applied after them (`src/db/apply-rls.ts`).
11. **RLS does nothing under the owner role.** Neon's `neondb_owner` has BYPASSRLS; Docker `postgres` is superuser. Policies bind only the restricted role `hh_app_rls` (via `SET LOCAL ROLE`).
12. **Set `SEED_PASSWORD` before running tests against any database** (value in user env var `HH_NEON_SEED_PASSWORD`; local and Neon share it). Wrong-password logins trip Payload's lockout; `rotate-passwords.ts` clears it.
13. **Schema changes are migrations**: `pnpm payload migrate:create <name>`, rehearse with `scripts/migration-rehearsal.ps1`, then `payload migrate` on Neon. Backfills are set-based SQL, never row-by-row over the network.
14. **Never downgrade Payload.** 3.90 changed the password-hash format and older versions lock users out. Every upgrade runs `scripts/upgrade-rehearsal.ps1` and ships the migration its drift check reveals.
15. **pnpm is a PowerShell shim on Windows**: pass file lists to it by splatting (`@files`), or they arrive as one argument.
