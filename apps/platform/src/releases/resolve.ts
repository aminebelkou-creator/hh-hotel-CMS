import type { Payload } from 'payload'
import type { SiteSnapshot } from './snapshot'

export type LiveRelease = {
  /** primaryHost: the hotel's own verified primary domain, if any; canonical URLs point there. */
  site: { id: number; slug: string; status: string | null; primaryHost: string | null }
  release: { id: number; version: string; checksum: string; status: string | null; snapshot: SiteSnapshot; storedSnapshot: unknown }
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
  return liveReleaseOf(payload, sites.docs[0])
}

/** Only domains our team has verified are served: a tenant can add a hostname, not claim it. */
const SERVED = ['verified', 'active']

/**
 * The site served on a hotel's own domain: the verified domains row for that hostname. If
 * only the www/apex twin exists, the caller redirects there (`redirectTo`).
 */
export async function loadLiveReleaseByHost(
  payload: Payload,
  host: string,
): Promise<{ live: LiveRelease | null; redirectTo: string | null }> {
  const h = host.toLowerCase().replace(/:\d+$/, '')
  const twin = h.startsWith('www.') ? h.slice(4) : `www.${h}`
  const domains = await payload.find({
    collection: 'domains',
    where: { and: [{ hostname: { in: [h, twin] } }, { status: { in: SERVED } }] },
    depth: 0,
    limit: 2,
    overrideAccess: true,
  })
  const exact = domains.docs.find((d) => d.hostname.toLowerCase() === h)
  const other = domains.docs.find((d) => d.hostname.toLowerCase() === twin)
  if (!exact) return { live: null, redirectTo: other ? twin : null }
  const siteId = typeof exact.site === 'object' ? exact.site.id : exact.site
  const site = await payload.findByID({ collection: 'sites', id: siteId, depth: 0, overrideAccess: true }).catch(() => null)
  return { live: await liveReleaseOf(payload, site), redirectTo: null }
}

type SiteDoc = { id: number | string; slug: string; status?: string | null; currentRelease?: unknown; tenant?: unknown }

async function liveReleaseOf(payload: Payload, site: SiteDoc | null | undefined): Promise<LiveRelease | null> {
  if (!site || site.status === 'suspended' || !site.currentRelease) return null
  const releaseId = (typeof site.currentRelease === 'object' && site.currentRelease ? (site.currentRelease as { id: number }).id : site.currentRelease) as number
  const rel = await payload
    .findByID({ collection: 'releases', id: releaseId, depth: 0, overrideAccess: true })
    .catch(() => null)
  if (!rel || !rel.snapshot) return null
  // Defence in depth: the release must belong to the same tenant as the site.
  const relTenant = typeof rel.tenant === 'object' && rel.tenant ? rel.tenant.id : rel.tenant
  const siteTenant = typeof site.tenant === 'object' && site.tenant ? (site.tenant as { id: number }).id : site.tenant
  if (relTenant !== siteTenant) return null
  const primary = await payload.find({
    collection: 'domains',
    where: { and: [{ site: { equals: site.id } }, { primary: { equals: true } }, { status: { in: SERVED } }] },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  return {
    site: { id: Number(site.id), slug: site.slug, status: site.status ?? null, primaryHost: primary.docs[0]?.hostname?.toLowerCase() ?? null },
    release: {
      id: Number(rel.id),
      version: rel.version,
      checksum: rel.checksum ?? '',
      status: rel.status ?? null,
      snapshot: upgradeSnapshot(rel.snapshot),
      storedSnapshot: rel.snapshot,
    },
  }
}

/**
 * Releases are immutable, so a rollback can land on a snapshot written by an older renderer.
 * Fill what later schemas added with neutral defaults instead of failing (schema 1 → 2:
 * site tagline, logo and header link, page menu fields, pack data).
 */
export function upgradeSnapshot(raw: unknown): SiteSnapshot {
  const s = (raw ?? {}) as Partial<SiteSnapshot> & { site?: Partial<SiteSnapshot['site']> }
  const site = (s.site ?? {}) as Partial<SiteSnapshot['site']>
  return {
    schema: 2,
    site: {
      id: Number(site.id ?? 0),
      slug: String(site.slug ?? ''),
      name: String(site.name ?? ''),
      brandName: site.brandName ?? null,
      tagline: site.tagline ?? null,
      logoUrl: site.logoUrl ?? null,
      timezone: site.timezone ?? null,
      enabledLocales: site.enabledLocales?.length ? site.enabledLocales : ['en'],
      defaultLocale: site.defaultLocale ?? 'en',
      theme: site.theme ?? null,
      template: site.template ?? 'maison',
      brand: site.brand ?? null,
      cta: { label: site.cta?.label ?? null, href: site.cta?.href ?? null },
    },
    pages: (s.pages ?? []).map((p) => ({
      ...p,
      navLabel: p.navLabel ?? null,
      navOrder: Number(p.navOrder ?? 0),
      showInNav: p.showInNav !== false,
      showInFooter: p.showInFooter === true,
      blocks: p.blocks ?? [],
    })),
    facts: s.facts ?? [],
    packs: s.packs ?? {},
  }
}
