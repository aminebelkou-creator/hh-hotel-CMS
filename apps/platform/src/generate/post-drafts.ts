import type { Payload } from 'payload'
import { getAi } from '../ai/provider'
import { all, amenityLabel, first, slugify, type FactMap } from './copy'
import { hasUnbackedNumbers, loadConfirmedFacts } from './generate'

/**
 * Blog post suggestions from the hotel's confirmed facts (fix-later: "AI blog drafts").
 *
 * A suggestion is always a DRAFT post (status draft, provenance generated `gen:post:<topic>`):
 * nothing is published, the owner reads, edits and publishes it. The text is built from
 * confirmed facts only (rule 9); with a model available it rewrites the draft into nicer
 * prose, and any number no fact backs makes us keep the deterministic draft instead.
 * Without a model (AI_PROVIDER unset) the deterministic draft is what the owner gets.
 */
export const POST_TOPICS = ['practical', 'amenities', 'rooms', 'breakfast'] as const
export type PostTopic = (typeof POST_TOPICS)[number]
type L = 'fr' | 'en'
type Draft = { title: string; excerpt: string; body: string }

const GEN = { generation: true }

/** French article before a name that starts with "Hôtel": "à l’Hôtel …", "de l’Hôtel …". */
export const frAt = (hotel: string) => (/^h[oô]tel\b/i.test(hotel) ? `à l’${hotel}` : `à ${hotel}`)
const frOf = (hotel: string) => (/^h[oô]tel\b/i.test(hotel) ? `de l’${hotel}` : `de ${hotel}`)

/** The deterministic draft for a topic in one language, or null when the facts are too thin. */
export function draftFromFacts(topic: PostTopic, f: FactMap, locale: L, hotel: string): Draft | null {
  const fr = locale === 'fr'
  if (topic === 'practical') {
    const address = first(f, 'address')
    const checkin = first(f, 'policy.checkin')
    const checkout = first(f, 'policy.checkout')
    if (!address && !checkin) return null
    const phones = all(f, 'contact.phone')
    const email = first(f, 'contact.email')
    const h24 = all(f, 'amenity').includes('24h-reception')
    const lines = [
      address ? (fr ? `- Adresse : ${address}` : `- Address: ${address}`) : null,
      checkin ? (fr ? `- Chambres disponibles à partir de ${checkin}` : `- Rooms ready from ${checkin}`) : null,
      checkout ? (fr ? `- Départ avant ${checkout}` : `- Check-out by ${checkout}`) : null,
      h24 ? (fr ? '- Réception ouverte 24h/24' : '- Reception open 24 hours') : null,
      phones.length ? (fr ? `- Téléphone : ${phones.join(' / ')}` : `- Phone: ${phones.join(' / ')}`) : null,
      email ? (fr ? `- E-mail : ${email}` : `- Email: ${email}`) : null,
    ].filter(Boolean)
    return {
      title: fr ? `Préparer votre arrivée ${frAt(hotel)}` : `Planning your arrival at ${hotel}`,
      excerpt: fr ? 'Adresse, horaires d’arrivée et de départ, et comment nous joindre : l’essentiel avant de venir.' : 'Address, check-in and check-out times, and how to reach us: the essentials before you come.',
      body: [
        fr ? 'Tout ce qu’il faut savoir pour une arrivée sans souci.' : 'Everything you need for a smooth arrival.',
        fr ? '## L’essentiel' : '## The essentials',
        lines.join('\n'),
        fr ? 'Une question avant votre séjour ? Écrivez-nous ou appelez-nous, nous vous répondons avec plaisir.' : 'A question before your stay? Write or call us, we are happy to help.',
      ].join('\n\n'),
    }
  }
  if (topic === 'amenities') {
    const amenities = all(f, 'amenity')
    const services = all(f, 'service')
    if (amenities.length + services.length < 3) return null
    const items = [...amenities.map((a) => amenityLabel(a, locale)), ...services].slice(0, 14)
    const rooms = first(f, 'hotel.rooms')
    const stars = first(f, 'hotel.stars') ?? first(f, 'rating.stars')
    const intro = [stars ? (fr ? `Hôtel ${stars} étoiles` : `A ${stars}-star hotel`) : null, rooms ? (fr ? `${rooms} chambres` : `${rooms} rooms`) : null].filter(Boolean).join(fr ? ', ' : ', ')
    return {
      title: fr ? `Ce qui vous attend ${frAt(hotel)}` : `What you will find at ${hotel}`,
      excerpt: fr ? 'Les services et équipements de l’hôtel, en un coup d’œil.' : 'The hotel’s services and facilities at a glance.',
      body: [
        intro ? `${intro}.` : null,
        fr ? '## Services et équipements' : '## Services and facilities',
        items.map((i) => `- ${i}`).join('\n'),
        fr ? 'Besoin d’un service particulier ? Dites-le-nous avant votre arrivée.' : 'Need something in particular? Tell us before you arrive.',
      ].filter(Boolean).join('\n\n'),
    }
  }
  if (topic === 'rooms') {
    const names = all(f, 'room.name')
    if (!names.length) return null
    const of = (key: string, name: string) => all(f, key).find((v) => v.toLowerCase().startsWith(`${name.toLowerCase()}:`))?.split(':').slice(1).join(':').trim()
    const sections = names.slice(0, 6).map((n) => {
      const bits = [of('room.size', n), of('room.occupancy', n), of('room.bed', n)].filter(Boolean)
      const desc = of('room.description', n)
      return [`## ${n}`, [bits.join(' · '), desc].filter(Boolean).join('\n\n')].filter(Boolean).join('\n\n')
    })
    return {
      title: fr ? `Nos chambres, une à une` : `Our rooms, one by one`,
      excerpt: fr ? `Les ${names.length} types de chambres ${frOf(hotel)}, pour choisir celle qui vous ressemble.` : `The ${names.length} room types at ${hotel}, to choose the one that suits you.`,
      body: [fr ? 'Chaque type de chambre, décrit à partir de nos informations vérifiées.' : 'Each room type, described from our checked information.', ...sections].join('\n\n'),
    }
  }
  // breakfast
  const hours = first(f, 'breakfast.hours')
  if (!hours) return null
  const price = first(f, 'breakfast.price')
  return {
    title: fr ? `Le petit-déjeuner ${frAt(hotel)}` : `Breakfast at ${hotel}`,
    excerpt: fr ? `Servi ${hours} : tout ce qu’il faut savoir sur le petit-déjeuner.` : `Served ${hours}: all about breakfast.`,
    body: [
      fr ? `Le petit-déjeuner est servi ${hours}.` : `Breakfast is served ${hours}.`,
      price ? (fr ? `Tarif : ${price}.` : `Price: ${price}.`) : null,
      fr ? 'Demandez à la réception s’il est inclus dans votre tarif.' : 'Ask reception whether it is included in your rate.',
    ].filter(Boolean).join('\n\n'),
  }
}

const SYSTEM = `You polish a short hotel blog post. Keep the same facts, the same structure (blank lines between paragraphs, "## " subheadings, "- " list lines) and the same language. Never add a number, price, distance, date or claim that is not in the draft or the facts. Answer JSON {"title","excerpt","body"}.`

async function polish(draft: Draft, f: FactMap, locale: L): Promise<{ draft: Draft; model: string | null }> {
  const ai = getAi()
  if (!ai.available) return { draft, model: null }
  try {
    const out = (await ai.complete({ system: SYSTEM, prompt: `Language: ${locale}\nFacts: ${JSON.stringify(Object.fromEntries(f))}\nDraft: ${JSON.stringify(draft)}`, json: true, maxTokens: 1200 })) as Partial<Draft> | null
    if (!out || typeof out !== 'object') return { draft, model: ai.model }
    const next: Draft = { ...draft }
    for (const k of ['title', 'excerpt', 'body'] as const) {
      const v = out[k]
      if (typeof v === 'string' && v.trim() && !hasUnbackedNumbers(v, f)) next[k] = v.trim()
    }
    return { draft: next, model: ai.model }
  } catch {
    return { draft, model: ai.model }
  }
}

export type SuggestResult = { ok: true; postId: number; slug: string; title: string; model: string | null } | { ok: false; reason: string }

/** Creates one draft post for a topic, in every enabled locale the templates cover (fr, en). */
export async function suggestPost(payload: Payload, args: { tenantId: number; siteId: number; topic: PostTopic; by: string }): Promise<SuggestResult> {
  const site = (await payload.find({ collection: 'sites', where: { and: [{ id: { equals: args.siteId } }, { tenant: { equals: args.tenantId } }] }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
  if (!site) throw new Error(`Site ${args.siteId} not found in tenant ${args.tenantId}`)
  const f = await loadConfirmedFacts(payload, args.tenantId, args.siteId)
  const hotel = site.brandName || first(f, 'business.name') || site.name
  const def = (site.defaultLocale === 'fr' ? 'fr' : 'en') as L
  const locales = [def, ...((site.enabledLocales ?? []) as string[]).filter((l): l is L => (l === 'fr' || l === 'en') && l !== def)]
  const drafts = new Map<L, Draft>()
  let model: string | null = null
  for (const l of locales) {
    const d = draftFromFacts(args.topic, f, l, hotel)
    if (!d) continue
    const p = await polish(d, f, l)
    model = p.model ?? model
    drafts.set(l, p.draft)
  }
  const main = drafts.get(def)
  if (!main) return { ok: false, reason: 'Not enough confirmed facts for this topic yet: confirm more facts (Review facts), then try again.' }
  const base = slugify(main.title).slice(0, 60) || args.topic
  const taken = await payload.count({ collection: 'posts', where: { and: [{ tenant: { equals: args.tenantId } }, { site: { equals: args.siteId } }, { slug: { like: base } }] }, overrideAccess: true })
  const slug = taken.totalDocs ? `${base}-${taken.totalDocs + 1}` : base
  const provenance = { origin: 'generated', sourceFact: `gen:post:${args.topic}` }
  const doc = await payload.create({
    collection: 'posts',
    locale: def,
    context: GEN,
    data: { tenant: args.tenantId, site: args.siteId, slug, status: 'draft', publishedAt: new Date().toISOString(), ...main, provenance } as never,
    overrideAccess: true,
    depth: 0,
  })
  for (const [l, d] of drafts) {
    if (l === def) continue
    await payload.update({ collection: 'posts', id: doc.id, locale: l, context: GEN, data: { ...d } as never, overrideAccess: true, depth: 0 })
  }
  return { ok: true, postId: Number(doc.id), slug, title: main.title, model }
}
