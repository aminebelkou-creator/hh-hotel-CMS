# Contract: booking-engine embed — v0.1 draft

**Purpose.** The booking flow stays on the hotel's own domain as a first-party component, so conversion and attribution are not lost to a redirect. This contract defines how the booking engine mounts inside a platform-rendered page and what it reports back.

## Ownership

| Concern | Owner |
| --- | --- |
| Availability, rates, booking, payment, confirmation | Booking engine |
| Mount point, theme tokens, locale, page context, consent state | Website platform |
| `reservation.created` event for attribution | Booking engine emits; platform consumes |
| Search widget on content pages (dates, guests) | Website platform, handing parameters to the engine |

## Integration surface

The engine is mounted at a path on the hotel's domain (default `/book`) by the platform's edge layer, with the same signed configuration pattern as the chatbot: tenant, site, locale, theme tokens, consent state, and the search parameters the visitor entered.

The engine must render server-side or hydrate fast enough to keep the page within Core Web Vitals budgets, and must work with the platform's consent management (no marketing cookies before consent).

## Events

| Event | Direction | Payload |
| --- | --- | --- |
| `booking.search` | engine → platform | dates, guests, promo code |
| `booking.step` | engine → platform | step name, for funnel analytics |
| `reservation.created` | engine → platform (via bus) | reservation id, tenant, value, currency, channel, attribution token |

The attribution token is minted by the platform on first landing and passed to the engine at mount; it comes back on `reservation.created`, which is how the revenue dashboard works.

## Rules

1. Same-domain only. No redirect to a third-party host at any step before payment.
2. Payment fields are the engine's PCI scope; the platform never touches card data.
3. Rates displayed on content pages come from the same read model the engine uses, with a freshness stamp; the platform never displays a rate it invented.
4. Accessibility: the booking path is manually keyboard- and screen-reader-tested at each release; it is the critical path for EAA conformance.

## To confirm before signing

The mount mechanism (web component, iframe with postMessage, or server include); the theme token contract; the attribution token format; the event bus topic; ownership of the `/book` route's SEO metadata.
