import type { Payload } from 'payload'
import { packs } from '../packs'

/**
 * A release snapshot holds everything the renderer needs for one site, so serving a release
 * never reads live drafts: site settings, published pages (all locales), confirmed facts, and
 * what each vertical pack contributes (for hotels: the room types).
 * Unconfirmed and rejected facts never enter a release (spec rule 9).
 */
export type Localized<T> = T | Record<string, T | null | undefined>

export type SnapshotBlock = { blockType: string; id?: string | null } & Record<string, unknown>

export type SnapshotPage = {
  id: number
  slug: string
  title: Localized<string>
  navLabel?: Localized<string> | null
  navOrder: number
  showInNav: boolean
  showInFooter?: boolean
  blocks: SnapshotBlock[]
  seo?: { title?: Localized<string>; description?: Localized<string> } | null
}

export type SiteSnapshot = {
  schema: 2
  site: {
    id: number
    slug: string
    name: string
    brandName: string | null
    tagline: Localized<string> | null
    logoUrl: string | null
    timezone: string | null
    enabledLocales: string[]
    defaultLocale: string
    theme: unknown
    /** Design template id and the hotel's brand choices (design contract, docs/11). */
    template: string
    brand: Record<string, string | null> | null
    cta: { label: Localized<string> | null; href: string | null }
  }
  pages: SnapshotPage[]
  facts: { key: string; value: string }[]
  packs: Record<string, unknown>
}

export async function buildSnapshot(payload: Payload, tenantId: number, siteId: number): Promise<SiteSnapshot> {
  // Tenant is enforced in every query (jobs pattern): a site id from another tenant matches nothing.
  const sites = await payload.find({
    collection: 'sites',
    where: { and: [{ id: { equals: siteId } }, { tenant: { equals: tenantId } }] },
    locale: 'all',
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

  const packData: Record<string, unknown> = {}
  for (const p of packs) packData[p.name] = await p.snapshot(payload, tenantId)

  const s = site as unknown as Record<string, unknown>
  const cta = (s.cta ?? {}) as { label?: Localized<string>; href?: string }
  // Localized fields come back as { en, fr } objects with locale 'all'; plain fields as values.
  const plain = <T,>(v: unknown): T => v as T
  return {
    schema: 2,
    site: {
      id: Number(site.id),
      slug: site.slug,
      name: plain<string>(site.name),
      brandName: plain<string | null>(site.brandName ?? null),
      tagline: (s.tagline as Localized<string>) ?? null,
      logoUrl: (s.logoUrl as string) ?? null,
      timezone: site.timezone ?? null,
      enabledLocales: (site.enabledLocales as string[] | null) ?? ['en'],
      defaultLocale: site.defaultLocale ?? 'en',
      theme: site.theme ?? null,
      template: (s.template as string) || 'maison',
      brand: brandOf(s.brand),
      cta: { label: cta.label ?? null, href: cta.href ?? null },
    },
    pages: pages.docs.map(toSnapshotPage),
    facts: facts.docs
      .map((f) => ({ key: f.key, value: f.value }))
      .sort((a, b) => a.key.localeCompare(b.key) || a.value.localeCompare(b.value)),
    packs: packData,
  }
}

/** Only the brand fields the design contract knows, empty values dropped. */
export function brandOf(v: unknown): Record<string, string | null> | null {
  if (!v || typeof v !== 'object') return null
  const out: Record<string, string | null> = {}
  for (const k of ['accent', 'background', 'text', 'headingFont', 'bodyFont', 'corners']) {
    const x = (v as Record<string, unknown>)[k]
    if (typeof x === 'string' && x.trim()) out[k] = x.trim()
  }
  return Object.keys(out).length ? out : null
}

/** Pick a localized value: requested locale, then the site default, then any non-empty value. */
export function pick<T>(v: Localized<T> | undefined | null, locale: string, fallback: string): T | undefined {
  if (v === null || v === undefined) return undefined
  if (typeof v !== 'object' || Array.isArray(v)) return v as T
  const rec = v as Record<string, T | null | undefined>
  const keys = Object.keys(rec)
  // A rich-text value is itself an object ({ root: ... }); only treat locale-keyed objects as localized.
  if (!keys.length) return undefined // a localized field with no value in any locale
  if (!keys.every((k) => /^[a-z]{2}(-[A-Z]{2})?$/.test(k))) return v as T
  return (rec[locale] ?? rec[fallback] ?? keys.map((k) => rec[k]).find((x) => x !== null && x !== undefined)) ?? undefined
}

/** A page document (read with locale 'all') as the renderer sees it. */
export function toSnapshotPage(p: unknown): SnapshotPage {
  const d = p as Record<string, unknown>
  return {
    id: Number(d.id),
    slug: String(d.slug),
    title: d.title as Localized<string>,
    navLabel: (d.navLabel as Localized<string>) ?? null,
    navOrder: Number(d.navOrder ?? 0),
    showInNav: d.showInNav !== false,
    showInFooter: d.showInFooter === true,
    blocks: ((d.blocks ?? []) as SnapshotBlock[]).map((b) => ({ ...b })),
    seo: (d.seo as SnapshotPage['seo']) ?? null,
  }
}
