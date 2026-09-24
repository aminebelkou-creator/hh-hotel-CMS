# booking (parked)

A booking-engine adapter interface and a deterministic mock ("clockPMS BE"), built on 23 September 2026 and **parked on 24 September** at the owner's request: the product is a hotel marketing website, and the public site has no booking logic. The header's "Book" button is a plain link set per site (`sites.cta`), usually to the contact page or the hotel's existing booking link.

Nothing in the app imports this folder. Its unit tests (`tests/int/booking.int.spec.ts`) keep it compiling in case the xedge booking-engine integration comes back (contract: `docs/contracts/booking-engine-embed.md`).
