/**
 * Brand proposal: a template and an accent colour suggested from what the hotel already
 * has (its logo, its photos, its confirmed facts), under the design contract (docs/11).
 * A proposal is stored on the site and applied only when a person approves it; the
 * contrast gates run on apply exactly as for a hand-picked brand.
 *
 * Deterministic: colour from pixels (sharp), template from a few facts. A model, when
 * configured, only adds a one-paragraph rationale in the site's language.
 */
import sharp from 'sharp'
import type { Payload } from 'payload'
import { getAi } from '../ai/provider'
import { isCrawlableUrl } from '../ingest/crawl'
import { ensureContrast, luminance, toHex, type RGB } from './color'
import { resolveTheme } from './theme'
import { DEFAULT_TEMPLATE, TEMPLATES, type TemplateId } from './templates'

export type BrandProposal = {
  status: 'proposed' | 'applied' | 'dismissed'
  createdAt: string
  template: TemplateId
  accent: string
  /** Where the accent came from and what decided the template. */
  sources: { accent: 'logo' | 'photos' | 'template'; template: string[] }
  rationale?: string
  alternatives: { template: TemplateId; accent: string }[]
}

type Pool = { query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> }
const poolOf = (payload: unknown) => (payload as { db: { pool: Pool } }).db.pool

const rgbToHsl = ([r, g, b]: RGB): [number, number, number] => {
  const R = r / 255
  const G = g / 255
  const B = b / 255
  const max = Math.max(R, G, B)
  const min = Math.min(R, G, B)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = max === R ? (G - B) / d + (G < B ? 6 : 0) : max === G ? (B - R) / d + 2 : (R - G) / d + 4
  h /= 6
  return [h, s, l]
}

/** The dominant saturated colour of an image, or null when it is essentially grey. */
export async function dominantColour(bytes: Buffer): Promise<string | null> {
  const { data, info } = await sharp(bytes).resize(48, 48, { fit: 'inside' }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const bins = new Map<number, { w: number; r: number; g: number; b: number }>()
  for (let i = 0; i < data.length; i += info.channels) {
    const px: RGB = [data[i], data[i + 1], data[i + 2]]
    const [h, s, l] = rgbToHsl(px)
    if (s < 0.25 || l < 0.12 || l > 0.9) continue // grey, near-black, near-white: not a brand colour
    const bin = Math.floor(h * 24)
    const w = s * (1 - Math.abs(l - 0.5))
    const cur = bins.get(bin) ?? { w: 0, r: 0, g: 0, b: 0 }
    cur.w += w
    cur.r += px[0] * w
    cur.g += px[1] * w
    cur.b += px[2] * w
    bins.set(bin, cur)
  }
  const total = (data.length / info.channels) || 1
  const best = [...bins.values()].sort((a, b) => b.w - a.w)[0]
  if (!best || best.w / total < 0.01) return null
  return toHex([Math.round(best.r / best.w), Math.round(best.g / best.w), Math.round(best.b / best.w)])
}

/** Average lightness of an image (0 dark – 1 light), for the template mood. */
export async function lightness(bytes: Buffer): Promise<number> {
  const { data, info } = await sharp(bytes).resize(32, 32, { fit: 'inside' }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  let sum = 0
  let n = 0
  for (let i = 0; i < data.length; i += info.channels) {
    sum += rgbToHsl([data[i], data[i + 1], data[i + 2]])[2]
    n++
  }
  return n ? sum / n : 0.5
}

/**
 * Make an accent stand out on the template's background (3:1, the large-text/UI threshold).
 * Button text and link text are derived by resolveTheme and always pass on their own.
 */
export function readableAccent(accent: string, template: TemplateId): string {
  const p = TEMPLATES[template].palette
  return ensureContrast(accent, [p.paper, p.tint], 3, luminance(p.paper) > 0.5 ? '#000000' : '#ffffff')
}

export function chooseTemplate(input: { stars?: number; photoLightness?: number; keywords: string[] }): { template: TemplateId; why: string[] } {
  const why: string[] = []
  const k = input.keywords.join(' ').toLowerCase()
  if (input.photoLightness !== undefined && input.photoLightness < 0.35) {
    why.push('the photos are dark and moody: Soirée is built for evening light')
    return { template: 'soiree', why }
  }
  if ((input.stars ?? 0) >= 4 || /luxe|luxury|palace|spa|gastronom/.test(k)) {
    why.push((input.stars ?? 0) >= 4 ? `${input.stars} stars: Soirée’s dark, quiet layout suits an upscale house` : 'the hotel describes itself as upscale')
    return { template: 'soiree', why }
  }
  if (/design|moderne|modern|urbain|urban|studio|loft|hostel|famil/.test(k)) {
    why.push('the hotel describes itself as modern or family-oriented: Atelier is bright and practical')
    return { template: 'atelier', why }
  }
  why.push('a classic independent hotel: Maison is warm and timeless')
  return { template: DEFAULT_TEMPLATE, why }
}

async function fetchImage(url: string): Promise<Buffer | null> {
  if (!isCrawlableUrl(url)) return null
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(10000), headers: { 'user-agent': 'hh-brand/1.0' } })
    if (!r.ok || !(r.headers.get('content-type') || '').startsWith('image/')) return null
    const buf = Buffer.from(await r.arrayBuffer())
    return buf.length > 6 * 1024 * 1024 ? null : buf
  } catch {
    return null
  }
}

export async function proposeBrand(payload: Payload, args: { tenantId: number; siteId: number }): Promise<BrandProposal> {
  const site = (await payload.find({ collection: 'sites', where: { and: [{ id: { equals: args.siteId } }, { tenant: { equals: args.tenantId } }] }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
  if (!site) throw new Error(`Site ${args.siteId} not found in tenant ${args.tenantId}`)
  const facts = await payload.find({ collection: 'facts', where: { and: [{ tenant: { equals: args.tenantId } }, { status: { equals: 'confirmed' } }] }, limit: 500, overrideAccess: true })
  const fact = (key: string) => facts.docs.filter((f) => f.key === key).map((f) => f.value)

  // 1. Accent from the logo (site field first, then a confirmed site.logo fact), else from the photos.
  let accent: string | null = null
  let accentSource: BrandProposal['sources']['accent'] = 'template'
  const logoUrl = site.logoUrl || fact('site.logo')[0]
  if (logoUrl) {
    const bytes = await fetchImage(logoUrl)
    if (bytes) {
      accent = await dominantColour(bytes).catch(() => null)
      if (accent) accentSource = 'logo'
    }
  }
  const photos = await payload.find({ collection: 'media', where: { tenant: { equals: args.tenantId } }, limit: 6, sort: '-createdAt', depth: 0, overrideAccess: true })
  const lights: number[] = []
  const photoColours: string[] = []
  for (const m of photos.docs) {
    const key = (m.sizes as { thumb?: { filename?: string | null } } | undefined)?.thumb?.filename || m.filename
    if (!key) continue
    const r = await poolOf(payload).query(`select bytes from media_blobs where key = $1`, [key])
    const bytes = r.rows[0]?.bytes as Buffer | undefined
    if (!bytes) continue
    lights.push(await lightness(bytes).catch(() => 0.5))
    const c = await dominantColour(bytes).catch(() => null)
    if (c) photoColours.push(c)
  }
  if (!accent && photoColours.length) {
    accent = photoColours[0]
    accentSource = 'photos'
  }

  // 2. Template from stars, description and the photos' mood.
  const stars = Number(fact('rating.stars')[0])
  const keywords = [...fact('business.description'), ...fact('site.description'), ...fact('business.type'), ...fact('amenity')]
  const photoLightness = lights.length ? lights.reduce((a, b) => a + b, 0) / lights.length : undefined
  const { template, why } = chooseTemplate({ stars: Number.isFinite(stars) ? stars : undefined, photoLightness, keywords })
  const finalAccent = readableAccent(accent ?? TEMPLATES[template].palette.accent, template)
  const issues = resolveTheme(template, { accent: finalAccent }).issues
  if (issues.length) why.push(`accent adjusted for readability (${issues.length} contrast checks)`)

  // 3. A short rationale in the site's language, from a model when there is one.
  let rationale: string | undefined
  const ai = getAi()
  if (ai.available) {
    try {
      const t = await ai.complete({
        system: 'You explain a design suggestion for a hotel website in two short sentences, plainly, in the language asked. No marketing fluff.',
        prompt: `Language: ${site.defaultLocale ?? 'en'}. Hotel: ${site.brandName || site.name}. Suggested template: ${TEMPLATES[template].name} (${TEMPLATES[template].description.en}). Accent colour ${finalAccent} taken from the ${accentSource}. Reasons: ${why.join('; ')}.`,
        maxTokens: 200,
      })
      if (typeof t === 'string' && t.trim()) rationale = t.trim()
    } catch {
      /* the proposal stands without a rationale */
    }
  }
  const alternatives = (Object.keys(TEMPLATES) as TemplateId[]).filter((t) => t !== template).map((t) => ({ template: t, accent: readableAccent(accent ?? TEMPLATES[t].palette.accent, t) }))
  const proposal: BrandProposal = { status: 'proposed', createdAt: new Date().toISOString(), template, accent: finalAccent, sources: { accent: accentSource, template: why }, rationale, alternatives }
  await payload.update({ collection: 'sites', id: site.id, data: { brandProposal: proposal as unknown as Record<string, unknown> }, overrideAccess: true })
  return proposal
}

export async function applyBrandProposal(payload: Payload, args: { tenantId: number; siteId: number; template?: TemplateId }): Promise<{ template: TemplateId; accent: string }> {
  const site = (await payload.find({ collection: 'sites', where: { and: [{ id: { equals: args.siteId } }, { tenant: { equals: args.tenantId } }] }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
  if (!site) throw new Error(`Site ${args.siteId} not found in tenant ${args.tenantId}`)
  const p = site.brandProposal as BrandProposal | null | undefined
  if (!p || p.status !== 'proposed') throw new Error('No proposal to apply')
  const choice = args.template && args.template !== p.template ? p.alternatives.find((a) => a.template === args.template) : { template: p.template, accent: p.accent }
  if (!choice) throw new Error('Unknown template')
  const th = resolveTheme(choice.template, { ...(site.brand as Record<string, unknown> | undefined), accent: choice.accent })
  const blocking = th.issues.filter((i) => /^(text|secondary text) on/.test(i))
  if (blocking.length) throw new Error(`Not readable: ${blocking.join('; ')}`)
  await payload.update({
    collection: 'sites',
    id: site.id,
    data: { template: choice.template, brand: { ...(site.brand as Record<string, unknown> | undefined), accent: choice.accent }, brandProposal: { ...p, status: 'applied', appliedAt: new Date().toISOString() } as unknown as Record<string, unknown> },
    overrideAccess: true,
  })
  return choice
}
