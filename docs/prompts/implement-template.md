# Implement a designer's template

**For:** a coding agent in this repository, once a designer has delivered a template (see [`../14-designer-brief.md`](../14-designer-brief.md) §4 for what they deliver). For a **licensed third-party template** (Luxorefi, Hotelza), the design session first makes a handoff folder in `Documents\hh-template-handoffs\<name>-lab` (NOTES, PROPOSAL, AGENT-PROMPT, CSS, preview with the exact markup, side-by-side shots); the agent follows that folder's AGENT-PROMPT instead. Worked example: Lumière 2.0, 25 Sep 2026.

```text
Read CLAUDE.md, docs/13-how-it-works.md and docs/11-design-contract.md first, and follow them.

Task: add a new site template called "[Riviera]" (id: [riviera]) from the designer's handoff in
docs/design-handoff/[riviera]/ (tokens JSON, annotated frames, notes).

Do:
1. Add the template to apps/platform/src/design/templates.ts: palette from the handoff tokens,
   fonts (from FONT_IDS, or add the new open-licence font to src/design/fonts/ with its
   licence and declare it in fonts.ts), corners, scheme, version 1.0.0, English and French
   descriptions.
2. Add a "Template: [Riviera]" section to apps/platform/src/app/(sites)/s/[site]/site.css using
   only [data-template='[riviera]'] selectors and --hh-* tokens. Do not change markup in
   src/site/ or packs/hotel/src/render/. No fixed colours except white/black over photos.
3. Create the migration for the new option (pnpm payload migrate:create), regenerate types and
   the import map, run tsc.
4. Run tests/int/design.int.spec.ts and the full local suites; add [riviera] to
   tests/visual/templates.mjs; take the screenshots; compare them with the handoff frames and
   list the differences you could not match and why.
5. Regenerate docs/design-tokens/ (src/design/export-tokens.ts); update
   docs/11-design-contract.md §6, docs/screenshots/README.md, docs/CHECKLIST.md and HANDOFF.md.

Before asking for a new block, check docs/11-design-contract.md §5: the hero stars and booking
bar, banners, photo band, checklist, feature icons, room tag/facts and section-head link already
exist (added for Lumière 2.0). Stop and ask if the design still needs markup changes, a block that
does not exist, or a font without an open licence.
```
