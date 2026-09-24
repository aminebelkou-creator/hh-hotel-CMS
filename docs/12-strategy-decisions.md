# Strategy decisions — 24 September 2026

Outcome of a question-and-answer session with the owner after Phase 1. Each entry says what was decided or recommended, why, and where it is tracked. Research sources are listed at the end. Not legal advice: the compliance items need review by a lawyer before the first paying hotel.

## 1. What a hotel gets (confirmed)

- **One multi-tenant, multi-site Payload CMS** runs every hotel: one application, one database. Each hotel is a tenant (official multi-tenant plugin, plus Postgres row-level security); a tenant can have several sites, each with its own domain, languages and look. No installation per hotel; a dedicated instance can be a premium option later on the same code.
- **Backbone shared by all hotels**: the blocks, the hotel pack (rooms, offers, policies, FAQ, schema.org), the release pipeline, isolation rules, photo handling, owner accounts, and the design contract. **Per hotel**: its tenant data, a template and brand, its domain.
- **Guests only ever see frozen releases.** Publishing freezes a verified version; the renderer never reads the CMS. This rule decides where plugins, caching and integrations fit.
- **Each hotel gets three things**: its website; a studio (today the admin with preview and the publish panel; a visual editor later); a hotel dashboard. **We get** a team dashboard over all hotels.

## 2. Domains

- Hotels **keep their DNS provider** and add one CNAME to a name we control (never an A record to an IP, never moving name servers: their email lives there). If we change host, we change our name, not 50 hotels' DNS.
- EdgeOne Makers: custom domains need a project in area **overseas** ("Global, Chinese mainland excluded"); the default area needs a Chinese ICP filing (finding 22). The platform moved to project `hh-platform` on 24 Sep.
- Domains are added in the Makers console only (no public API): fine for a handful of hotels; the API is asked of Tencent.
- Root domains (`hotel.com`) redirect to `www`; HTTPS certificates are free and automatic (90 days, renewed 15 days before expiry). Hotels with CAA records must allow TrustAsia and Let's Encrypt.

## 3. Plugins and platform features

**Rule: plugins help people write; anything public comes from the frozen release.** A plugin is accepted if it is tenant-scoped (collections under the multi-tenant plugin and RLS), stores data rather than rendering pages, passes the `overrideAccess` audit, supports localisation and our Payload version, and is maintained (official `@payloadcms` preferred).

| Decision | Items |
| --- | --- |
| Adopt (Phase 2) | Payload SEO, Redirects, Form Builder, Import/Export |
| Already used | Multi-tenant, MCP, Cloud Storage (photo adapter) |
| Later | S3 storage (EU object storage), Sentry, two-factor login (community, after review), AI translation (community, after review), SEO analyser (trial) |
| Skip | Sitemap, JSON-LD and reviews plugins (we generate from the release), Search, Nested Docs, Stripe, Ecommerce |
| Build ourselves | AEO (structured data, `llms.txt`, consistent facts), Google Business Profile sync (a server-side connector writing proposed facts), sitemaps and schema.org |

EdgeOne features: **KV** to cache published pages at the edge (Phase 2; KV never decides which release is live, so rollback stays instant); **Blob** a possible later home for photos once EU storage is confirmed; **agents** runtime for Phase 3 (120 s limit: long work runs as jobs); **image processing** not needed (uploads are already WebP in three sizes). Everything EdgeOne-specific sits behind an adapter: Gate 1 can still choose Cloudflare, which has an equivalent for each.

Limits found: cloud functions accept **6 MB** request bodies and run **120 s**; phone photos need a size cap or in-browser resize.

## 4. Security

No WordPress-style security plugin is needed: there is no third-party plugin code, uploads are re-encoded images that never execute, and guests only reach frozen releases. Layers to add: edge rate limits and bot rules (EdgeOne custom rules), `/admin` only on our domain, security headers, spam protection on forms, two-factor login for owners and our team, Dependabot and code scanning, error and uptime alerts, admin action log, backups with a restore drill, and an external penetration test before paying customers.

## 5. Compliance

- **GDPR roles**: the hotel is the controller for its visitors; we are its processor. We need a data processing agreement with each hotel (in the subscription terms), a public list of sub-processors (Tencent, Neon; later the email provider, Sentry, the AI provider), a register of processing, and a breach procedure.
- **Tencent**: the DPA, where data and logs live, and from which countries staff can access them are in the Tencent email.
- **Public pages** set no cookies and use no trackers, so no consent banner. The OpenStreetMap embed sends visitors' IP addresses to OpenStreetMap: replace it with a map image made at publish time.
- **Fonts are self-hosted** (no Google Fonts CDN).
- **Contact form**: minimal fields, a notice, automatic deletion after a set period, EU spam protection, EU email provider.
- **Accessibility**: the European Accessibility Act applies in France since 28 June 2025 to online sales of services, hotel booking included (standard EN 301 549, in practice WCAG 2.1 AA). Micro-enterprises (under 10 staff and at most €2 million turnover or balance sheet, per legal entity) are exempt. With no booking on the site we are arguably outside it today, but not once a hotel adds booking. We keep WCAG 2.2 AA as our own bar: automated checks in CI, token-level contrast (done), a manual audit, and an accessibility statement per hotel.
- **AI**: the EU AI Act's transparency rules (scheduled from August 2026) require a guest chatbot to disclose it is AI.
- **French specifics**: legal notice (LCEN, drafted), star ratings matching a current Atout France classification, prices including taxes and the tourist tax.

## 6. Design

- **A design contract comes before more templates**: tokens, brand fields, gates, block classes, fonts ([`11-design-contract.md`](11-design-contract.md)). Done on 24 Sep.
- **No designer yet**: engineering built the first three templates (Maison, Atelier, Soirée); a designer adds and refines templates later within the contract.
- **Agents propose brands, hotels approve**; a branding skill packages the contract for agents (Phase 3).

## 7. Email for the contact form

Proposed: **Scaleway Transactional Email** (French company, data only in France, 300 emails a month free then €0.25 per 1,000, sending only). Alternative: Brevo (French, data in France and Germany, 300 a day free, a full marketing suite). Messages go from an address on our platform domain to the hotel, with reply-to the guest, so only our domain needs SPF, DKIM and DMARC records. Connected through SMTP so the provider can change without code. Waits for our platform domain.

## 8. Open for the owner

| Item | Unblocks |
| --- | --- |
| Send the Tencent email (updated draft in `outreach/`) | Gate 1: domain API, quotas, pricing, DPA |
| Delete the old Makers project `hh-platform-poc` in the console | Nothing depends on it any more |
| Our platform domain, and a test subdomain | Own-domain serving live, email sending |
| Email provider account (Scaleway TEM or Brevo) | Contact form emails |
| Validate the three legal pages | Replacing customer zero's current site |
| AI model key; hotel shortlist | Phase 3 |

## Sources

- EdgeOne Makers: [domain overview](https://pages.edgeone.ai/document/domain-overview), [custom domain](https://pages.edgeone.ai/document/custom-domain), [HTTPS](https://pages.edgeone.ai/document/configuring-an-https-certificate), [free certificates](https://pages.edgeone.ai/document/apply-for-free-certificate), [error codes](https://pages.edgeone.ai/document/error-codes), [skills](https://pages.edgeone.ai/document/skills), [MCP](https://pages.edgeone.ai/document/mcp), [general availability](https://pages.edgeone.ai/resources/pages-general-availability); installed `edgeone-makers-tools` skills 2.3.3 (storage, cloud-function limits); `edgeone makers deploy --help` (area option).
- Payload: [plugins overview](https://payloadcms.com/docs/plugins/overview), [preventing abuse](https://payloadcms.com/docs/production/preventing-abuse), [Payload Market](https://payload.market/plugins), [best plugins 2026](https://www.buildwithmatija.com/blog/best-payload-cms-plugins).
- Email: [best European email APIs 2026](https://ahasend.com/blog/best-european-email-apis-2026).
- Accessibility: [Prostay, hotel websites and the EAA](https://www.prostay.com/blog/hotel-website-accessibility-eaa-2026/), [Recite Me, EAA in France](https://reciteme.com/news/european-accessibility-act-in-france/).
- GDPR: [CNIL, IP addresses are personal data](https://www.cnil.fr/fr/ladresse-ip-est-une-donnee-caractere-personnel-pour-lensemble-des-cnil-europeennes).
