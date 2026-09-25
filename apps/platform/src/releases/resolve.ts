import type { Payload } from 'payload'
import type { SiteSnapshot } from './snapshot'
import { poolOf } from './db'

export type LiveRelease = {
  /** primaryHost: the hotel's own verified primary domain, if any; canonical URLs point there. */
  site: { id: number; slug: string; status: string | null; primaryHost: string | null }
  release: { id: number; version: string; checksum: string; status: string | null; snapshot: SiteSnapshot; storedSnapshot: unknown }
}

/**
 * Releases are immutable, so a loaded snapshot is kept in memory for the life of the process
 * (bounded); the site's pointer is still read on every request, so publish and rollback are
 * instant at the origin.
 */
const RELEASES = new Map<number, { snapshot: SiteSnapshot; stored: unknown; version: string; checksum: string; status: string | null; tenant: number | null }>()
const RELEASE_CACHE_MAX = 300

/** Only domains our team has verified are served: a tenant can add a hostname, not claim it. */
const SERVED = ['verified', 'active']

/**
 * What the public renderer serves for a site slug: the release the site's pointer names.
 * Public by nature (anyone can view a published hotel site), so it reads through the pool (one
 * round trip; no access control, like overrideAccess)
 * and returns only the immutable snapshot, never drafts or other tenants' data. Suspended
 * sites and sites with no release serve nothing.
 */
export async function loadLiveRelease(payload: Payload, siteSlug: string): Promise<LiveRelease | null> {
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(siteSlug)) return null
  const r = await poolOf(payload).query(`${SITE_SQL} where s.slug = $1 limit 1`.replace('dd.hostname as matched_host', 'null as matched_host'), [siteSlug])
  return liveReleaseOf(payload, rowToSite(r.rows[0]))
}

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
  const r = await poolOf(payload).query(
    `${SITE_SQL} join domains dd on dd.site_id = s.id and dd.hostname = any($1::text[]) and dd.status::text = any($2::text[]) order by (dd.hostname = $3) desc limit 1`,
    [[h, twin], SERVED, h],
  )
  const row = r.rows[0]
  if (!row) return { live: null, redirectTo: null }
  // The twin exists but not the exact host: redirect rather than serve under two names.
  const exactHost = String(row.matched_host ?? '')
  if (exactHost !== h) return { live: null, redirectTo: exactHost || twin }
  return { live: await liveReleaseOf(payload, rowToSite(row)), redirectTo: null }
}

/**
 * One round trip for the public path: the site's pointer, tenant and primary domain.
 * (Payload's find would cost two queries per collection and three collections.)
 */
const SITE_SQL = `select s.id, s.slug, s.status, s.tenant_id, s.current_release_id, s.design_channel,
  (select d.hostname from domains d where d.site_id = s.id and d."primary" = true and d.status in ('verified','active') order by d.id limit 1) as primary_host,
  dd.hostname as matched_host
  from sites s`

function rowToSite(row: Record<string, unknown> | undefined): SiteRow | null {
  if (!row) return null
  return {
    id: Number(row.id),
    slug: String(row.slug),
    status: (row.status as string | null) ?? null,
    tenant: row.tenant_id == null ? null : Number(row.tenant_id),
    currentRelease: row.current_release_id == null ? null : Number(row.current_release_id),
    primaryHost: (row.primary_host as string | null)?.toLowerCase() ?? null,
    designChannel: (row.design_channel as string | null) ?? 'stable',
  }
}

type SiteRow = { id: number; slug: string; status: string | null; tenant: number | null; currentRelease: number | null; primaryHost: string | null; designChannel: string }

async function liveReleaseOf(payload: Payload, site: SiteRow | null): Promise<LiveRelease | null> {
  if (!site || site.status === 'suspended' || !site.currentRelease) return null
  const releaseId = site.currentRelease
  let cached = RELEASES.get(releaseId)
  if (!cached) {
    const r = await poolOf(payload).query(`select id, version, checksum, status, tenant_id, snapshot from releases where id = $1`, [releaseId])
    const rel = r.rows[0]
    if (!rel || !rel.snapshot) return null
    cached = {
      snapshot: upgradeSnapshot(rel.snapshot),
      stored: rel.snapshot,
      version: String(rel.version),
      checksum: String(rel.checksum ?? ''),
      status: (rel.status as string | null) ?? null,
      tenant: rel.tenant_id == null ? null : Number(rel.tenant_id),
    }
    if (RELEASES.size >= RELEASE_CACHE_MAX) RELEASES.delete(RELEASES.keys().next().value as number)
    RELEASES.set(releaseId, cached)
  }
  // Defence in depth: the release must belong to the same tenant as the site.
  if (cached.tenant !== site.tenant) return null
  return {
    site: { id: site.id, slug: site.slug, status: site.status, primaryHost: site.primaryHost },
    release: {
      id: releaseId,
      version: cached.version,
      checksum: cached.checksum,
      status: cached.status,
      // A fresh copy per request: the renderer sets basePath on it (render-time only).
      snapshot: { ...cached.snapshot, site: { ...cached.snapshot.site, designChannel: site.designChannel } },
      storedSnapshot: cached.stored,
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
    mapImage: s.mapImage ?? null,
    images: s.images ?? {},
    posts: s.posts ?? [],
    reviews: s.reviews ?? [],
    redirects: s.redirects ?? [],
    forms: s.forms ?? [],
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
