# Onboard a new hotel from the admin (Phase 3 flow)

**For:** a member of our team, or a coding agent with an admin account. No code is written; the four Phase 3 tools in the admin do the work. The engineering flow in [onboard-hotel.md](onboard-hotel.md) remains for hotels that need hand-written content.

```text
Read docs/13-how-it-works.md first.

Onboard [Hôtel Example] ([https://www.example-hotel.com]) on the platform:

1. Admin → Tenants: create the tenant. Admin → Sites: create the site (name, slug, languages,
   default language, time zone, Current website = the hotel's address).
2. On the site, panel "Import the current website" → Import from website. Wait for "done".
   Open "Review facts": confirm what the hotel's own site states (or press "Confirm the
   sure ones" for structured data and links), correct values that need it, reject the rest.
   Never confirm a fact you cannot see on the source page (the "source ↗" link).
3. Panel "Write the pages" → Draft pages from confirmed facts. Open Pages: read every draft,
   edit freely (your edits are kept if you draft again), add photos (Media) to the hero and
   gallery blocks. Nothing is published yet.
4. Panel "Translate" → [EN]. Read the translation; fix what needs it.
5. Panel "Look" → Propose a look. Apply the template you prefer (buttons, links and text are
   checked for readability automatically).
6. Website panel → Publish site. Check /s/[slug] in every language.
7. Create the owner account (engineering: src/onboarding/owner.ts) and hand over.

Stop and ask before: confirming a fact you cannot verify, publishing legal pages that a
lawyer has not read, or using photos whose rights are unclear.
```

What the model does and does not do here: with `AI_PROVIDER` configured, it proposes extra facts (always unconfirmed), writes the page copy from the confirmed facts (numbers it cannot back are dropped), translates, and explains the look. Without a model, the import still finds structured data and patterns, the pages are drafted with plain deterministic copy, translation does nothing and the look is proposed from pixels and facts alone.
