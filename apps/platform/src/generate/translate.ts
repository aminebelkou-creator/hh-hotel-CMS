/**
 * Translation: fill a second locale of a site's pages and room types from the default
 * locale, with a model. Field by field, following the collection's own field definitions:
 *
 * - generated blocks (provenance `generated`): the target text is rewritten from the source;
 * - human or locked blocks, page titles, metadata, rooms: only EMPTY target fields are filled;
 *   a person's translation is never overwritten (rule 7);
 * - rich text is left alone (v1);
 * - without a model nothing is written and the result says so.
 *
 * Runs after the endpoint checked the caller's access; every query filters on the tenant.
 */
import type { Field, Payload, TypedLocale } from 'payload'
import { getAi } from '../ai/provider'

export type Locale = 'en' | 'fr' | 'de' | 'es' | 'it'
export type TranslateResult = { from: Locale; to: Locale; model: string | null; pages: number; rooms: number; fields: number; skipped: string[] }
type Loc = Record<string, unknown>
type Item = { text: string; set: (v: string) => void }
const GEN = { generation: true }
const LANG: Record<Locale, string> = { en: 'English', fr: 'French', de: 'German', es: 'Spanish', it: 'Italian' }

const TRANSLATE_SYSTEM = `You translate website copy for a hotel. Keep meaning, tone, names, numbers, times and prices exactly; keep line breaks and "## " subheadings.
Answer with JSON: {"t":["…","…"]} with one translation per input string, in the same order.`

/** Walk fields; for each localized text, call `visit` with the source value and a setter on the target copy. */
function walk(fields: Field[], all: Loc, target: Loc, from: Locale, to: Locale, overwrite: boolean, blocksByType: Map<string, Field[]>, items: Item[]) {
  for (const field of fields) {
    if (!('name' in field) || !field.name) {
      if (field.type === 'row' || field.type === 'collapsible') walk(field.fields, all, target, from, to, overwrite, blocksByType, items)
      continue
    }
    const name = field.name
    const v = all[name]
    if ((field.type === 'text' || field.type === 'textarea') && field.localized) {
      const obj = v && typeof v === 'object' ? (v as Record<string, string>) : v ? { [from]: String(v) } : {}
      const src = obj[from]
      const cur = obj[to]
      target[name] = cur ?? null
      if (typeof src === 'string' && src.trim() && (overwrite || !cur?.trim())) items.push({ text: src, set: (t) => (target[name] = t) })
      continue
    }
    if (field.type === 'text' || field.type === 'textarea' || field.type === 'richText') {
      target[name] = v && typeof v === 'object' && field.localized ? ((v as Record<string, unknown>)[to] ?? null) : (v ?? null)
      continue
    }
    if (field.type === 'group') {
      const t: Loc = {}
      walk(field.fields, (v as Loc) ?? {}, t, from, to, overwrite, blocksByType, items)
      target[name] = t
      continue
    }
    if (field.type === 'array') {
      target[name] = ((v as Loc[] | undefined) ?? []).map((row) => {
        const t: Loc = { id: row.id }
        walk(field.fields, row, t, from, to, overwrite, blocksByType, items)
        return t
      })
      continue
    }
    if (field.type === 'blocks') {
      target[name] = ((v as Loc[] | undefined) ?? []).map((b) => {
        const t: Loc = { id: b.id, blockType: b.blockType, blockName: b.blockName ?? null }
        const def = blocksByType.get(String(b.blockType)) ?? []
        const prov = b.provenance as { origin?: string } | undefined
        const ow = overwrite && prov?.origin === 'generated'
        walk(def, b, t, from, to, ow, blocksByType, items)
        return t
      })
      continue
    }
    // Any other localized field (an upload, a select): keep the target locale's own value.
    const localized = 'localized' in field && field.localized
    target[name] = localized && v && typeof v === 'object' && !Array.isArray(v) ? ((v as Record<string, unknown>)[to] ?? null) : (v ?? null)
  }
}

async function translateAll(items: Item[], from: Locale, to: Locale): Promise<number> {
  const ai = getAi()
  let done = 0
  for (let i = 0; i < items.length; i += 40) {
    const batch = items.slice(i, i + 40)
    const out = (await ai.complete({
      system: TRANSLATE_SYSTEM,
      prompt: `From ${LANG[from]} to ${LANG[to]}.\n${JSON.stringify({ s: batch.map((b) => b.text) })}`,
      json: true,
      maxTokens: 4000,
      temperature: 0.1,
    })) as { t?: unknown } | null
    const t = Array.isArray(out?.t) ? (out!.t as unknown[]) : []
    batch.forEach((b, k) => {
      const v = t[k]
      if (typeof v === 'string' && v.trim()) {
        b.set(v.trim())
        done++
      }
    })
  }
  return done
}

export async function translateSite(payload: Payload, args: { tenantId: number; siteId: number; to: Locale; from?: Locale; by: string }): Promise<TranslateResult> {
  const site = (await payload.find({ collection: 'sites', where: { and: [{ id: { equals: args.siteId } }, { tenant: { equals: args.tenantId } }] }, limit: 1, overrideAccess: true })).docs[0]
  if (!site) throw new Error(`Site ${args.siteId} not found in tenant ${args.tenantId}`)
  const from = (args.from ?? (site.defaultLocale as Locale) ?? 'en') as Locale
  const to = args.to
  if (from === to) throw new Error('Source and target locale are the same')
  if (!(site.enabledLocales ?? []).includes(to)) throw new Error(`Locale ${to} is not enabled on this site`)
  const ai = getAi()
  const result: TranslateResult = { from, to, model: ai.available ? ai.model : null, pages: 0, rooms: 0, fields: 0, skipped: [] }
  if (!ai.available) {
    result.skipped.push('no model configured (AI_PROVIDER): nothing translated')
    return result
  }
  const pagesCfg = payload.collections.pages.config.fields
  const blocksField = pagesCfg.find((f) => 'name' in f && f.name === 'blocks')
  const blocksByType = new Map<string, Field[]>()
  if (blocksField && blocksField.type === 'blocks') for (const b of blocksField.blocks) blocksByType.set(b.slug, b.fields)

  const pages = await payload.find({ collection: 'pages', where: { and: [{ tenant: { equals: args.tenantId } }, { site: { equals: args.siteId } }] }, limit: 100, locale: 'all', draft: true, depth: 0, overrideAccess: true })
  for (const p of pages.docs) {
    const items: Item[] = []
    const target: Loc = {}
    walk(pagesCfg.filter((f) => 'name' in f && ['title', 'navLabel', 'blocks', 'meta'].includes(f.name as string)), p as unknown as Loc, target, from, to, true, blocksByType, items)
    if (!items.length) continue
    const n = await translateAll(items, from, to)
    if (!n) continue
    await payload.update({ collection: 'pages', id: p.id, locale: to as TypedLocale, draft: true, context: GEN, data: target as never, overrideAccess: true })
    result.pages++
    result.fields += n
  }
  const roomsCfg = payload.collections.rooms?.config.fields
  if (roomsCfg) {
    const rooms = await payload.find({ collection: 'rooms', where: { tenant: { equals: args.tenantId } }, limit: 100, locale: 'all', depth: 0, overrideAccess: true })
    for (const r of rooms.docs) {
      const items: Item[] = []
      const target: Loc = {}
      walk(roomsCfg.filter((f) => 'name' in f && ['name', 'summary', 'description', 'bed', 'view', 'features'].includes(f.name as string)), r as unknown as Loc, target, from, to, false, blocksByType, items)
      if (!items.length) continue
      const n = await translateAll(items, from, to)
      if (!n) continue
      await payload.update({ collection: 'rooms', id: r.id, locale: to as TypedLocale, context: GEN, data: target as never, overrideAccess: true })
      result.rooms++
      result.fields += n
    }
  }
  return result
}
