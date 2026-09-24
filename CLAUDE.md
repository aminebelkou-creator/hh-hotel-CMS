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
16. **Deploy with `scripts/deploy-poc.ps1`, never a bare `edgeone makers deploy`**: it holds `.env` out and removes `.next` first. A 320 MB `.next` made a deploy time out after 14 minutes.
17. **Background jobs run without a user.** Carry the tenant in the job input and filter every query on it (`src/jobs/touchPageSeo.ts`); each new task is a migration (Payload stores task slugs as an enum).
18. **Releases are made only by `src/releases/publish.ts`.** Never create a `releases` row or set `sites.currentRelease` any other way: tenant users cannot (field and collection access), and the pipeline's lock, request sequence and verification are what keep an older publish from going live (finding 17).
19. **Nothing unconfirmed reaches a guest.** The renderer reads only the release snapshot, and snapshots hold only published pages and `confirmed` facts. New public features must read from the snapshot, never from live collections.
20. **Payload's `locale: 'all'` returns localized fields as `{ en, fr }` objects**, including fields inside blocks; render them with `pick()` from `src/releases/snapshot.ts`. A required localized field must be set in each locale before a page validates in that locale.
21. **Public routes live under `src/app/(sites)/s/[site]/`** (a root layout per site). Next.js page files may only export page things (`default`, `generateMetadata`, `dynamic`…); put helpers in `src/site`. The public site has **no booking logic** (owner's decision, 24 Sep): the "Book" button is a link; `src/booking/` is parked.
22. **A `next dev` started this morning may still be listening on port 3000 against `hh_platform`** with schema push on. Run test servers on another port (3100) and never point tests at it.
23. **Hotel concepts live in `packs/hotel`** (`@hh/pack-hotel`), loaded only through `src/packs.ts`. Core collections and blocks stay industry-neutral; a pack adds collections, blocks, a snapshot contribution and renderers. Pack files are covered by the `overrideAccess` audit.
24. **After adding or changing admin components or plugins, run `pnpm payload generate:importmap` and commit it.** A stale import map renders the whole admin as a blank page with no error in the browser (it happened on 24 Sep). CI checks it.
25. **`migrate:create` prompts when a change both drops and adds** (it asks whether an enum or column was renamed) and hangs in a non-interactive shell. Split such a change into two migrations: additions first, then removals.
26. **Makers installs and builds only `apps/platform`**, so workspace packs are vendored at deploy time (`scripts/vendor-packs.mjs`, called by the deploy workflow and `deploy-poc.ps1`). Never commit `apps/platform/vendor/` or the rewritten `package.json`.
27. **Photos are stored in Postgres for now** (`media_blobs`, adapter `src/media/postgres-storage.ts`, public route `/media/<key>`): serverless functions have no durable disk. Blob keys are global, so every upload gets a random filename prefix (Payload's duplicate-name check only sees the uploader's tenant). Keep the adapter interface when moving to object storage; never serve `media_blobs` rows other than by exact key.
28. **Preview is for signed-in users only** (`/preview/pages/<id>`): it reads the draft with the user's own access (`overrideAccess: false`), so another tenant's page is a 404. Page slugs that collide with routes (`preview`, `api`, `admin`, locale codes, `sitemap.xml`, `robots.txt`) are refused at validation.
29. **Owner accounts are created with `src/onboarding/owner.ts`** (owner role, one tenant, password from the `HH_OWNER_PASSWORD` environment variable). Never put a password on a command line, in the repo or in chat.
30. **Makers projects must be created with `--area overseas`** ("Global, Chinese mainland excluded"). The CLI default `global` includes mainland China, which needs an ICP filing, and custom domains stay disabled without it (finding 22). Cloud functions also cap requests at 6 MB and 120 s (Node 20), so photo uploads must stay under 6 MB.
31. **`edgeone makers link` overwrites `apps/platform/.env` with the project's production variables** (Neon URL included). After linking, put back a local `.env` pointing at localhost before running any script that relies on `.env`.
