import type { Payload } from 'payload'

/**
 * A release snapshot holds everything the renderer needs for one site, so serving a release
 * never reads live drafts: site settings, published pages (all locales), and confirmed facts.
 * Unconfirmed and rejected facts never enter a release (spec rule 9).
 */
export type Localized<T> = T | Record<string, T | null | undefined>

export type SnapshotBlock = {
  blockType: string
  id?: string | null
  heading?: Localized<string>
  subheading?: Localized<string>
  content?: Localized<unknown>
  provenance?: { origin?: string | null; sourceFact?: string | null } | null
}

export type SnapshotPage = {
  id: number
  slug: string
  title: Localized<string>
  blocks: SnapshotBlock[]
  seo?: { title?: Localized<string>; description?: Localized<string> } | null
}

export type SiteSnapshot = {
  schema: 1
  site: {
    id: number
    slug: string
    name: string
    brandName: string | null
    timezone: string | null
    enabledLocales: string[]
    defaultLocale: string
    theme: unknown
    booking: { engine: string; propertyCode: string | null; currency: string }
  }
  pages: SnapshotPage[]
  facts: { key: string; value: string }[]
}

export async function buildSnapshot(payload: Payload, tenantId: number, siteId: number): Promise<SiteSnapshot> {
  // Tenant is enforced in every query (jobs pattern): a site id from another tenant matches nothing.
  const sites = await payload.find({
    collection: 'sites',
    where: { and: [{ id: { equals: siteId } }, { tenant: { equals: tenantId } }] },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  const site = sites.docs[0]
  if (!site) throw new Error(`Site ${siteId} not found in tenant ${tenantId}`)

  const pages = await payload.find({
    collection: 'pages',
    where: { and: [{ site: { equals: siteId } }, { tenant: { equals: tenantId } }, { _status: { equals: 'published' } }] },
    locale: 'all',
    draft: false,
    depth: 0,
    pagination: false,
    sort: 'slug',
    overrideAccess: true,
  })

  const facts = await payload.find({
    collection: 'facts',
    where: {
      and: [
        { tenant: { equals: tenantId } },
        { status: { equals: 'confirmed' } },
        { or: [{ site: { equals: siteId } }, { site: { exists: false } }] },
      ],
    },
    depth: 0,
    pagination: false,
    sort: 'key',
    overrideAccess: true,
  })

  return {
    schema: 1,
    site: {
      id: Number(site.id),
      slug: site.slug,
      name: site.name,
      brandName: site.brandName ?? null,
      timezone: site.timezone ?? null,
      enabledLocales: (site.enabledLocales as string[] | null) ?? ['en'],
      defaultLocale: site.defaultLocale ?? 'en',
      theme: site.theme ?? null,
      booking: {
        engine: site.booking?.engine ?? 'none',
        propertyCode: site.booking?.propertyCode ?? null,
        currency: site.booking?.currency ?? 'EUR',
      },
    },
    pages: pages.docs.map((p) => ({
      id: Number(p.id),
      slug: p.slug,
      title: p.title as Localized<string>,
      blocks: ((p.blocks ?? []) as SnapshotBlock[]).map((b) => ({ ...b })),
      seo: (p.seo as SnapshotPage['seo']) ?? null,
    })),
    facts: facts.docs
      .map((f) => ({ key: f.key, value: f.value }))
      .sort((a, b) => a.key.localeCompare(b.key) || a.value.localeCompare(b.value)),
  }
}

/** Pick a localized value: requested locale, then the site default, then any non-empty value. */
export function pick<T>(v: Localized<T> | undefined | null, locale: string, fallback: string): T | undefined {
  if (v === null || v === undefined) return undefined
  if (typeof v !== 'object' || Array.isArray(v)) return v as T
  const rec = v as Record<string, T | null | undefined>
  const keys = Object.keys(rec)
  // A rich-text value is itself an object ({ root: ... }); only treat locale-keyed objects as localized.
  if (!keys.every((k) => /^[a-z]{2}(-[A-Z]{2})?$/.test(k))) return v as T
  return (rec[locale] ?? rec[fallback] ?? keys.map((k) => rec[k]).find((x) => x !== null && x !== undefined)) ?? undefined
}
