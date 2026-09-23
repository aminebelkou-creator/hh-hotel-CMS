# Content model and hotel pack, on paper

Status: **draft for team review**, 23 September 2026. It covers two checklist items: "Collection design on paper: platform primitives, provenance, locale" (week 1) and "Hotel pack types on paper" (week 2). The spec's rule applies throughout: **no hotel concept in the core**. If the hotel pack needs a core change, the extension point is wrong.

## 1. Platform primitives (core, industry-neutral)

| Primitive | Exists today | Purpose | Notes for v1 |
| --- | --- | --- | --- |
| Tenant | yes | The customer account and isolation boundary | One tenant can own several sites later (multi-property is out of the 90 days) |
| Site | yes | Publishing boundary: locales, theme tokens, domains, status, brand name, time zone | Theme = W3C design tokens, validated for contrast |
| Page | yes | Route plus ordered blocks, SEO group, drafts and versions | Routing derived from structure, with explicit overrides stored (open question in the spec) |
| Block | yes (hero, richText) | Structured content unit rendered by templates | Packs add block types through the block registry, never by editing Pages |
| Media | yes | Asset with focal point, alt text, rights | Object storage and derivatives in week 5 |
| Domain | yes | Hostname to site; certificate state | Driven by the host adapter only |
| Release | yes | Immutable publish record | See [`06-release-pipeline-design.md`](06-release-pipeline-design.md) |
| **Fact** | no, add | One confirmed statement about the business (for example "check-in from 15:00"), with source, confidence, confirmedBy and confirmedAt | Generated text may only assert what a confirmed fact supports (spec rule 9) |
| **Entity type registry** | no, add | Lets a pack declare typed content (Room, Offer…) as collections that share tenancy, provenance, locale and SEO behaviour | Pack collections are ordinary Payload collections created through a core helper |
| **Projection** | no, add | Read-only, timestamped copy of external data (PMS, profile, reviews) with a freshness policy | Never mastered here; the connector framework writes it |

## 2. Cross-cutting rules for every content collection

- **Tenancy**: the multi-tenant plugin on every tenant-scoped collection, RLS policy added in the same migration, and an isolation test extended (CLAUDE.md rule 4).
- **Provenance** at field-group level: `origin` = generated | human | locked, plus `sourceFact` and `generatedBy` (the model and prompt version). Regeneration does a three-way merge, so human and locked fields are never overwritten.
- **Locale**: user-facing text is `localized: true`; ids, prices, dates and codes are not. Fallback to the site's default locale; machine translations carry provenance `generated` until a human edits them.
- **SEO and structured data**: each entity type declares its schema.org mapping in the pack, and the core renders JSON-LD from that mapping.
- **Freshness**: anything with a validity window (offers, events, seasonal hours) carries `validFrom` and `validTo`. The service loop flags stale content; it does not silently hide it.

## 3. Hotel pack (`packs/hotel`) — entity types

| Type | Key fields | Localized | Source of truth | schema.org |
| --- | --- | --- | --- | --- |
| **Room** | name, code (PMS room type), description, occupancy (adults/children), bedTypes, sizeM2, view, amenities → Amenity[], images, accessibilityFeatures | name, description | PMS projection for code/occupancy; human for copy | `HotelRoom` + `Offer` for price from booking engine |
| **Offer** | title, summary, conditions, rateCode (booking engine), validFrom, validTo, minStay, includes, image, bookingDeepLink | title, summary, conditions | Human or agent draft, rate from booking engine | `Offer` (priceSpecification from booking engine, never hand-typed) |
| **Amenity** | name, category (room/property/wellness/business/family/accessibility), icon token, chargeable | name | Fact base | `LocationFeatureSpecification` |
| **Outlet** | name, type (restaurant/bar/spa/meeting), description, openingHours, menuLink, bookingLink, capacity | name, description | Human | `Restaurant` / `BarOrPub` / `DaySpa` / `MeetingRoom` (by type) |
| **Policy** | kind (check-in, check-out, cancellation, pets, children, payment, parking, smoking), text, structured values (times, fees) | text | Fact base (confirmed by the hotel) | `checkinTime`, `checkoutTime`, `petsAllowed` on `Hotel` |
| **LocalGuide** | title, category (sight/transport/food/shopping), description, distance, geo, link, season | title, description | Agent draft from public sources, human-approved | `TouristAttraction` / `Place` |

Plus one **property profile** per site: legal name, star rating, address, geo, contacts, check-in and check-out times, languages spoken, and a booking engine property id. It maps to `Hotel` / `LodgingBusiness` and is filled from confirmed facts.

## 4. How the pack plugs in, with no core change

| Extension point | Hotel pack uses it for |
| --- | --- |
| Entity type registry | the six types above plus the property profile |
| Block registry | RoomList, RoomDetail, OfferGrid, AmenityList, OutletCard, PolicyTable, LocalGuideMap, BookingWidget (embed per the booking-engine contract) |
| Structured-data profiles | `Hotel`, `HotelRoom`, `Offer` mappings |
| Onboarding questionnaire | the fact-confirmation checklist for a hotel |
| Agent skills | "draft local guide", "refresh offers from booking engine", "check policies against the fact base" |
| Connectors | PMS inventory projection (read-only), booking engine rates and deep links |

## 5. Decisions for the review

1. Pack types as separate Payload collections (proposed) or as a generic `entities` collection with typed JSON. Separate collections give admin UI, validation, indexes and RLS for free.
2. Prices never stored as editable content. Always projected from the booking engine, so displayed prices cannot drift from bookable ones.
3. Facts as their own collection (proposed) or as fields on the property profile. A collection gives per-fact confirmation, sourcing and audit.
4. Which Room fields the PMS team can project by week 4, and in what shape. This is input for the PMS contract.
