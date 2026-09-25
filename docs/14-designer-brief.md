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

Real content for every block is visible in the screenshots of customer zero (Hôtel de la Herse d'Or). Design each block with short and long content and with and without a photo. The elements added on 25 September for the licensed Lumière template (stars, booking bar, banners, photo band, checklist, feature icons, room tag and facts, section link) are optional: a template may leave them plain, but must not break when a hotel uses them.

| Block | Content it carries |
| --- | --- |
| Header | Hotel name (and optional logo), tagline, 4–6 menu links, language switch, "Book" button; mobile menu |
| Hero | Headline (up to ~60 characters), sub-headline, optional button, optional full-width photo; optional star classification line above the headline; optional booking bar (arrival, departure, guests, button) at the bottom of the photo |
| Text and image | Eyebrow label, heading, 1–3 paragraphs, optional checklist (3–6 short lines), photo left or right, optional link |
| Text | Heading, paragraphs with sub-headings (legal pages) |
| Features | Heading, 3–9 items each with an optional line icon, a title and optional one-line text |
| Banners | Eyebrow, heading, 2–6 full-width photo strips each with a title (shown on hover on desktop, always on phones) and an optional link |
| Photo band | One full-width photo between sections |
| Gallery | Heading, 3–12 photos |
| Quote | One quotation and its author |
| Call to action | Heading, text, button, optional background photo |
| Rooms (hotel pack) | Section title with an optional "see all" link; cards (photo with a category tag, name, facts line with icons: guests / bed / size, summary, link) or detailed list (large photo, description, amenities, thumbnails) |
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

Maintained in [`prompts/`](prompts/README.md):

- [Implement a designer's template](prompts/implement-template.md) — for a coding agent, once the handoff arrives.
- [Propose a new template](prompts/propose-template.md) — for an AI design assistant, when there is no designer.
- [Brief a freelance designer](prompts/designer-brief-email.md) — an email to send with this brief.
- [Propose a template and brand for a hotel](prompts/brand-proposal.md) — choosing among existing templates.
