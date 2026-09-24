# Designer brief: making a template

For a designer (or an AI agent) asked to create a new look for hotel sites. **Is [`11-design-contract.md`](11-design-contract.md) enough?** It is the rulebook (what may change, what is checked), written for engineers as much as designers. To design a template you also need this brief (what to deliver and how it is judged), the token files in [`design-tokens/`](design-tokens/), and the screenshots of the existing templates in [`screenshots/`](screenshots/README.md). Background, if useful: [`13-how-it-works.md`](13-how-it-works.md).

## 1. What you are designing

- **A template, not one website.** The same design will carry many hotels' content: different photos, names from 8 to 40 characters, one to five room types, French and English (German, Spanish and Italian later). Design for the content you do not control.
- **Blocks, not pages.** Hotels build pages from a fixed set of blocks (section 3). You decide how each block looks; you do not add or remove blocks or change what they contain.
- **Mobile first.** Most guests arrive on a phone. Every block must work at 390 px wide and at 1280 px.
- **Readable by everyone.** WCAG 2.2 AA is our bar, not an afterthought. The platform checks colour contrast automatically; your job is to make legible, calm pages that do not rely on colour alone.

Existing templates, to be different from: **Maison** (classic, cream, serif), **Atelier** (modern, white, sans-serif, square), **Soirée** (dark, gold, italic serif). A new template should suit a kind of hotel these do not (for example: seaside, mountain, family, budget-smart, design-led boutique).

## 2. What you can decide, and what is fixed

| You decide | Fixed by the contract |
| --- | --- |
| The palette: page background, cards, alternate sections, text, secondary text, lines, accent, footer band (the tokens in [`design-tokens/`](design-tokens/)) | Colours only through tokens; derived colours (button text, accent used as text, focus ring) are computed by the platform |
| Heading and body fonts, from the allowed list or a new proposal (open licence, Latin subset, preferably variable) | Fonts are self-hosted; no Google Fonts CDN or paid licences without approval |
| Type scale, weights, letter-spacing, line length | Page markup and the order of content inside each block |
| Spacing, section rhythm, corner style (square, soft or round) | One `h1` per page (the first hero) |
| Layout of each block within its section: split or overlay hero, card or list rooms, centred or aligned titles | Text over photos only on a darkening overlay |
| Header and footer style, button style (filled, outline) | Visible keyboard focus, touch targets of at least 24 px (44 px for main buttons) |
| Subtle motion (hover, reveal) | Respect "reduced motion"; nothing that moves content while reading |
| A light or dark scheme | Hotels can change the accent, background and text colours and the fonts: your design must still work when they do |

## 3. The blocks to design

Real content for every block is visible in the screenshots of customer zero (Hôtel de la Herse d'Or). Design each block with short and long content and with and without a photo.

| Block | Content it carries |
| --- | --- |
| Header | Hotel name (and optional logo), tagline, 4–6 menu links, language switch, "Book" button; mobile menu |
| Hero | Headline (up to ~60 characters), sub-headline, optional button, optional full-width photo |
| Text and image | Eyebrow label, heading, 1–3 paragraphs, photo left or right, optional link |
| Text | Heading, paragraphs with sub-headings (legal pages) |
| Features | Heading, 3–9 items each with a title and optional one-line text |
| Gallery | Heading, 3–12 photos |
| Quote | One quotation and its author |
| Call to action | Heading, text, button, optional background photo |
| Rooms (hotel pack) | Cards (photo, category, name, capacity/bed/view, summary, link) or detailed list (large photo, description, amenities, thumbnails) |
| Offers (hotel pack) | Cards: photo, badge, title, summary, conditions, link |
| House rules (hotel pack) | Check-in/out times and 3–8 short rules |
| FAQ | 3–10 questions that open to answers |
| Contact | Intro text and a facts panel: address, phones, email, check-in/out |
| Map | A map (a static image from Phase 2) and a link |
| Footer | Name, tagline, address, contact, menu, social links, legal links, release line |

## 4. What to deliver

1. **Figma file** (or equivalent) with: home, rooms, contact and a legal page at 1280 px and 390 px; a component sheet with every block above, including long names, missing photos and five-item vs one-item cases; hover and focus states; the mobile menu open.
2. **Tokens as JSON**, in the same shape as [`design-tokens/maison.tokens.json`](design-tokens/maison.tokens.json): colours, fonts, corner style. Figma variables exported as W3C design tokens are ideal.
3. **Layout notes** per block where the design differs from Maison (a sentence or an annotated frame is enough).
4. **Name and description** of the template in English and French (one or two sentences, like those in [`11-design-contract.md`](11-design-contract.md) §6), and the kind of hotel it suits.
5. **Fonts**: names, licence, weights used.

## 5. Checklist before handing over

- [ ] Every text colour on every background it appears on is at least 4.5:1 (3:1 for large headings and the focus ring). Check with any contrast tool.
- [ ] The design still reads with a different accent colour (try a pale yellow and a dark navy).
- [ ] Headlines of three lines and hotel names of 40 characters do not break the header or hero.
- [ ] French words (`Accessibilité`, `Réservez en direct`, `Confidentialité & cookies`) fit buttons and menus.
- [ ] Photos of mixed quality still look good (hotel photos are often phone pictures).
- [ ] No content-specific imagery in the template (no Paris, no Eiffel Tower): the hotel supplies the photos.
- [ ] Mobile: one column, thumb-reachable menu and "Book" button, no horizontal scrolling.

## 6. How it gets built and reviewed

An engineer or a coding agent implements the design in `apps/platform/src/design/templates.ts` (tokens) and a new `[data-template='<id>']` section of `site.css` (layout), without changing markup. The design tests must pass (the template's own tokens, and random brand accents, never fail contrast). Screenshots of customer zero in the new template are taken with `tests/visual/templates.mjs` and compared with the design. The owner approves; the template is deployed and becomes selectable in every site's admin.

## 7. Example prompts

### A. Implement a designer's template (for a coding agent in this repository)

```text
You are working in the hh-hotel-CMS repository. Read CLAUDE.md, docs/13-how-it-works.md and
docs/11-design-contract.md first, and follow them.

Task: add a new site template called "Riviera" (id: riviera), from the designer's handoff in
docs/design-handoff/riviera/ (tokens JSON, annotated frames, notes).

Do:
1. Add the template to apps/platform/src/design/templates.ts: palette from the handoff tokens,
   fonts (from FONT_IDS, or add the new open-licence font to src/design/fonts/ and fonts.ts),
   corners, scheme, version 1.0.0, English and French descriptions.
2. Add a "Template: Riviera" section to apps/platform/src/app/(sites)/s/[site]/site.css using
   only [data-template='riviera'] selectors and --hh-* tokens. Do not change markup in
   src/site/ or packs/hotel/src/render/. No fixed colours except white/black over photos.
3. Create a migration for the new enum value (pnpm payload migrate:create), regenerate types
   and the import map, run tsc.
4. Run tests/int/design.int.spec.ts and the full local suite; add riviera to
   tests/visual/templates.mjs and take screenshots; compare them with the handoff frames and
   list the differences you could not match and why.
5. Update docs/11-design-contract.md §6, docs/screenshots/README.md and the checklist.
Stop and ask if the design needs markup changes or a block that does not exist.
```

### B. Propose a new template when there is no designer (for an AI design assistant)

```text
Design a website template for small independent hotels by the sea (family-run, 15-40 rooms,
Mediterranean coast). It will be used by many hotels, each with its own photos and texts, in
French and English, mostly viewed on phones.

Constraints (from our design contract):
- Colours only as these tokens: paper (page background), surface (cards), tint (alternate
  sections), ink (text), muted (secondary text), line (borders), accent (brand colour), inverse,
  inverseInk, inverseMuted (footer band). Text on every background must reach 4.5:1.
- Fonts: open licence, self-hosted, Latin subset. Allowed today: Inter, Manrope, Playfair
  Display, Cormorant Garamond; you may propose one more open-licence font.
- Corners: square, soft or round.
- Fixed blocks: header, hero, text and image, text, features, gallery, quote, call to action,
  rooms (cards or detailed), offers, house rules, FAQ, contact facts, map, footer.
- Must differ clearly from our existing templates: Maison (cream, serif, classic), Atelier
  (white, sans-serif, square, split hero), Soirée (dark, gold, italic serif).

Deliver: (1) the token values as W3C design tokens JSON; (2) the font pair and why; (3) for
each block, how its layout and style differ from a plain stacked layout, in one or two
sentences; (4) a name and a one-sentence description in English and French; (5) a desktop
and mobile mock-up of the home page with placeholder photos.
```

### C. Brief for a freelance designer (email)

```text
Subject: Website template for independent hotels: brief

We run a managed website service for independent hotels in France. Every hotel's site is built
from the same blocks; a "template" gives them a look. We have three templates and want [one / two]
more, for [seaside / mountain / family] hotels.

Please read the attached brief (docs/14-designer-brief.md), the design rules
(docs/11-design-contract.md), the token files (docs/design-tokens/) and the screenshots of our
existing templates. Deliverables and the checklist are in sections 4 and 5 of the brief.
Budget: [...]. Deadline: [...]. We implement the design ourselves; you do not need to write code.
```
