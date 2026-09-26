/**
 * Exact text corrections on a live site, without touching anything else.
 *
 *   pnpm exec tsx src/onboarding/replace-text.ts <site-slug> <corrections.json>
 *
 * corrections.json: [{ "page": "quartier", "locale": "fr", "from": "exact old text", "to": "new text" }]
 * Each correction replaces the exact substring in the page's published blocks for that locale
 * (read without locale fallback, so one language is never copied into the other). A correction
 * that matches nothing is reported and skipped: the owner may have rewritten that text already.
 * Engineer-run system operation (overrideAccess), tenant named on every query. Publish afterwards.
 */
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'

type Correction = { page: string; locale: 'fr' | 'en'; from: string; to: string }

/** Replaces `from` by `to` in every string of a JSON value; returns the new value and the count. */
export function replaceDeep(value: unknown, from: string, to: string): { value: unknown; count: number } {
  if (typeof value === 'string') {
    const parts = value.split(from)
    return { value: parts.join(to), count: parts.length - 1 }
  }
  if (Array.isArray(value)) {
    let count = 0
    const out = value.map((v) => {
      const r = replaceDeep(v, from, to)
      count += r.count
      return r.value
    })
    return { value: out, count }
  }
  if (value && typeof value === 'object') {
    let count = 0
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      if (k === 'id' || k === 'blockType') {
        out[k] = v
        continue
      }
      const r = replaceDeep(v, from, to)
      count += r.count
      out[k] = r.value
    }
    return { value: out, count }
  }
  return { value, count: 0 }
}

export async function replaceText(payload: Payload, siteSlug: string, corrections: Correction[]) {
  const site = (await payload.find({ collection: 'sites', where: { slug: { equals: siteSlug } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0]
  if (!site) throw new Error(`Site ${siteSlug} not found`)
  const tenantId = Number(typeof site.tenant === 'object' && site.tenant ? (site.tenant as { id: number }).id : site.tenant)
  const report: { page: string; locale: string; replaced: number }[] = []
  for (const c of corrections) {
    const page = (await payload.find({ collection: 'pages', where: { and: [{ site: { equals: site.id } }, { tenant: { equals: tenantId } }, { slug: { equals: c.page } }] }, limit: 1, overrideAccess: true, depth: 0 })).docs[0]
    if (!page) {
      report.push({ page: c.page, locale: c.locale, replaced: 0 })
      continue
    }
    const stored = (await payload.findByID({ collection: 'pages', id: page.id, locale: c.locale, fallbackLocale: false, depth: 0, overrideAccess: true, draft: false })) as { blocks?: unknown[] }
    const r = replaceDeep(stored.blocks ?? [], c.from, c.to)
    if (r.count > 0) {
      await payload.update({ collection: 'pages', id: page.id, locale: c.locale, data: { blocks: r.value, _status: 'published' } as never, overrideAccess: true, depth: 0 })
    }
    report.push({ page: c.page, locale: c.locale, replaced: r.count })
  }
  return report
}

const isMain = process.argv[1] && /onboarding[\\/]replace-text\.ts$/.test(process.argv[1])
if (isMain) {
  const [siteSlug, file] = process.argv.slice(2)
  const run = async () => {
    if (!siteSlug || !file) throw new Error('Usage: replace-text.ts <site-slug> <corrections.json>')
    const corrections = JSON.parse(readFileSync(file, 'utf8')) as Correction[]
    const payload = await getPayload({ config })
    console.log(JSON.stringify(await replaceText(payload, siteSlug, corrections)))
    process.exit(0)
  }
  run().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
