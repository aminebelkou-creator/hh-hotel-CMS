# Release pipeline v0 — design note

Status: **v0 implemented** for content releases, 23 September 2026 (see "What v0 implements" below). Implements plan week 4 ("build, immutable artifact, deploy, domain bind, rollback") and Gate 2 ("publish under 60 s, rollback under 10 s"). Grounded in measured findings 9, 12–14 and 17 of [`05-week1-spike-results.md`](05-week1-spike-results.md).

## Two kinds of release

| | Code release | Content release |
| --- | --- | --- |
| What changes | The platform application (Payload, renderer, templates) | One hotel's pages, media, settings |
| Frequency | Weekly at most, by engineers | Many per day, by hoteliers and agents |
| Path | CI → migrate Neon → re-apply RLS → deploy to the host | Publish in the studio → release record → render → cache purge for that hotel |
| Measured today | 153 s by CLI, 171–203 s from CI (remote build ~110 s) | v0 built: publish 3.1 s, rollback 1.2 s on Neon + Makers |
| Gate 2 target | Not bound by 60 s (proposed) | **Under 60 s publish, under 10 s rollback** |

Proposal for the open decision: the 60 s target applies to **content releases**. Code releases carry migrations and a full build, and happen rarely and deliberately. Holding them to 60 s would force building in CI and uploading an artifact, which the Makers CLI does not support today.

## Rules the pipeline must enforce

1. **One publish at a time per target.** Makers accepts concurrent deploys, and the last to *finish* goes live (finding 17). A Postgres advisory lock or a `releases` row in state `publishing` serialises publishes per hotel for content and per project for code. A newer request supersedes a queued older one, and never the reverse.
2. **Migrate before deploy, never after.** Migrations are additive-first: add columns and tables, backfill set-based, switch code, then remove the old ones in a later release. So the running code always works on the migrated schema, as proven on 23 September when the old live code ran on the new `sites` columns.
3. **Re-apply RLS after every migration** (finding 9), as a step of the same job.
4. **Verify after publishing.** Fetch the live URL and check the release id stamped in the page (`<meta name="x-release">`) before marking the release `live`. A mismatch fails the release and triggers the rollback path.
5. **Rollback is a pointer move, not a rebuild.** Content: re-point the hotel's `current_release` to the previous immutable release, then purge that hotel's cache. Code: redeploy the previous artifact. Never downgrade Payload (finding 13); a bad upgrade is fixed forward or restored from backup.
6. **Everything is recorded.** The `releases` collection holds: who or what published (user, agent, job), inputs, a checksum of the rendered output, timings, and verification results. It is not deletable (already enforced).

## Flow — content release

```mermaid
sequenceDiagram
  participant S as Studio / agent
  participant P as Payload
  participant Q as Publish queue
  participant R as Renderer
  participant E as Edge (Makers)
  S->>P: publish(site)
  P->>Q: enqueue release (tenant, site, draft versions)
  Q->>Q: take per-site lock; drop superseded requests
  Q->>R: render pages of that site
  R->>E: write artifacts / purge site cache
  Q->>E: fetch live URL, check x-release
  Q->>P: release = live (or failed + rollback)
```

## What v0 implements (23 September)

Code: `apps/platform/src/releases/`, `src/jobs/publishSite.ts`, `src/app/(sites)/`. Tests: `tests/int/releases.int.spec.ts` (13) and `tests/int/site-http.int.spec.ts` (7).

| Rule | How v0 does it |
| --- | --- |
| 1. One publish at a time per hotel | A **lease lock on the site row** (`publish_locked_until`, `publish_locked_by`), taken with one atomic `UPDATE … WHERE lock is free or expired`. It works across processes and serverless instances, and a crashed worker's lease expires after 120 s. A site that is busy returns `busy`; the job retries with backoff |
| 1. Newer supersedes older, never the reverse | Every request takes the next **request sequence** number on the site. A publish that gets the lock but sees a newer sequence stops as `superseded`, without building anything. Proven with three concurrent requests: only the newest goes live, once |
| 4. Verify after publishing | The default verifier resolves the site exactly as the renderer does, checks it serves the new release id, and re-hashes the stored snapshot against its checksum. With `RELEASE_VERIFY_BASE_URL` set, it also fetches the public page and reads `<meta name="x-release">`. On any mismatch the pointer moves back automatically and the release is marked `failed` |
| 5. Rollback is a pointer move | `site.currentRelease` points at an immutable release. Rollback moves it to the most recent earlier release that went live, under the same lock. No rebuild |
| 6. Everything is recorded | Each release stores who published (`user:<id>`, `job`, `import-facts`), the request sequence, the snapshot, its sha256, page count, duration and verification time. Releases cannot be deleted, and a hook refuses any change to their content fields, even with access control bypassed |

What a release contains: the site settings, every **published** page in every locale, and the **confirmed** facts. Drafts, unconfirmed and rejected facts never enter a release, so the public site cannot show them.

Entry points: `POST /api/sites/:id/publish` (runs now; `?queue=1` queues the `publishSite` job) and `POST /api/sites/:id/rollback`. Both check the caller's own access to the site first, so another tenant's site answers 404.

Measured (local Postgres, 3 pages): publish 14–27 ms, rollback 16–18 ms. Gate 2 asks for under 60 s and under 10 s. On Neon Frankfurt with the app on Makers, measured from Paris: publish 3.1 s including an HTTP check of the public page through the edge, rollback 1.2 s (docs/05, findings 23–24).

v0 renders dynamically from the snapshot stored in Postgres (`/s/<site>/<page>`). That already gives immutability and pointer-move rollback. The open question below (ISR or static artifacts at the edge) is about moving the same snapshot closer to guests, not about correctness.

## Open questions

- Content-release rendering: ISR with on-demand revalidation per hotel (Next.js `revalidateTag`), or static artifacts per release? ISR is cheaper to build, while static artifacts make rollback a true pointer move. A spike in week 4 decides it by measuring both.
- Per-hotel cache purge on Makers: the API and its latency are unknown. This is part of the Tencent conversation.
- Where the publish queue runs: a Payload job (the pattern in `src/jobs/`, with the tenant in its input) is the default.
