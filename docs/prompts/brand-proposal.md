# Propose a template and brand for a hotel

**For:** an AI assistant (in a chat, with the hotel's website or logo), or a coding agent with admin access. Today the result is entered by a person in the admin (site → Template and Brand) and previewed before publishing; in Phase 3 an agent proposes it directly, still with the hotel's approval.

```text
Propose a look for the website of [Hôtel Example, 24 rooms, Annecy], using our platform's
templates and brand options. Sources: [the hotel's current website URL], [logo file], [3-5 of
its best photos].

Choose:
1. A template: maison (classic, cream, serif, full-width photo), atelier (modern, white,
   sans-serif, square corners, photo beside the headline) or soiree (dark, gold accent,
   centred italic headlines). Say why it suits this hotel and its photos.
2. An accent colour (hex), taken from the logo or the hotel's identity. Button text and links
   are adjusted automatically for readability, so any accent is allowed.
3. Only if clearly needed: a background colour and a text colour (hex). They must stay
   readable together (at least 4.5:1); leave them empty to keep the template's.
4. Optionally a heading font and a body font from: inter, manrope, playfair, cormorant; and
   corners: square, soft or round. Leave empty to keep the template's.

Answer as a short rationale followed by:
template: ...
accent: #......
background: (empty or #......)
text: (empty or #......)
headingFont: (empty or one of the list)
bodyFont: (empty or one of the list)
corners: (empty or square/soft/round)
```

After the proposal: enter it in the admin, press **Save**, check the site with **View site** after **Publish site**, and use **Undo last publish** if it does not look right. The admin refuses a text/background pair that is not readable.
