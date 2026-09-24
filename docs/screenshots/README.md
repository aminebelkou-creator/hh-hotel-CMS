# Screenshots

Evidence of what the platform looks like at a given date. Taken with `apps/platform/tests/visual/screenshots.mjs` (Playwright, Chrome), full page, lazy images loaded first.

```bash
cd apps/platform
node tests/visual/screenshots.mjs https://hh-platform.edgeone.dev <output-folder>
```

## 24 September 2026, later: Phase 1, hotelier self-service

Customer zero now runs on the platform's own photo storage, with offers, house rules, FAQ and legal pages, and an owner account. Live release r4 on https://hh-platform-poc.edgeone.cool/s/hotel-herse-dor (deployment `dpl4w2ghpe63`). Site pages below were taken on the local test server with the same code and content; the two "live" admin shots are from the public deployment, signed in as the hotel's owner.

| What | Screenshot |
| --- | --- |
| Admin, **live, signed in as the owner**: the site with the Website panel (Publish site, Undo last publish, View site, releases) | [live-owner-publish.jpg](phase-1/live-owner-publish.jpg) |
| Admin, **live, as the owner**: the owner sees only their hotel's pages, including the three legal pages | [live-owner-pages.jpg](phase-1/live-owner-pages.jpg) |
| Admin (local, super-admin): the same panel | [admin-publish.jpg](phase-1/admin-publish.jpg) |
| Draft preview of the contact page, with the "not published yet" banner | [preview-contact.jpg](phase-1/preview-contact.jpg) |
| Home (FR), photos now served from `/media/` | [site-home-fr.jpg](phase-1/site-home-fr.jpg) |
| Rooms (FR), with the "Book direct" offer | [site-rooms-fr.jpg](phase-1/site-rooms-fr.jpg) |
| Services (EN), with the "Good to know" house rules | [site-services-en.jpg](phase-1/site-services-en.jpg) |
| Contact (FR), with the FAQ | [site-contact-fr.jpg](phase-1/site-contact-fr.jpg) |
| Legal notice (FR); footer links to privacy and accessibility | [site-legal-notice-fr.jpg](phase-1/site-legal-notice-fr.jpg) |
| Neighbourhood (FR) | [site-neighbourhood-fr.jpg](phase-1/site-neighbourhood-fr.jpg) |
| Home on a phone (390 px) | [site-home-mobile.jpg](phase-1/site-home-mobile.jpg) |
| Admin dashboard (local, super-admin): Hotel group now has Room types and Offers | [admin-dashboard.jpg](phase-1/admin-dashboard.jpg) |

## 24 September 2026: customer zero's marketing website (release r3)

Live on https://hh-platform-poc.edgeone.cool/s/hotel-herse-dor. Content approved by the hotel owner on 24 September.

| Page | Screenshot |
| --- | --- |
| Home (FR) | [site-home-fr.jpg](2026-09-24/site-home-fr.jpg) |
| Rooms (FR) | [site-rooms-fr.jpg](2026-09-24/site-rooms-fr.jpg) |
| Services (EN) | [site-services-en.jpg](2026-09-24/site-services-en.jpg) |
| Neighbourhood (FR) | [site-neighbourhood-fr.jpg](2026-09-24/site-neighbourhood-fr.jpg) |
| Contact (FR) | [site-contact-fr.jpg](2026-09-24/site-contact-fr.jpg) |
| Home on a phone (390 px) | [site-home-mobile.jpg](2026-09-24/site-home-mobile.jpg) |
| Admin login (live, after the blank-page fix) | [admin-login.jpg](2026-09-24/admin-login.jpg) |
| Admin dashboard (local, super-admin) | [admin-dashboard.jpg](2026-09-24/admin-dashboard.jpg) |

Photos on the site are the hotel's own, served from its current website until the media pipeline exists.
