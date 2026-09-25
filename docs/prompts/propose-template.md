# Propose a new template (no designer)

**For:** an AI design assistant (for example Claude in a chat). The result is a proposal to review; building it is [implement-template.md](implement-template.md).

```text
Design a website template for [small independent hotels by the sea: family-run, 15-40 rooms,
Mediterranean coast]. It will be used by many hotels, each with its own photos and texts, in
French and English, mostly viewed on phones.

Constraints (from our design contract):
- Colours only as these tokens: paper (page background), surface (cards), tint (alternate
  sections), ink (text), muted (secondary text), line (borders), accent (brand colour),
  inverse, inverseInk, inverseMuted (footer band). Text on every background must reach 4.5:1.
- Fonts: open licence, self-hosted, Latin subset. Allowed today: Inter, Manrope, Playfair
  Display, Cormorant Garamond; you may propose one more open-licence font.
- Corners: square, soft or round.
- Fixed blocks: header, hero, text and image, text, features, gallery, quote, call to action,
  rooms (cards or detailed), offers, house rules, FAQ, contact facts, map, footer. You change
  how they look, never what they contain.
- Hotels may change the accent, background and text colours and the fonts: the design must
  still work when they do.
- Must differ clearly from our existing templates: Maison (cream, serif, classic), Atelier
  (white, sans-serif, square, split hero), Soirée (dark, gold, italic serif).

Deliver:
1. The token values as W3C design tokens JSON, in the shape of docs/design-tokens/maison.tokens.json.
2. The font pair and why.
3. For each block, how its layout and style differ from a plain stacked layout (one or two sentences).
4. A name and a one-sentence description in English and French, and the kind of hotel it suits.
5. A desktop and a mobile mock-up of the home page with placeholder photos.
```

Attach, if the assistant accepts files: `docs/11-design-contract.md`, `docs/design-tokens/maison.tokens.json` and two screenshots from `docs/screenshots/templates/`.
