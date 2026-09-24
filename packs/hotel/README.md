# @hh/pack-hotel

The hotel vertical, as a pack. The platform core (`apps/platform`) knows nothing about rooms or hotels; it loads this pack through `apps/platform/src/packs.ts`.

| Part | File | What it adds |
| --- | --- | --- |
| Collection | `src/collections/Rooms.ts` | `rooms`: room types with localized name, summary, description, size, occupancy, bed, view, features and photos. Tenant-scoped by the platform |
| Block | `src/blocks.ts` | `rooms` page block: a heading, an intro and the room cards |
| Snapshot | `src/snapshot.ts` | Adds the tenant's rooms to every release, so the public site never reads live data |
| Structured data | `src/jsonld.ts` | schema.org `Hotel` for the public site, from confirmed facts and rooms |
| Rendering | `src/render/` | React server components for the pack's blocks |

Rules: no booking logic here (the platform shows a "Book" call to action only); every value shown to guests comes from the release snapshot.
