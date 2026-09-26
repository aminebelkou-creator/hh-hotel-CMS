# Screenshots

Evidence of what the platform looks like at a given date. Taken with `apps/platform/tests/visual/screenshots.mjs` (Playwright, Chrome), full page, lazy images loaded first.

```bash
cd apps/platform
node tests/visual/screenshots.mjs https://hh-platform.edgeone.dev <output-folder>
```

## 25 September 2026: customer zero live on Lumière (licensed Luxorefi adaptation), Phases 3–5 deployed

Taken on the **public platform** (https://hh-platform.edgeone.dev, release r8, code `b830ad2`). The home page carries the elements added for Lumière: stars from the confirmed classification, the booking bar (opens the Book link with the dates), photo banners, the photo band, feature icons, room tags and facts. Headings in Butler.

| What | Screenshot |
| --- | --- |
| Home (FR) | [site-home-fr.jpg](2026-09-25/site-home-fr.jpg) |
| Home on a phone | [site-home-mobile.jpg](2026-09-25/site-home-mobile.jpg) |
| Rooms (FR) | [site-rooms-fr.jpg](2026-09-25/site-rooms-fr.jpg) |
| Rooms on a phone (r12: photos keep their shape, square thumbnails) | [site-rooms-mobile.jpg](2026-09-25/site-rooms-mobile.jpg) |
| Lightbox on a phone (a room thumbnail tapped; swipe for the room's other photos) | [site-lightbox-mobile.jpg](2026-09-25/site-lightbox-mobile.jpg) |
| Blog on the home page (r13: the latest three posts) | [desktop](2026-09-25/blog-home-desktop.jpg), [phone](2026-09-25/blog-home-mobile.jpg) |
| Blog page *Le carnet du Marais* | [desktop](2026-09-25/blog-list-desktop.jpg), [phone](2026-09-25/blog-list-mobile.jpg) |
| A post (Le Marais à pied) | [desktop](2026-09-25/blog-post-desktop.jpg), [phone](2026-09-25/blog-post-mobile.jpg) |
| Guest reviews on the home page (r14: three real Google reviews) | [desktop](2026-09-25/reviews-desktop.jpg), [phone](2026-09-25/reviews-mobile.jpg), [English page](2026-09-25/reviews-desktop-en.jpg) |
| Hero with the booking bar, full width on phones (r14) | [desktop](2026-09-25/hero-desktop.jpg), [phone](2026-09-25/hero-mobile.jpg) |
| Hero video (26 Sep, local build): the Seine and the Conciergerie over the lounge photo, pause button bottom right | [desktop](2026-09-26/hero-video-desktop.jpg), [phone](2026-09-26/hero-video-mobile.jpg) |
| AI blog drafts (26 Sep, local build): the Blog panel on the site, and the draft post it wrote from the confirmed facts | [panel](2026-09-26/blog-drafts-panel.png), [draft post](2026-09-26/blog-drafts-post.png) |
| Services (EN) | [site-services-en.jpg](2026-09-25/site-services-en.jpg) |
| Neighbourhood (FR) | [site-neighbourhood-fr.jpg](2026-09-25/site-neighbourhood-fr.jpg) |
| Contact (FR) | [site-contact-fr.jpg](2026-09-25/site-contact-fr.jpg) |
| Legal notice (FR) | [site-legal-notice-fr.jpg](2026-09-25/site-legal-notice-fr.jpg) |
| Crops used in the README | [site-home-fr-top.jpg](2026-09-25/site-home-fr-top.jpg), [site-home-mobile-top.jpg](2026-09-25/site-home-mobile-top.jpg), [site-rooms-fr-detail.jpg](2026-09-25/site-rooms-fr-detail.jpg) |

The admin after Phases 3 and 4 (dashboard, fact review, site panels, issues): [phase-3-4/](phase-3-4/README.md). The four templates side by side on the same content: [templates/](templates/) (`lumiere-*.jpg` added 25 Sep).

## 24 September 2026, evening: three templates (design contract)

The same content (customer zero) in the three templates built in-house, switched in the admin and published with no content change. Local test server; taken with `apps/platform/tests/visual/templates.mjs`. Contract: [`../11-design-contract.md`](../11-design-contract.md).

| | Maison (classic) | Atelier (modern) | Soirée (dark) | Lumière (licensed, 25 Sep) |
| --- | --- | --- | --- | --- |
| Home | [maison-home.jpg](templates/maison-home.jpg) | [atelier-home.jpg](templates/atelier-home.jpg) | [soiree-home.jpg](templates/soiree-home.jpg) | [lumiere-home.jpg](templates/lumiere-home.jpg) |
| Home on a phone | [maison-home-mobile.jpg](templates/maison-home-mobile.jpg) | [atelier-home-mobile.jpg](templates/atelier-home-mobile.jpg) | [soiree-home-mobile.jpg](templates/soiree-home-mobile.jpg) | [lumiere-home-mobile.jpg](templates/lumiere-home-mobile.jpg) |
| Rooms | [maison-rooms.jpg](templates/maison-rooms.jpg) | [atelier-rooms.jpg](templates/atelier-rooms.jpg) | [soiree-rooms.jpg](templates/soiree-rooms.jpg) | [lumiere-rooms.jpg](templates/lumiere-rooms.jpg) |
| Contact | [maison-contact.jpg](templates/maison-contact.jpg) | [atelier-contact.jpg](templates/atelier-contact.jpg) | [soiree-contact.jpg](templates/soiree-contact.jpg) | [lumiere-contact.jpg](templates/lumiere-contact.jpg) |

Admin: the template choice and the brand fields on a site — [admin-template-brand.jpg](templates/admin-template-brand.jpg).

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

## phase-3-4/ — the admin after Phases 3 and 4 (25 September)

Dashboard (hotel and fleet), fact review screen, the site's panels (import, write, translate, look), issues. See [phase-3-4/README.md](phase-3-4/README.md).
