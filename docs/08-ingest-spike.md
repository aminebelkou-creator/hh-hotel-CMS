# Ingest spike — customer zero, www.hotel-herse-dor.com

23 September 2026. Week-1 item: "scrape a hotel site … into a fact base". The script is `apps/platform/src/ingest/spike.ts`, with deterministic extraction and no AI model yet. Output goes to `apps/platform/.ingest/` (git-ignored: third-party content is not committed).

**Result: in about 75 seconds, 41 pages became 45 unconfirmed facts with their source.** The run also found five real inconsistencies on the live site, which the hotel must settle before anything is generated.

## How it works

- Polite: honours `robots.txt`, reads the Yoast sitemaps first, stays on one host, 1 request per second, identifies itself in its user agent.
- Every fact records `key`, `value`, `source` URL, `method` and a `confidence`, and starts with `status: unconfirmed`. Confidence runs from 0.9 for structured data, through 0.6–0.8 for meta tags and links, down to 0.4–0.5 for patterns in text. Nothing is published until the hotel confirms it (spec rule 9).
- Finding 19: the host publishes an IPv6 address that does not answer, and Node's `fetch` timed out on it while PowerShell succeeded. The crawler now prefers IPv4 and retries. Small hotel hosting will do this often.

## What it found

| Area | Found | Confidence | Note |
| --- | --- | --- | --- |
| Name | Hôtel de la Herse d'Or \*\*\* | structured data | From Yoast `Organization`; no `Hotel` schema on the site |
| Address | 20 rue Saint-Antoine, 75004 Paris | text, 4 spellings | Needs normalising; one variant is glued to the next word |
| Phone | +33 1 48 87 84 09 on 3 pages; **01 87 44 77 90** in the terms of sale | text | **Conflict**: confirm which number is current |
| Email | info@hotel-herse-dor.com | text | Extraction glued neighbouring words onto it on 4 pages (fixed by normalising) |
| Check-in | 15:30 | text | One source only |
| Check-out | **11:00 on /hotel/, 10:30 on /hotel-et-services/** | text | **Conflict on the live site**: exactly what fact confirmation exists for |
| Rooms | "Confort", "Supérieure" (plus noisy headings) | headings | Needs the room-type list from the PMS, not guessing |
| Amenities | Wi-Fi, breakfast, lift, pets, 24 h reception, non-smoking, accessibility, safe, bar, air conditioning, parking | keywords | Keyword hits only: each must be confirmed (for example, whether "parking" means on-site or nearby) |
| Profiles | Instagram, Facebook | structured data / links | Google Business Profile not linked from the site |
| Booking engine | **not detected** in links, iframes or scripts | — | Probably loaded by a widget or linked from somewhere not crawled; ask the hotel |

## The hotel's answers (23 September)

The owner settled the open questions the same day. This is the first real fact confirmation.

| Question | Answer | Effect on the fact base |
| --- | --- | --- |
| Check-out: 11:00 or 10:30? | **11:00** | 11:00 confirmed; 10:30 rejected. The /hotel-et-services/ page is wrong and goes on the fix list |
| Which phone number is current? | **Both**: +33 1 48 87 84 09 and 01 87 44 77 90 | Both confirmed; the site should show them consistently |
| Which booking engine? | None to integrate yet | A mock called **clockPMS BE** stands in for the xedge booking engine (`apps/platform/src/booking/`) |

## From the spike to the fact base (built 23 September)

The crawler output now goes into Payload:

1. **Normaliser** (`src/ingest/normalise.ts`). It converts phones to E.164, cuts words glued onto emails and addresses by extraction ("…comEmail", "ParisPolitique"), and merges sightings of the same value while keeping each one as evidence. Customer zero's 45 sightings became **35 distinct facts**.
2. **`facts` collection**, tenant-scoped and under RLS. Every fact is born `unconfirmed`, whoever creates it (ingest, a user or an MCP agent). Confirming or rejecting is a separate step, and the server stamps who decided and when. Agents can propose facts over MCP but cannot confirm them.
3. **Import with the owner's decisions** (`src/ingest/import-facts.ts` plus `src/ingest/confirmations/hotel-herse-dor.json`). It creates the tenant, site and a minimal home page if they are missing, upserts the facts, then applies the decisions. Re-importing refreshes the evidence and never overwrites a decision.
4. **Only confirmed facts reach the public site.** A release snapshots confirmed facts only; the renderer's "Practical information" panel is built from them. Customer zero shows check-out 11:00 and both phone numbers. It does not show check-in 15:30 or the address, because nobody has confirmed them yet.

Still to confirm in the admin (Facts, filter `unconfirmed`): check-in 15:30, the address, email, amenities (what "parking" means), room names, and three `0x-1600-1200` numbers that look like Wi-Fi instructions rather than hotel phones.

## Owner's approval (24 September)

The owner reviewed the demo site built from these facts and approved its content ("the website info are alright"), including the points flagged for checking: the lift, the approximate map position and the absence of room sizes. Engineering's "Demo" confirmations therefore stand as the hotel's.

## Site audit, a first service-report preview

| Check | Result |
| --- | --- |
| Pages crawled | 41, all returning 200 |
| Structured data | On all 41 pages, but only generic `Organization`/`WebSite`. **No `Hotel`, address, phone, rooms or offers in schema.org**, which is the biggest SEO and answer-engine gap |
| Pages without an H1 | 9 of 41 (/hotel/, /chambres/, /rooms/, /contactez-nous/, /situation/…) |
| Thin pages (under 150 words) | 3 |
| Leftover or test pages public | `/bonjour-tout-le-monde-2/` (the WordPress "Hello world" post), `/5515-2/`, `/home-working-cheikh-2/`, `/wifi-customers/` |
| Stack | WordPress 7.1 + Elementor + Yoast |
| Languages | `fr-FR` only; no `hreflang` alternates although `/rooms/` suggests English content |

## What this means for the product

1. **The fact-confirmation step is essential, not a nicety.** A 41-page site had two conflicting policies and two phone numbers. Generating from it without confirmation would publish contradictions.
2. The audit table above is already most of a first **monthly service report**: concrete, checkable, and fixable by the platform.
3. **Next for the spike:**
   - an AI extraction pass (needs the model API key) to turn room pages into Room entities
   - Google Business Profile via its API (needs the hotel's authorisation)
   - a normaliser for addresses, phones and emails
   - the confirmation UI in Payload (Fact collection, per [`07-content-model-and-hotel-pack.md`](07-content-model-and-hotel-pack.md))
