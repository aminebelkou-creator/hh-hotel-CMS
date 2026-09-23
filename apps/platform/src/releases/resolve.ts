import type { Payload } from 'payload'
import type { SiteSnapshot } from './snapshot'

export type LiveRelease = {
  site: { id: number; slug: string; status: string | null }
  release: { id: number; version: string; checksum: string; status: string | null; snapshot: SiteSnapshot }
}

/**
 * What the public renderer serves for a site slug: the release the site's pointer names.
 * Public by nature (anyone can view a published hotel site), so it reads with overrideAccess
 * and returns only the immutable snapshot, never drafts or other tenants' data. Suspended
 * sites and sites with no release serve nothing.
 */
export async function loadLiveRelease(payload: Payload, siteSlug: string): Promise<LiveRelease | null> {
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(siteSlug)) return null
  const sites = await payload.find({
    collection: 'sites',
    where: { slug: { equals: siteSlug } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  const site = sites.docs[0]
  if (!site || site.status === 'suspended' || !site.currentRelease) return null
  const releaseId = typeof site.currentRelease === 'object' ? site.currentRelease.id : site.currentRelease
  const rel = await payload
    .findByID({ collection: 'releases', id: releaseId, depth: 0, overrideAccess: true })
    .catch(() => null)
  if (!rel || !rel.snapshot) return null
  // Defence in depth: the release must belong to the same tenant as the site.
  const relTenant = typeof rel.tenant === 'object' && rel.tenant ? rel.tenant.id : rel.tenant
  const siteTenant = typeof site.tenant === 'object' && site.tenant ? site.tenant.id : site.tenant
  if (relTenant !== siteTenant) return null
  return {
    site: { id: Number(site.id), slug: site.slug, status: site.status ?? null },
    release: {
      id: Number(rel.id),
      version: rel.version,
      checksum: rel.checksum ?? '',
      status: rel.status ?? null,
      snapshot: rel.snapshot as unknown as SiteSnapshot,
    },
  }
}
