/**
 * Generation: draft a hotel's pages and room types from its CONFIRMED facts (rule 9).
 *
 * - Writes drafts only; nothing is published (the hotelier publishes from the Website panel).
 * - Every block it writes is marked provenance `generated` with a slot name
 *   (gen:<page>:<block>). Running again rewrites only slots still marked `generated`;
 *   blocks a person edited (`human`) or locked are left in place (rule 7).
 * - Room types are created once from `room.*` facts and never overwritten.
 * - With a model configured, the copy is written by the model from the same facts and
 *   checked against them; without one, deterministic copy from src/generate/copy.ts.
 *
 * Runs after an endpoint has checked the caller's access to the site; every query filters on
 * the explicit tenantId (jobs pattern).
 */
import type { Payload, TypedLocale } from 'payload'
import { getAi } from '../ai/provider'
import { all, defaultCopy, first, PAGE_SLUGS, slugify, type FactMap, type Locale, type SiteCopy } from './copy'
import { LEGAL_SLUGS, legalCopy, type LegalKind } from './legal'

export type GenerateResult = {
  locale: Locale
  facts: number
  rooms: { created: number; kept: number }
  pages: { slug: string; created: boolean; generated: number; kept: number }[]
  model: string | null
}

type Block = Record<string, unknown> & { blockType: string; provenance?: { origin?: string | null; sourceFact?: string | null } | null; id?: string | null }
const GEN = { generation: true }

export async function loadConfirmedFacts(payload: Payload, tenantId: number, siteId: number): Promise<FactMap> {
  const res = await payload.find({
    collection: 'facts',
    where: { and: [{ tenant: { equals: tenantId } }, { status: { equals: 'confirmed' } }, { or: [{ site: { equals: siteId } }, { site: { exists: false } }] }] },
    limit: 1000,
    sort: '-confidence',
    overrideAccess: true,
  })
  const map: FactMap = new Map()
  for (const f of res.docs) {
    const list = map.get(f.key) ?? []
    if (!list.includes(f.value)) list.push(f.value)
    map.set(f.key, list)
  }
  return map
}

const COPY_SYSTEM = `You write short, warm, factual website copy for an independent hotel, in the language asked.
Use ONLY the facts given. Never invent amenities, prices, distances, awards or history. No superlatives you cannot back with a fact.
Answer with JSON of exactly the same shape as the draft you receive, keeping the keys; improve the wording, keep it brief (headings under 8 words, paragraphs under 60 words).`

async function copyFor(f: FactMap, locale: Locale, hotelName: string): Promise<{ copy: SiteCopy; model: string | null }> {
  const draft = defaultCopy(f, locale, hotelName)
  const ai = getAi()
  if (!ai.available) return { copy: draft, model: null }
  try {
    const facts = Object.fromEntries([...f.entries()].map(([k, v]) => [k, v.slice(0, 8)]))
    const out = (await ai.complete({
      system: COPY_SYSTEM,
      prompt: `Language: ${locale}\nHotel: ${hotelName}\nFacts (confirmed by the hotel):\n${JSON.stringify(facts, null, 1)}\n\nDraft to improve:\n${JSON.stringify(draft, null, 1)}`,
      json: true,
      maxTokens: 1800,
    })) as Partial<SiteCopy> | null
    if (!out || typeof out !== 'object') return { copy: draft, model: ai.model }
    // Keep the shape: only strings the draft already has, never new claims about numbers we cannot check.
    const merged = structuredClone(draft) as unknown as Record<string, Record<string, string | undefined>>
    for (const page of Object.keys(merged)) {
      const o = (out as Record<string, Record<string, unknown>>)[page]
      if (!o || typeof o !== 'object') continue
      for (const key of Object.keys(merged[page])) {
        const v = o[key]
        if (typeof v === 'string' && v.trim() && !hasUnbackedNumbers(v, f)) merged[page][key] = v.trim()
      }
    }
    return { copy: merged as unknown as SiteCopy, model: ai.model }
  } catch {
    return { copy: draft, model: ai.model }
  }
}

/** A number in the prose that appears in no confirmed fact is a hallucination risk: refuse it. */
export function hasUnbackedNumbers(text: string, f: FactMap): boolean {
  const known = new Set([...f.values()].flat().flatMap((v) => v.match(/\d+/g) ?? []))
  return (text.match(/\d+/g) ?? []).some((n) => !known.has(n))
}

const gen = (slot: string, block: Record<string, unknown>): Block => ({ ...block, provenance: { origin: 'generated', sourceFact: slot } }) as Block

function pageBlocks(kind: keyof typeof PAGE_SLUGS, copy: SiteCopy, f: FactMap, locale: Locale): Block[] {
  const fr = locale === 'fr'
  const booking = first(f, 'booking.url')
  const contactSlug = PAGE_SLUGS.contact[locale]
  const roomsSlug = PAGE_SLUGS.rooms[locale]
  if (kind === 'home') {
    const amenities = all(f, 'amenity')
    return [
      gen('gen:home:hero', { blockType: 'hero', heading: copy.home.heading, subheading: copy.home.subheading, ctaLabel: copy.home.cta, ctaHref: booking ?? contactSlug }),
      gen('gen:home:about', { blockType: 'text', heading: copy.home.aboutHeading, body: copy.home.about }),
      ...(amenities.length
        ? [gen('gen:home:features', { blockType: 'features', heading: copy.home.featuresHeading, items: amenities.slice(0, 6).map((a) => ({ title: amenityTitle(a, locale) })) })]
        : []),
      gen('gen:home:rooms', { blockType: 'rooms', heading: copy.rooms.heading, layout: 'cards', limit: 3, linkLabel: fr ? 'Toutes les chambres' : 'All the rooms', linkHref: roomsSlug }),
      // Offers on the home page: the block renders nothing while the hotel has no active offer.
      gen('gen:home:offers', { blockType: 'offers', heading: fr ? 'Offres du moment' : 'Special offers', limit: 3 }),
      gen('gen:home:cta', { blockType: 'cta', heading: copy.home.cta, text: fr ? 'Le meilleur tarif est ici, en direct.' : 'The best rate is here, direct.', buttonLabel: copy.home.cta, buttonHref: booking ?? contactSlug }),
    ]
  }
  if (kind === 'rooms') {
    return [
      gen('gen:rooms:hero', { blockType: 'hero', heading: copy.rooms.heading, subheading: copy.rooms.intro }),
      gen('gen:rooms:rooms', { blockType: 'rooms', layout: 'detailed' }),
      gen('gen:rooms:offers', { blockType: 'offers', heading: fr ? 'Offres' : 'Offers' }),
      gen('gen:rooms:cta', { blockType: 'cta', heading: copy.home.cta, buttonLabel: copy.home.cta, buttonHref: booking ?? contactSlug }),
    ]
  }
  if (kind === 'services') {
    const services = all(f, 'service')
    const policies = [
      ...(first(f, 'policy.pets') ? [{ title: fr ? 'Animaux' : 'Pets', text: first(f, 'policy.pets')! }] : []),
      ...(first(f, 'policy.children') ? [{ title: fr ? 'Enfants' : 'Children', text: first(f, 'policy.children')! }] : []),
      ...(first(f, 'policy.cancellation') ? [{ title: fr ? 'Annulation' : 'Cancellation', text: first(f, 'policy.cancellation')! }] : []),
      ...(first(f, 'policy.payment') ? [{ title: fr ? 'Paiement' : 'Payment', text: first(f, 'policy.payment')! }] : []),
      ...(first(f, 'policy.smoking') ? [{ title: fr ? 'Fumeurs' : 'Smoking', text: first(f, 'policy.smoking')! }] : []),
      ...(first(f, 'parking') ? [{ title: 'Parking', text: first(f, 'parking')! }] : []),
      ...(first(f, 'breakfast.hours') ? [{ title: fr ? 'Petit-déjeuner' : 'Breakfast', text: [first(f, 'breakfast.hours'), first(f, 'breakfast.price')].filter(Boolean).join(' · ') }] : []),
    ]
    return [
      gen('gen:services:hero', { blockType: 'hero', heading: copy.services.heading, subheading: copy.services.intro }),
      ...(services.length ? [gen('gen:services:list', { blockType: 'features', heading: copy.services.heading, items: services.slice(0, 12).map((s) => ({ title: s })) })] : []),
      gen('gen:services:policies', { blockType: 'policies', heading: copy.services.policiesHeading, showTimes: true, items: policies }),
    ]
  }
  const hasGeo = Boolean(first(f, 'geo.lat') && first(f, 'geo.lon'))
  return [
    gen('gen:contact:hero', { blockType: 'hero', heading: copy.contact.heading, subheading: copy.contact.intro }),
    gen('gen:contact:contact', { blockType: 'contact', heading: copy.contact.heading }),
    ...(copy.contact.access ? [gen('gen:contact:access', { blockType: 'text', heading: copy.contact.accessHeading, body: copy.contact.access })] : []),
    ...(hasGeo ? [gen('gen:contact:map', { blockType: 'map', heading: fr ? 'Plan' : 'Map', zoom: 16 })] : []),
    gen('gen:contact:rooms-link', { blockType: 'cta', heading: copy.rooms.heading, buttonLabel: fr ? 'Voir les chambres' : 'See the rooms', buttonHref: roomsSlug }),
  ]
}

const amenityTitle = (a: string, locale: Locale) => {
  const map: Record<string, [string, string]> = {
    wifi: ['Free Wi-Fi', 'Wi-Fi gratuit'], 'air-conditioning': ['Air conditioning', 'Climatisation'], breakfast: ['Breakfast', 'Petit-déjeuner'], elevator: ['Lift', 'Ascenseur'],
    parking: ['Parking', 'Parking'], pets: ['Pets welcome', 'Animaux acceptés'], '24h-reception': ['24-hour reception', 'Réception 24h/24'], bar: ['Bar', 'Bar'], safe: ['Safe', 'Coffre-fort'],
    'non-smoking': ['Non-smoking', 'Non-fumeur'], accessible: ['Accessible rooms', 'Chambres accessibles'], 'family-rooms': ['Family rooms', 'Chambres familiales'],
  }
  return map[a]?.[locale === 'fr' ? 1 : 0] ?? a
}

/** Merge generated blocks into the page's blocks: replace `generated` slots, keep everything else, append new slots. */
export function mergeBlocks(existing: Block[], generated: Block[]): { blocks: Block[]; generated: number; kept: number } {
  const out: Block[] = []
  const used = new Set<string>()
  let g = 0
  let kept = 0
  for (const e of existing) {
    const slot = e.provenance?.sourceFact ?? ''
    const match = slot.startsWith('gen:') ? generated.find((x) => x.provenance?.sourceFact === slot) : undefined
    if (match && e.provenance?.origin === 'generated') {
      out.push({ ...match, id: e.id })
      used.add(slot)
      g++
    } else {
      if (match) used.add(slot) // a person edited or locked this slot: theirs stays
      out.push(e)
      kept++
    }
  }
  for (const x of generated) {
    const slot = x.provenance?.sourceFact ?? ''
    if (used.has(slot)) continue
    out.push(x)
    g++
  }
  return { blocks: out, generated: g, kept }
}

export async function generateSite(payload: Payload, args: { tenantId: number; siteId: number; by: string }): Promise<GenerateResult> {
  const site = (await payload.find({ collection: 'sites', where: { and: [{ id: { equals: args.siteId } }, { tenant: { equals: args.tenantId } }] }, limit: 1, overrideAccess: true })).docs[0]
  if (!site) throw new Error(`Site ${args.siteId} not found in tenant ${args.tenantId}`)
  const locale = (site.defaultLocale ?? 'en') as Locale
  // The Payload config localises en/fr today; other site locales fall back to the default locale.
  const loc = locale as TypedLocale
  const f = await loadConfirmedFacts(payload, args.tenantId, args.siteId)
  const hotelName = site.brandName || first(f, 'business.name') || site.name
  const { copy, model } = await copyFor(f, locale, hotelName)

  // Room types, once.
  const rooms = { created: 0, kept: 0 }
  const names = all(f, 'room.name')
  for (const [i, name] of names.entries()) {
    const slug = slugify(name)
    const existing = await payload.count({ collection: 'rooms', where: { and: [{ tenant: { equals: args.tenantId } }, { slug: { equals: slug } }] }, overrideAccess: true })
    if (existing.totalDocs) {
      rooms.kept++
      continue
    }
    const of = (key: string) => all(f, key).find((v) => v.toLowerCase().startsWith(`${name.toLowerCase()}:`))?.split(':').slice(1).join(':').trim()
    const size = Number((of('room.size') ?? '').match(/\d+/)?.[0])
    const occ = Number((of('room.occupancy') ?? '').match(/\d+/)?.[0])
    await payload.create({
      collection: 'rooms',
      locale: loc,
      context: GEN,
      data: {
        tenant: args.tenantId,
        name,
        slug,
        order: i + 1,
        summary: of('room.description') ?? undefined,
        description: of('room.description') ?? undefined,
        sizeSqm: Number.isFinite(size) && size > 0 ? size : undefined,
        maxOccupancy: Number.isFinite(occ) && occ > 0 ? occ : undefined,
        bed: of('room.bed') ?? undefined,
      } as never,
      overrideAccess: true,
    })
    rooms.created++
  }

  // Pages: drafts, merged slot by slot.
  const pages: GenerateResult['pages'] = []
  const kinds = ['home', 'rooms', 'services', 'contact'] as const
  for (const [i, kind] of kinds.entries()) {
    const slug = PAGE_SLUGS[kind][locale]
    const generated = pageBlocks(kind, copy, f, locale)
    const existing = (
      await payload.find({ collection: 'pages', where: { and: [{ tenant: { equals: args.tenantId } }, { site: { equals: args.siteId } }, { slug: { equals: slug } }] }, limit: 1, locale: loc, draft: true, overrideAccess: true })
    ).docs[0]
    const title = kind === 'home' ? hotelName : copy[kind].heading
    if (!existing) {
      await payload.create({
        collection: 'pages',
        locale: loc,
        draft: true,
        context: GEN,
        data: { tenant: args.tenantId, site: args.siteId, slug, title, navOrder: i, showInNav: true, _status: 'draft', blocks: generated, meta: { description: kind === 'home' ? copy.home.about.slice(0, 155) : copy[kind].intro.slice(0, 155) } } as never,
        overrideAccess: true,
      })
      pages.push({ slug, created: true, generated: generated.length, kept: 0 })
      continue
    }
    const merged = mergeBlocks(((existing.blocks as Block[] | undefined) ?? []), generated)
    await payload.update({
      collection: 'pages',
      id: existing.id,
      locale: loc,
      draft: true,
      context: GEN,
      data: { blocks: merged.blocks, ...(existing.title ? {} : { title }) } as never,
      overrideAccess: true,
    })
    pages.push({ slug, created: false, generated: merged.generated, kept: merged.kept })
  }

  // Legal set: three footer drafts from the facts (unknowns visibly marked), never overwriting a page that exists.
  const legal = legalCopy(f, locale, hotelName)
  for (const [i, kind] of (['legal', 'privacy', 'terms'] as LegalKind[]).entries()) {
    const slug = LEGAL_SLUGS[kind][locale]
    const generated: Block[] = legal[kind].blocks.map((b, k) => gen(`gen:${kind}:${k}`, { blockType: 'text', heading: b.heading, body: b.body }))
    const existing = (
      await payload.find({ collection: 'pages', where: { and: [{ tenant: { equals: args.tenantId } }, { site: { equals: args.siteId } }, { slug: { equals: slug } }] }, limit: 1, locale: loc, draft: true, overrideAccess: true })
    ).docs[0]
    if (existing) {
      const merged = mergeBlocks(((existing.blocks as Block[] | undefined) ?? []), generated)
      await payload.update({ collection: 'pages', id: existing.id, locale: loc, draft: true, context: GEN, data: { blocks: merged.blocks } as never, overrideAccess: true })
      pages.push({ slug, created: false, generated: merged.generated, kept: merged.kept })
      continue
    }
    await payload.create({
      collection: 'pages',
      locale: loc,
      draft: true,
      context: GEN,
      data: { tenant: args.tenantId, site: args.siteId, slug, title: legal[kind].title, navLabel: legal[kind].navLabel, navOrder: 90 + i, showInNav: false, showInFooter: true, _status: 'draft', blocks: generated, meta: { description: legal[kind].description } } as never,
      overrideAccess: true,
    })
    pages.push({ slug, created: true, generated: generated.length, kept: 0 })
  }
  return { locale, facts: [...f.values()].flat().length, rooms, pages, model }
}
