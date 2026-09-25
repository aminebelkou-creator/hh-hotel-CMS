# Add a feature, a hotel-pack type or a Payload plugin

**For:** a coding agent in this repository.

```text
Read docs/13-how-it-works.md, CLAUDE.md, HANDOFF.md and docs/12-strategy-decisions.md §3 first.

Task: [add "amenities" as a hotel-pack type, shown on the services page and in schema.org] /
[adopt the official Payload redirects plugin for the old site's URLs] / [...].

Placement rules:
- Hotel concepts go in packs/hotel (collections, blocks, snapshot contribution, renderers);
  industry-neutral features go in apps/platform/src. Never a hotel concept in the core.
- Anything guests or search engines see must come from the release snapshot, never from live
  collections. Add the data to the snapshot and render it from there.
- A Payload plugin is acceptable only if it is tenant-scoped (its collections under the
  multi-tenant plugin, in rls.sql, apply-rls, inspect-rls, tenant-checksums and the isolation
  tests), passes the overrideAccess audit, supports localisation and our Payload version.

Definition of done:
- Migration created (additions and removals in separate migrations), rehearsed on the
  50-tenant database with 0 other tenants changed; import map regenerated if admin
  components changed; tsc clean.
- Tests added for the new behaviour and for isolation; local 10-tenant (with HTTP) and
  50-tenant suites green; CI green.
- Docs updated: the relevant design document, docs/CHECKLIST.md, HANDOFF.md, README.md.

Stop and ask if the feature needs a core change for a hotel concept, weakens isolation, sends
guest data to a new third party, or costs money.
```
