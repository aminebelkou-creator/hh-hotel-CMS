import { randomUUID } from 'node:crypto'
import type { Payload } from 'payload'
import { checksumOf } from './canonical'
import { poolOf } from './db'
import { buildSnapshot } from './snapshot'
import { loadLiveRelease } from './resolve'

/**
 * Content release pipeline v0 (design: docs/06-release-pipeline-design.md).
 *
 *   request  -> bump the site's request counter (seq), queue or run publishSite(seq)
 *   publish  -> take the site's lease lock; if a newer request exists, stop (superseded);
 *               snapshot published pages + confirmed facts -> immutable release + checksum;
 *               move site.currentRelease; verify what is served; mark live, or move the
 *               pointer back (automatic rollback) and mark the release failed
 *   rollback -> under the same lock, move the pointer to the previous release
 *
 * Every statement filters on the tenant from the input (the jobs pattern), so a request for
 * tenant A naming a tenant B site does nothing.
 */

export type PublishInput = { tenantId: number; siteId: number; seq: number; by?: string }
export type PublishOutcome = {
  outcome: 'live' | 'superseded' | 'busy' | 'failed'
  releaseId?: number
  version?: string
  checksum?: string
  durationMs: number
  error?: string
}
export type Verifier = (payload: Payload, release: { id: number; checksum: string; siteSlug: string }) => Promise<void>

const LEASE_SECONDS = 120

/** Lease lock on the site row. Works across processes and serverless instances. */
async function acquire(payload: Payload, tenantId: number, siteId: number, owner: string) {
  const r = await poolOf(payload).query(
    `update sites set publish_locked_until = now() + make_interval(secs => $3), publish_locked_by = $4
     where id = $1 and tenant_id = $2 and (publish_locked_until is null or publish_locked_until < now())
     returning id, slug, coalesce(publish_request_seq, 0)::int as seq, current_release_id`,
    [siteId, tenantId, LEASE_SECONDS, owner],
  )
  if (r.rows[0]) {
    const row = r.rows[0]
    return {
      ok: true as const,
      slug: String(row.slug),
      seq: Number(row.seq),
      current: row.current_release_id == null ? null : Number(row.current_release_id),
    }
  }
  const exists = await poolOf(payload).query(`select 1 from sites where id = $1 and tenant_id = $2`, [siteId, tenantId])
  if (!exists.rows[0]) throw new Error(`Site ${siteId} not found in tenant ${tenantId}`)
  return { ok: false as const }
}

async function release(payload: Payload, siteId: number, owner: string) {
  await poolOf(payload).query(
    `update sites set publish_locked_until = null, publish_locked_by = null where id = $1 and publish_locked_by = $2`,
    [siteId, owner],
  )
}

async function movePointer(payload: Payload, tenantId: number, siteId: number, releaseId: number | null) {
  const r = await poolOf(payload).query(
    `update sites set current_release_id = $3, updated_at = now() where id = $1 and tenant_id = $2`,
    [siteId, tenantId, releaseId],
  )
  if (r.rowCount !== 1) throw new Error('Pointer move matched no site')
}

const setStatus = (payload: Payload, id: number, data: Record<string, unknown>) =>
  payload.update({ collection: 'releases', id, data, overrideAccess: true, depth: 0 })

/**
 * Default verification: resolve the site exactly as the renderer does and check that it
 * serves this release, and that the stored snapshot still hashes to the recorded checksum.
 * When RELEASE_VERIFY_BASE_URL is set, also fetch the public page and check its x-release.
 */
export const defaultVerifier: Verifier = async (payload, rel) => {
  const live = await loadLiveRelease(payload, rel.siteSlug)
  if (!live || live.release.id !== rel.id) throw new Error(`Renderer resolves release ${live?.release.id ?? 'none'}, expected ${rel.id}`)
  if (checksumOf(live.release.storedSnapshot) !== rel.checksum) throw new Error('Stored snapshot does not match its checksum')
  const base = process.env.RELEASE_VERIFY_BASE_URL
  if (base) {
    const res = await fetch(`${base.replace(/\/$/, '')}/s/${rel.siteSlug}`, { cache: 'no-store' })
    const html = await res.text()
    const served =
      html.match(/<meta[^>]*name="x-release"[^>]*content="([^"]+)"/)?.[1] ??
      html.match(/<meta[^>]*content="([^"]+)"[^>]*name="x-release"/)?.[1] ??
      null
    if (!res.ok || served !== String(rel.id)) throw new Error(`Public page serves x-release ${served ?? 'none'} (HTTP ${res.status})`)
  }
}

export async function publishSite(payload: Payload, input: PublishInput, verify: Verifier = defaultVerifier): Promise<PublishOutcome> {
  const t0 = Date.now()
  const owner = `publish:${input.seq}:${randomUUID()}`
  const lock = await acquire(payload, input.tenantId, input.siteId, owner)
  if (!lock.ok) return { outcome: 'busy', durationMs: Date.now() - t0 }
  try {
    if (lock.seq > input.seq) return { outcome: 'superseded', durationMs: Date.now() - t0 }

    const snapshot = await buildSnapshot(payload, input.tenantId, input.siteId)
    const checksum = checksumOf(snapshot)
    const count = await payload.count({
      collection: 'releases',
      where: { and: [{ site: { equals: input.siteId } }, { tenant: { equals: input.tenantId } }] },
      overrideAccess: true,
    })
    const version = `r${count.totalDocs + 1}`
    const rel = await payload.create({
      collection: 'releases',
      data: {
        tenant: input.tenantId,
        site: input.siteId,
        version,
        status: 'built',
        templateVersion: 'renderer-v0',
        requestSeq: input.seq,
        publishedBy: input.by ?? 'job',
        checksum,
        pageCount: snapshot.pages.length,
        snapshot: snapshot as unknown as Record<string, unknown>,
      },
      overrideAccess: true,
      depth: 0,
    })
    const releaseId = Number(rel.id)
    await movePointer(payload, input.tenantId, input.siteId, releaseId)

    try {
      await verify(payload, { id: releaseId, checksum, siteSlug: lock.slug })
    } catch (e) {
      // Automatic rollback: the pointer goes back to what was live before.
      await movePointer(payload, input.tenantId, input.siteId, lock.current)
      const error = e instanceof Error ? e.message : String(e)
      await setStatus(payload, releaseId, { status: 'failed', error, durationMs: Date.now() - t0 })
      return { outcome: 'failed', releaseId, version, checksum, error, durationMs: Date.now() - t0 }
    }

    const durationMs = Date.now() - t0
    await setStatus(payload, releaseId, { status: 'live', verifiedAt: new Date().toISOString(), durationMs })
    if (lock.current && lock.current !== releaseId) await setStatus(payload, lock.current, { status: 'superseded' })
    return { outcome: 'live', releaseId, version, checksum, durationMs }
  } finally {
    await release(payload, input.siteId, owner)
  }
}

/** Records a publish request and returns its sequence number. Newer requests supersede older ones. */
export async function nextPublishSeq(payload: Payload, tenantId: number, siteId: number): Promise<number> {
  const r = await poolOf(payload).query(
    `update sites set publish_request_seq = coalesce(publish_request_seq, 0) + 1 where id = $1 and tenant_id = $2 returning publish_request_seq::int as seq`,
    [siteId, tenantId],
  )
  if (!r.rows[0]) throw new Error(`Site ${siteId} not found in tenant ${tenantId}`)
  return Number(r.rows[0].seq)
}

export type RollbackOutcome = {
  outcome: 'rolled-back' | 'nothing-to-roll-back' | 'busy'
  from?: string
  to?: string
  durationMs: number
}

/** Rollback is a pointer move to the most recent earlier release that went live. No rebuild. */
export async function rollbackSite(payload: Payload, input: { tenantId: number; siteId: number; by?: string }): Promise<RollbackOutcome> {
  const t0 = Date.now()
  const owner = `rollback:${randomUUID()}`
  const lock = await acquire(payload, input.tenantId, input.siteId, owner)
  if (!lock.ok) return { outcome: 'busy', durationMs: Date.now() - t0 }
  try {
    if (!lock.current) return { outcome: 'nothing-to-roll-back', durationMs: Date.now() - t0 }
    const current = await payload.findByID({ collection: 'releases', id: lock.current, depth: 0, overrideAccess: true })
    const previous = await payload.find({
      collection: 'releases',
      where: {
        and: [
          { site: { equals: input.siteId } },
          { tenant: { equals: input.tenantId } },
          { status: { equals: 'superseded' } },
          { id: { less_than: lock.current } },
        ],
      },
      sort: '-id',
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const target = previous.docs[0]
    if (!target) return { outcome: 'nothing-to-roll-back', durationMs: Date.now() - t0 }
    await movePointer(payload, input.tenantId, input.siteId, Number(target.id))
    await setStatus(payload, Number(current.id), { status: 'rolled-back' })
    await setStatus(payload, Number(target.id), { status: 'live' })
    return { outcome: 'rolled-back', from: current.version, to: target.version, durationMs: Date.now() - t0 }
  } finally {
    await release(payload, input.siteId, owner)
  }
}
