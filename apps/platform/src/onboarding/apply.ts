/**
 * Build (or rebuild) a hotel's site from its onboarding content, then optionally publish it.
 *
 *   pnpm exec tsx src/onboarding/apply.ts hotel-herse-dor [--publish] [--only=posts|--only=reviews]
 *
 * --only=posts writes the blog alone: the posts, the blog page, and a news block on the home
 * page when it has none (inserted in place, every other block and the owner's edits kept).
 *
 * Upserts the site settings, the room types and the pages listed in
 * src/onboarding/sites/<slug>.ts, in every locale. Pages and rooms not listed there are left
 * alone. Facts are not touched here (src/ingest/import-facts.ts owns them).
 *
 * Engineer-run system operation: uses overrideAccess and names the tenant on every write.
 */
import 'dotenv/config'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'
import { nextPublishSeq, publishSite } from '../releases/publish'
import type { BlockInput, L, OfferInput, PageInput, PostInput, RoomInput, SiteContent } from './types'
import { hotelHerseDor } from './sites/hotel-herse-dor'
import { mediaMap } from './import-images'

const SITES: Record<string, SiteContent> = { 'hotel-herse-dor': hotelHerseDor }

type Loc = 'fr' | 'en'
const v = (x: L | undefined, l: Loc) => (x ? x[l] : undefined)

export function blockData(b: BlockInput, l: Loc): Record<string, unknown> {
  const prov = { origin: 'human', sourceFact: 'onboarding' }
  switch (b.blockType) {
    case 'hero':
      return { blockType: 'hero', heading: v(b.heading, l), subheading: v(b.subheading, l), imageUrl: b.image?.url, imageAlt: v(b.image?.alt, l), ctaLabel: v(b.cta?.label, l), ctaHref: b.cta?.href, rating: b.rating ?? 'none', bookingBar: b.bookingBar ?? false, provenance: prov }
    case 'textImage':
      return { blockType: 'textImage', eyebrow: v(b.eyebrow, l), heading: v(b.heading, l), body: v(b.body, l), imageUrl: b.image?.url, imageAlt: v(b.image?.alt, l), imagePosition: b.imagePosition ?? 'right', points: (b.points ?? []).map((t) => ({ text: v(t, l) })), linkLabel: v(b.link?.label, l), linkHref: b.link?.href, provenance: prov }
    case 'features':
      return { blockType: 'features', heading: v(b.heading, l), intro: v(b.intro, l), items: b.items.map((i) => ({ icon: i.icon, title: v(i.title, l), text: v(i.text, l) })), provenance: prov }
    case 'banners':
      return { blockType: 'banners', eyebrow: v(b.eyebrow, l), heading: v(b.heading, l), items: b.items.map((i) => ({ imageUrl: i.image.url, imageAlt: v(i.image.alt, l), title: v(i.title, l), href: i.href })), provenance: prov }
    case 'mediaBand':
      return { blockType: 'mediaBand', imageUrl: b.image.url, imageAlt: v(b.image.alt, l), provenance: prov }
    case 'gallery':
      return { blockType: 'gallery', heading: v(b.heading, l), images: b.images.map((i) => ({ url: i.url, alt: v(i.alt, l) })) }
    case 'quote':
      return { blockType: 'quote', text: v(b.text, l), author: v(b.author, l) }
    case 'cta':
      return { blockType: 'cta', heading: v(b.heading, l), text: v(b.text, l), buttonLabel: v(b.button?.label, l), buttonHref: b.button?.href, imageUrl: b.image?.url, imageAlt: v(b.image?.alt, l) }
    case 'contact':
      return { blockType: 'contact', heading: v(b.heading, l), intro: v(b.intro, l) }
    case 'map':
      return { blockType: 'map', heading: v(b.heading, l), text: v(b.text, l), zoom: b.zoom ?? 16 }
    case 'rooms':
      return { blockType: 'rooms', heading: v(b.heading, l), intro: v(b.intro, l), limit: b.limit, layout: b.layout ?? 'cards', linkLabel: v(b.link?.label, l), linkHref: b.link?.href }
    case 'text':
      return { blockType: 'text', heading: v(b.heading, l), body: v(b.body, l), provenance: prov }
    case 'faq':
      return { blockType: 'faq', heading: v(b.heading, l), items: b.items.map((i) => ({ question: v(i.question, l), answer: v(i.answer, l) })), provenance: prov }
    case 'offers':
      return { blockType: 'offers', heading: v(b.heading, l), intro: v(b.intro, l), limit: b.limit }
    case 'reviews':
      return { blockType: 'reviews', heading: v(b.heading, l), intro: v(b.intro, l), limit: b.limit ?? 6, provenance: prov }
    case 'news':
      return { blockType: 'news', heading: v(b.heading, l), intro: v(b.intro, l), layout: b.layout ?? 'latest', limit: b.limit ?? 3, linkLabel: v(b.link?.label, l), linkHref: b.link?.href, provenance: prov }
    case 'policies':
      return { blockType: 'policies', heading: v(b.heading, l), showTimes: b.showTimes ?? true, items: b.items.map((i) => ({ title: v(i.title, l), text: v(i.text, l) })) }
  }
}

/**
 * Copies array-row ids from the stored document onto new data, index by index, so that a
 * second-locale update fills the same rows instead of replacing them (which would drop the
 * first locale's values).
 */
export function withIds<T>(data: T, stored: unknown): T {
  if (Array.isArray(data)) {
    const s = Array.isArray(stored) ? stored : []
    return data.map((row, i) => {
      const next = withIds(row, s[i])
      const id = (s[i] as { id?: unknown } | undefined)?.id
      return next && typeof next === 'object' && id !== undefined ? { ...next, id } : next
    }) as T
  }
  if (data && typeof data === 'object') {
    const st = (stored ?? {}) as Record<string, unknown>
    return Object.fromEntries(Object.entries(data).map(([k, val]) => [k, withIds(val, st[k])])) as T
  }
  return data
}

const pageData = (p: PageInput, l: Loc, siteId: number, tenantId: number) => ({
  title: v(p.title, l),
  slug: p.slug,
  site: siteId,
  tenant: tenantId,
  navLabel: v(p.navLabel, l),
  navOrder: p.navOrder,
  showInNav: p.showInNav ?? true,
  showInFooter: p.showInFooter ?? false,
  _status: 'published' as const,
  blocks: p.blocks.map((b) => blockData(b, l)),
  meta: { title: v(p.seo?.title, l), description: v(p.seo?.description, l) },
})

const roomData = (r: RoomInput, l: Loc, tenantId: number) => ({
  tenant: tenantId,
  slug: r.slug,
  order: r.order,
  category: r.category,
  name: v(r.name, l),
  summary: v(r.summary, l),
  description: v(r.description, l),
  sizeSqm: r.sizeSqm,
  maxOccupancy: r.maxOccupancy,
  bed: v(r.bed, l),
  view: v(r.view, l),
  features: r.features.map((f) => ({ label: v(f, l) })),
  images: r.images.map((i) => ({ url: i.url, alt: v(i.alt, l) })),
})

const offerData = (o: OfferInput, l: Loc, tenantId: number) => ({
  tenant: tenantId,
  slug: o.slug,
  order: o.order,
  active: true,
  title: v(o.title, l),
  highlight: v(o.highlight, l),
  summary: v(o.summary, l),
  conditions: v(o.conditions, l),
  validFrom: o.validFrom,
  validTo: o.validTo,
  imageUrl: o.image?.url,
  imageAlt: v(o.image?.alt, l),
  ctaLabel: v(o.cta?.label, l),
  ctaHref: o.cta?.href,
})

const postData = (p: PostInput, l: Loc, siteId: number, tenantId: number) => ({
  tenant: tenantId,
  site: siteId,
  slug: p.slug,
  status: 'published',
  publishedAt: p.publishedAt,
  title: v(p.title, l),
  excerpt: v(p.excerpt, l),
  body: v(p.body, l),
  imageUrl: p.image?.url,
  imageAlt: v(p.image?.alt, l),
  // Written by us from checked sources; an edit by the owner turns it `human` (Posts hook).
  provenance: { origin: 'generated', sourceFact: 'onboarding:blog' },
})

/** Writes a document in the first locale (replacing its structure), then fills the others. */
async function upsertLocalized(
  payload: Payload,
  collection: 'pages' | 'rooms' | 'offers' | 'posts',
  existingId: number | undefined,
  locales: Loc[],
  build: (l: Loc) => Record<string, unknown>,
) {
  const c = collection as 'pages'
  const [first, ...rest] = locales
  const doc = existingId
    ? await payload.update({ collection: c, id: existingId, locale: first, data: build(first) as never, overrideAccess: true, depth: 0 })
    : await payload.create({ collection: c, locale: first, data: build(first) as never, overrideAccess: true, depth: 0 })
  for (const l of rest) {
    const stored = await payload.findByID({ collection: c, id: doc.id, locale: first, depth: 0, overrideAccess: true, draft: true })
    await payload.update({ collection: c, id: doc.id, locale: l, data: withIds(build(l), stored) as never, overrideAccess: true, depth: 0 })
  }
  return Number(doc.id)
}

/** Replaces remote photo URLs by the platform's copies when they were imported (import-images.ts). */
function localizeImages<T>(value: T, map: Map<string, { full: string; card: string }>, card = false): T {
  if (Array.isArray(value)) return value.map((v) => localizeImages(v, map, card)) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, (k === 'url' || k === 'imageUrl') && typeof v === 'string' && map.has(v) ? map.get(v)![card ? 'card' : 'full'] : localizeImages(v, map, card)]),
    ) as T
  }
  return value
}

/** Blog posts of the site, upserted by slug (a post the owner edited is left alone). */
async function applyPosts(payload: Payload, content: SiteContent, siteId: number, tenantId: number, locales: Loc[], photos: Map<string, { full: string; card: string }>) {
  for (const p of content.posts ?? []) {
    const existing = (await payload.find({ collection: 'posts', where: { and: [{ tenant: { equals: tenantId } }, { site: { equals: siteId } }, { slug: { equals: p.slug } }] }, limit: 1, overrideAccess: true })).docs[0] as { id: number; provenance?: { origin?: string } } | undefined
    if (existing && existing.provenance?.origin === 'human') continue
    await upsertLocalized(payload, 'posts', existing ? Number(existing.id) : undefined, locales, (l) => localizeImages(postData(p, l, siteId, tenantId), photos))
  }
}

/**
 * Adds one of the home page's blocks when the live page has none of that type, right after the
 * first block of the `after` types found (else before the closing call to action), keeping every
 * other block, its ids and the owner's edits.
 */
async function ensureHomeBlock(payload: Payload, content: SiteContent, siteId: number, tenantId: number, locales: Loc[], type: BlockInput['blockType'], afterTypes: string[]) {
  const block = content.pages.find((p) => p.slug === 'home')?.blocks.find((b) => b.blockType === type)
  if (!block) return false
  const home = (await payload.find({ collection: 'pages', where: { and: [{ site: { equals: siteId } }, { tenant: { equals: tenantId } }, { slug: { equals: 'home' } }] }, limit: 1, overrideAccess: true, draft: true, depth: 0 })).docs[0]
  if (!home) return false
  const [first, ...rest] = locales
  // No locale fallback: writing back a fallback value would copy one language into the other.
  const stored = (l: Loc) => payload.findByID({ collection: 'pages', id: home.id, locale: l, fallbackLocale: false, depth: 0, overrideAccess: true, draft: false }) as Promise<{ blocks?: Record<string, unknown>[] }>
  const blocks0 = (await stored(first)).blocks ?? []
  if (blocks0.some((b) => b.blockType === type)) return false
  const after = Math.max(-1, ...afterTypes.map((a) => blocks0.findIndex((b) => b.blockType === a)).filter((x) => x >= 0).slice(0, 1))
  const cta = blocks0.findIndex((b) => b.blockType === 'cta')
  const at = after >= 0 ? after + 1 : cta >= 0 ? cta : blocks0.length
  const insert = (list: Record<string, unknown>[], l: Loc) => [...list.slice(0, at), blockData(block, l), ...list.slice(at)]
  await payload.update({ collection: 'pages', id: home.id, locale: first, data: { blocks: insert(blocks0, first), _status: 'published' } as never, overrideAccess: true, depth: 0, context: { generation: true } })
  const newId = ((await stored(first)).blocks ?? [])[at]?.id
  for (const l of rest) {
    const list = (await stored(l)).blocks ?? []
    const withNew = insert(list.filter((b) => b.id !== newId), l)
    withNew[at] = { ...withNew[at], id: newId }
    await payload.update({ collection: 'pages', id: home.id, locale: l, data: { blocks: withNew, _status: 'published' } as never, overrideAccess: true, depth: 0, context: { generation: true } })
  }
  return true
}

/**
 * Guest reviews exactly as the hotel gave them (never written by us). Matched by author and the
 * start of the text, so running again updates order/status without duplicating.
 */
async function applyReviews(payload: Payload, content: SiteContent, siteId: number, tenantId: number) {
  for (const r of content.reviews ?? []) {
    const found = (await payload.find({ collection: 'reviews', where: { and: [{ tenant: { equals: tenantId } }, { site: { equals: siteId } }, { author: { equals: r.author } }] }, limit: 50, overrideAccess: true })).docs.find((d) => String(d.text).slice(0, 60) === r.text.slice(0, 60))
    const data = { tenant: tenantId, site: siteId, status: 'published', order: r.order, text: r.text, language: r.language, author: r.author, origin: r.origin, source: r.source, sourceUrl: r.sourceUrl, rating: r.rating, ratingScale: r.ratingScale ?? (r.rating ? 5 : undefined), visitedAt: r.visitedAt }
    if (found) await payload.update({ collection: 'reviews', id: found.id, data: data as never, overrideAccess: true })
    else await payload.create({ collection: 'reviews', data: data as never, overrideAccess: true })
  }
}

/** The blog alone: posts, the blog page, the home page's news block. */
export async function applyBlog(payload: Payload, content: SiteContent) {
  const { tenantId, siteId, locales, photos } = await siteOf(payload, content)
  await applyPosts(payload, content, siteId, tenantId, locales, photos)
  const blogPages = content.pages.filter((p) => p.blocks.some((b) => b.blockType === 'news' && b.layout === 'list'))
  for (const p of blogPages) {
    const existing = (await payload.find({ collection: 'pages', where: { and: [{ site: { equals: siteId } }, { tenant: { equals: tenantId } }, { slug: { equals: p.slug } }] }, limit: 1, overrideAccess: true, draft: true })).docs[0]
    if (!existing) await upsertLocalized(payload, 'pages', undefined, locales, (l) => localizeImages(pageData(p, l, siteId, tenantId), photos))
  }
  const home = await ensureHomeBlock(payload, content, siteId, tenantId, locales, 'news', ['offers'])
  return { tenantId, siteId, posts: (content.posts ?? []).length, blogPages: blogPages.length, homeNewsAdded: home }
}

/** The reviews alone: the hotel's reviews and the home page's reviews block. */
export async function applyReviewsOnly(payload: Payload, content: SiteContent) {
  const { tenantId, siteId, locales } = await siteOf(payload, content)
  await applyReviews(payload, content, siteId, tenantId)
  const home = await ensureHomeBlock(payload, content, siteId, tenantId, locales, 'reviews', ['features', 'rooms'])
  return { tenantId, siteId, reviews: (content.reviews ?? []).length, homeReviewsAdded: home }
}

async function siteOf(payload: Payload, content: SiteContent) {
  const tenant = (await payload.find({ collection: 'tenants', where: { slug: { equals: content.tenant.slug } }, limit: 1, overrideAccess: true })).docs[0]
  if (!tenant) throw new Error(`Tenant ${content.tenant.slug} not found: run src/ingest/import-facts.ts first`)
  const tenantId = Number(tenant.id)
  const site = (await payload.find({ collection: 'sites', where: { and: [{ slug: { equals: content.site.slug } }, { tenant: { equals: tenantId } }] }, limit: 1, overrideAccess: true })).docs[0]
  if (!site) throw new Error(`Site ${content.site.slug} not found in tenant ${content.tenant.slug}`)
  const locales = [content.site.defaultLocale, ...content.site.enabledLocales.filter((l) => l !== content.site.defaultLocale)] as Loc[]
  return { tenantId, siteId: Number(site.id), locales, photos: await mediaMap(payload, tenantId) }
}

export async function applySite(payload: Payload, content: SiteContent) {
  const tenant = (await payload.find({ collection: 'tenants', where: { slug: { equals: content.tenant.slug } }, limit: 1, overrideAccess: true })).docs[0]
  if (!tenant) throw new Error(`Tenant ${content.tenant.slug} not found: run src/ingest/import-facts.ts first`)
  const tenantId = Number(tenant.id)
  const site = (await payload.find({ collection: 'sites', where: { and: [{ slug: { equals: content.site.slug } }, { tenant: { equals: tenantId } }] }, limit: 1, overrideAccess: true })).docs[0]
  if (!site) throw new Error(`Site ${content.site.slug} not found in tenant ${content.tenant.slug}`)
  const siteId = Number(site.id)
  const photos = await mediaMap(payload, tenantId)
  const locales = [content.site.defaultLocale, ...content.site.enabledLocales.filter((l) => l !== content.site.defaultLocale)] as Loc[]

  for (const l of locales) {
    await payload.update({
      collection: 'sites',
      id: siteId,
      locale: l,
      data: {
        name: content.site.name,
        brandName: content.site.brandName,
        tagline: v(content.site.tagline, l),
        logoUrl: content.site.logoUrl,
        enabledLocales: content.site.enabledLocales,
        defaultLocale: content.site.defaultLocale,
        cta: { label: v(content.site.cta.label, l), href: content.site.cta.href },
      } as never,
      overrideAccess: true,
    })
  }

  for (const r of content.rooms) {
    const existing = (await payload.find({ collection: 'rooms' as 'pages', where: { and: [{ tenant: { equals: tenantId } }, { slug: { equals: r.slug } }] }, limit: 1, overrideAccess: true })).docs[0]
    await upsertLocalized(payload, 'rooms', existing ? Number(existing.id) : undefined, locales, (l) => localizeImages(roomData(r, l, tenantId), photos))
  }

  for (const o of content.offers ?? []) {
    const existing = (await payload.find({ collection: 'offers' as 'pages', where: { and: [{ tenant: { equals: tenantId } }, { slug: { equals: o.slug } }] }, limit: 1, overrideAccess: true })).docs[0]
    await upsertLocalized(payload, 'offers', existing ? Number(existing.id) : undefined, locales, (l) => localizeImages(offerData(o, l, tenantId), photos))
  }

  await applyPosts(payload, content, siteId, tenantId, locales, photos)
  await applyReviews(payload, content, siteId, tenantId)

  for (const p of content.pages) {
    const existing = (await payload.find({ collection: 'pages', where: { and: [{ site: { equals: siteId } }, { tenant: { equals: tenantId } }, { slug: { equals: p.slug } }] }, limit: 1, overrideAccess: true, draft: true })).docs[0]
    await upsertLocalized(payload, 'pages', existing ? Number(existing.id) : undefined, locales, (l) => localizeImages(pageData(p, l, siteId, tenantId), photos))
  }
  return { tenantId, siteId, rooms: content.rooms.length, pages: content.pages.length, photos: photos.size }
}

const isMain = process.argv[1] && /onboarding[\\/]apply\.ts$/.test(process.argv[1])
if (isMain) {
  const slug = process.argv[2]
  const run = async () => {
    const content = SITES[slug]
    if (!content) throw new Error(`Usage: apply.ts <${Object.keys(SITES).join('|')}> [--publish]`)
    const payload = await getPayload({ config })
    const t0 = Date.now()
    const r = process.argv.includes('--only=posts') ? await applyBlog(payload, content) : process.argv.includes('--only=reviews') ? await applyReviewsOnly(payload, content) : await applySite(payload, content)
    console.log(`applied ${slug}: ${JSON.stringify(r)} in ${Date.now() - t0} ms`)
    if (process.argv.includes('--publish')) {
      const seq = await nextPublishSeq(payload, r.tenantId, r.siteId)
      console.log(`publish: ${JSON.stringify(await publishSite(payload, { tenantId: r.tenantId, siteId: r.siteId, seq, by: 'onboarding' }))}`)
    }
    process.exit(0)
  }
  run().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
