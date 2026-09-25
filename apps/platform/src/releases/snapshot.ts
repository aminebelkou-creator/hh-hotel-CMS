import type { Payload } from 'payload'
import { packs } from '../packs'
import { ensureStaticMap } from '../media/static-map'

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
  seo?: { title?: Localized<string>; description?: Localized<string>; image?: Localized<string> | null } | null
}

export type SnapshotRedirect = { from: string; to: string; permanent: boolean }
export type SnapshotFormField = { blockType: string; name: string; label?: string | null; required?: boolean | null; width?: number | null; defaultValue?: unknown; options?: { label: string; value: string }[]; message?: unknown }
export type SnapshotForm = {
  id: number
  title: string
  fields: SnapshotFormField[]
  submitButtonLabel?: string | null
  confirmationType?: string | null
  confirmationMessage?: unknown
  redirectUrl?: string | null
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
    /** Render-time only, never stored: '' when served on the hotel's own domain, else /s/<slug>. */
    basePath?: string
    /** Render-time only (set by resolve.ts from the site row): 'canary' sites get template changes first. */
    designChannel?: string
  }
  /** Static map image for the map block (made at publish from confirmed coordinates), or null. */
  mapImage?: string | null
  /** Old-site paths redirected to pages of this site (redirects plugin). */
  redirects?: SnapshotRedirect[]
  /** Form definitions referenced by form blocks, so the site renders them without the CMS. */
  forms?: SnapshotForm[]
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

  // The map block shows a static image instead of a third-party embed: make it now if the
  // release has confirmed coordinates and a map block anywhere.
  const factValue = (key: string) => facts.docs.find((f) => f.key === key)?.value
  const lat = Number(factValue('geo.lat'))
  const lon = Number(factValue('geo.lon'))
  const mapBlock = pages.docs.flatMap((pg) => ((pg as { blocks?: SnapshotBlock[] }).blocks ?? [])).find((b) => b.blockType === 'map')
  const mapImage = mapBlock && Number.isFinite(lat) && Number.isFinite(lon) && lat ? await ensureStaticMap(payload, lat, lon, Number(mapBlock.zoom) || 16) : null

  const s = site as unknown as Record<string, unknown>
  const cta = (s.cta ?? {}) as { label?: Localized<string>; href?: string }
  // Localized fields come back as { en, fr } objects with locale 'all'; plain fields as values.
  const plain = <T,>(v: unknown): T => v as T
  // Redirects of this site: a page reference becomes that page's path.
  const redirectDocs = await payload.find({
    collection: 'redirects',
    where: { and: [{ site: { equals: siteId } }, { tenant: { equals: tenantId } }] },
    depth: 0,
    pagination: false,
    overrideAccess: true,
  })
  const pageById = new Map(pages.docs.map((p) => [Number(p.id), String(p.slug)]))
  const redirects: SnapshotRedirect[] = redirectDocs.docs.flatMap((r) => {
    const to = (r as { to?: { type?: string; url?: string | null; reference?: { value?: unknown } | null } }).to
    const ref = to?.reference?.value
    const refId = typeof ref === 'object' && ref ? (ref as { id: number }).id : ref
    const target = to?.type === 'reference' ? pageById.get(Number(refId)) : to?.url
    if (!target) return []
    return [{ from: String(r.from), to: to?.type === 'reference' ? (target === 'home' ? '/' : `/${target}`) : String(target), permanent: true }]
  })

  // Forms used by form blocks, and the images pages' metadata points at.
  const formIds = new Set<number>()
  const imageIds = new Set<number>()
  for (const pg of pages.docs as unknown as { blocks?: SnapshotBlock[]; meta?: { image?: unknown } }[]) {
    for (const b of pg.blocks ?? []) if (b.blockType === 'form' && b.form) formIds.add(Number(typeof b.form === 'object' ? (b.form as { id: number }).id : b.form))
    for (const id of imageIdsOf(pg.meta?.image)) imageIds.add(id)
  }
  const forms: SnapshotForm[] = formIds.size
    ? (
        await payload.find({ collection: 'forms', where: { and: [{ id: { in: [...formIds] } }, { tenant: { equals: tenantId } }] }, depth: 0, pagination: false, overrideAccess: true })
      ).docs.map((f) => toSnapshotForm(f))
    : []
  const images = imageIds.size
    ? (await payload.find({ collection: 'media', where: { and: [{ id: { in: [...imageIds] } }, { tenant: { equals: tenantId } }] }, depth: 0, pagination: false, overrideAccess: true })).docs
    : []
  const imageUrl = new Map(images.map((m) => [Number(m.id), (m as { sizes?: { hero?: { url?: string | null } }; url?: string | null }).sizes?.hero?.url || m.url || null]))

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
    pages: pages.docs.map((p) => toSnapshotPage(p, imageUrl)),
    mapImage,
    redirects,
    forms,
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

/** The SEO plugin's image is localized: with locale 'all' it is { en: id | doc, fr: … }. */
function imageIdsOf(v: unknown): number[] {
  if (v === null || v === undefined) return []
  const one = (x: unknown) => (x && typeof x === 'object' && 'id' in (x as object) ? Number((x as { id: number }).id) : Number(x))
  if (typeof v === 'object' && !('id' in (v as object))) return Object.values(v as Record<string, unknown>).map(one).filter((n) => Number.isFinite(n) && n > 0)
  const n = one(v)
  return Number.isFinite(n) && n > 0 ? [n] : []
}

function toSnapshotForm(f: unknown): SnapshotForm {
  const d = f as Record<string, unknown>
  return {
    id: Number(d.id),
    title: String(d.title ?? ''),
    fields: ((d.fields ?? []) as Record<string, unknown>[]).map((x) => ({
      blockType: String(x.blockType),
      name: String(x.name ?? ''),
      label: (x.label as string) ?? null,
      required: (x.required as boolean) ?? null,
      width: (x.width as number) ?? null,
      defaultValue: x.defaultValue,
      options: x.options as { label: string; value: string }[] | undefined,
      message: x.message,
    })),
    submitButtonLabel: (d.submitButtonLabel as string) ?? null,
    confirmationType: (d.confirmationType as string) ?? null,
    confirmationMessage: d.confirmationMessage,
    redirectUrl: ((d.redirect as { url?: string } | undefined)?.url as string) ?? null,
  }
}

/** A page document (read with locale 'all') as the renderer sees it. */
export function toSnapshotPage(p: unknown, imageUrl?: Map<number, string | null>): SnapshotPage {
  const d = p as Record<string, unknown>
  // Metadata comes from the SEO plugin's `meta` group (title, description, image).
  const meta = (d.meta ?? {}) as { title?: Localized<string>; description?: Localized<string>; image?: unknown }
  const urlOf = (x: unknown) => {
    const [id] = imageIdsOf(x)
    return id ? (imageUrl?.get(id) ?? null) : null
  }
  const image: Localized<string> | null =
    meta.image && typeof meta.image === 'object' && !('id' in (meta.image as object))
      ? Object.fromEntries(Object.entries(meta.image as Record<string, unknown>).map(([l, v]) => [l, urlOf(v)]))
      : urlOf(meta.image)
  const seo = { title: meta.title, description: meta.description, image }
  return {
    id: Number(d.id),
    slug: String(d.slug),
    title: d.title as Localized<string>,
    navLabel: (d.navLabel as Localized<string>) ?? null,
    navOrder: Number(d.navOrder ?? 0),
    showInNav: d.showInNav !== false,
    showInFooter: d.showInFooter === true,
    blocks: ((d.blocks ?? []) as SnapshotBlock[]).map((b) => ({ ...b })),
    seo,
  }
}
