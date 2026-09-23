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
