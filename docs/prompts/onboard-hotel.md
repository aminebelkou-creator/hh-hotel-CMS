# Onboard a new hotel

**For:** a coding agent in this repository. This is today's engineering flow (as done for customer zero, Hôtel de la Herse d'Or); Phase 3 automates the extraction and drafting with AI.

```text
Read docs/13-how-it-works.md, HANDOFF.md, CLAUDE.md and docs/08-ingest-spike.md first.

Onboard [Hôtel Example] ([https://www.example-hotel.com]) as a new tenant, following exactly
what was done for customer zero (src/onboarding/sites/hotel-herse-dor*.ts and
src/ingest/confirmations/hotel-herse-dor.json).

1. Crawl its public site into unconfirmed facts:
   pnpm exec tsx src/ingest/spike.ts [https://www.example-hotel.com] --max 60
2. Write src/ingest/confirmations/[example].json with the tenant, site and the decisions on
   each fact. Mark as confirmed only what the hotel's own site states; list the rest as open
   questions for the owner. Never invent a fact.
3. Write the site content in src/onboarding/sites/[example].ts, .pages.ts, .images.ts and
   .legal.ts: pages in French and English from the hotel's own texts (rewritten, not copied
   wholesale), room types, offers, house rules, FAQ, legal notice from the hotel's own legal
   notice, privacy and accessibility pages marked as drafts. Register it in apply.ts and
   import-images.ts.
4. Choose a template and brand (docs/prompts/brand-proposal.md) and set them on the site.
5. On the local 10-tenant database: import facts, import images, apply --publish, run the
   suites, take screenshots with tests/visual/screenshots.mjs, and review every page.
6. Create the owner account with src/onboarding/owner.ts (password from HH_OWNER_PASSWORD,
   generated on the PC, never shown).
7. Update the checklist, HANDOFF.md and docs/screenshots/, commit and push.

Stop and ask before: running anything against Neon (production), publishing, creating the
owner account in production, or using photos whose rights are unclear (rights must be
"owned" or "licensed").
```
