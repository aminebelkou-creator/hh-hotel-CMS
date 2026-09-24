/**
 * Copies a hotel's photos into the platform's media library (so the site no longer loads
 * them from the hotel's old website), then the onboarding apply script uses them.
 *
 *   pnpm exec tsx src/onboarding/import-images.ts hotel-herse-dor
 *
 * Idempotent: a photo already imported (same source URL, same tenant) is skipped.
 * Engineer-run system operation; every write names the tenant.
 */
import 'dotenv/config'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'
import type { Img, SiteContent } from './types'
import { hotelHerseDor } from './sites/hotel-herse-dor'
import { IMG as herseDorImages } from './sites/hotel-herse-dor.images'

const SITES: Record<string, { content: SiteContent; images: Record<string, Img> }> = {
  'hotel-herse-dor': { content: hotelHerseDor, images: herseDorImages },
}

export async function importImages(payload: Payload, content: SiteContent, images: Img[]) {
  const tenant = (await payload.find({ collection: 'tenants', where: { slug: { equals: content.tenant.slug } }, limit: 1, overrideAccess: true })).docs[0]
  if (!tenant) throw new Error(`Tenant ${content.tenant.slug} not found`)
  const tenantId = Number(tenant.id)
  let created = 0
  let skipped = 0
  for (const img of images) {
    const exists = await payload.find({
      collection: 'media',
      where: { and: [{ tenant: { equals: tenantId } }, { sourceUrl: { equals: img.url } }] },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (exists.docs[0]) {
      skipped++
      continue
    }
    const res = await fetch(img.url, { headers: { 'user-agent': 'hh-platform-onboarding/0.1' } })
    if (!res.ok) throw new Error(`Download failed (${res.status}): ${img.url}`)
    const data = Buffer.from(await res.arrayBuffer())
    const name = decodeURIComponent(img.url.split('/').pop() || 'photo.jpg').replace(/[^\w.-]+/g, '-').toLowerCase()
    const mimetype = res.headers.get('content-type')?.split(';')[0] || 'image/jpeg'
    const doc = await payload.create({
      collection: 'media',
      locale: 'fr',
      data: { alt: img.alt.fr, rights: 'owned', sourceUrl: img.url, tenant: tenantId } as never,
      file: { data, mimetype, name, size: data.length },
      overrideAccess: true,
    })
    await payload.update({ collection: 'media', id: doc.id, locale: 'en', data: { alt: img.alt.en } as never, overrideAccess: true })
    created++
  }
  return { created, skipped }
}

/** Source URL → platform URLs of the imported photo (full width and card size). */
export async function mediaMap(payload: Payload, tenantId: number) {
  const docs = await payload.find({ collection: 'media', where: { tenant: { equals: tenantId } }, pagination: false, depth: 0, overrideAccess: true })
  const map = new Map<string, { full: string; card: string }>()
  for (const d of docs.docs as unknown as { sourceUrl?: string; url?: string; sizes?: Record<string, { url?: string | null }> }[]) {
    if (!d.sourceUrl || !d.url) continue
    map.set(d.sourceUrl, { full: d.sizes?.hero?.url || d.url, card: d.sizes?.card?.url || d.url })
  }
  return map
}

const isMain = process.argv[1] && /onboarding[\\/]import-images\.ts$/.test(process.argv[1])
if (isMain) {
  const slug = process.argv[2]
  const run = async () => {
    const entry = SITES[slug]
    if (!entry) throw new Error(`Usage: import-images.ts <${Object.keys(SITES).join('|')}>`)
    const payload = await getPayload({ config })
    const t0 = Date.now()
    const r = await importImages(payload, entry.content, Object.values(entry.images))
    console.log(`images: ${r.created} imported, ${r.skipped} already there (${Date.now() - t0} ms)`)
    process.exit(0)
  }
  run().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
