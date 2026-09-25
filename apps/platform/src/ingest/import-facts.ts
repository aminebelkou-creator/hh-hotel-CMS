/**
 * Import an ingest run into the fact base of one tenant, then apply the business's decisions.
 *
 *   pnpm exec tsx src/ingest/import-facts.ts src/ingest/confirmations/hotel-herse-dor.json [--publish] [--dry-run]
 *
 * Reads .ingest/<ingestHost>/facts.json (written by spike.ts), normalises and de-duplicates
 * it, and upserts one fact per distinct value. Existing decisions are never overwritten by a
 * re-import; the decisions file is applied last. Creates the tenant, site and a minimal home
 * page if they do not exist (onboarding). With --publish, publishes a first release.
 *
 * System operation run by an engineer: uses overrideAccess and is on the allowlist. Every
 * write names the tenant explicitly.
 */
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'
import { normaliseFacts, normaliseValue, type RawFact } from './normalise'
import { nextPublishSeq, publishSite } from '../releases/publish'

type Decision = { key: string; value: string; status: 'confirmed' | 'rejected' | 'unconfirmed'; note?: string }
type Onboarding = {
  tenant: { slug: string; name: string; plan?: string }
  site: {
    slug: string
    name: string
    brandName: string
    timezone?: string
    enabledLocales: ('en' | 'fr' | 'de' | 'es' | 'it')[]
    defaultLocale: 'en' | 'fr' | 'de' | 'es' | 'it'
  }
  ingestHost: string
  decisions: Decision[]
}

const args = process.argv.slice(2)
const file = args.find((a) => !a.startsWith('--'))
const dryRun = args.includes('--dry-run')
const doPublish = args.includes('--publish')

async function ensureTenantAndSite(payload: Payload, o: Onboarding) {
  let tenant = (await payload.find({ collection: 'tenants', where: { slug: { equals: o.tenant.slug } }, limit: 1, overrideAccess: true })).docs[0]
  if (!tenant) {
    tenant = await payload.create({
      collection: 'tenants',
      data: { name: o.tenant.name, slug: o.tenant.slug, plan: (o.tenant.plan as 'concierge') ?? 'concierge' },
      overrideAccess: true,
    })
    console.log(`created tenant ${o.tenant.slug} (${tenant.id})`)
  }
  const tenantId = Number(tenant.id)
  let site = (await payload.find({ collection: 'sites', where: { and: [{ slug: { equals: o.site.slug } }, { tenant: { equals: tenantId } }] }, limit: 1, overrideAccess: true })).docs[0]
  const siteData = {
    name: o.site.name,
    slug: o.site.slug,
    brandName: o.site.brandName,
    timezone: o.site.timezone ?? 'Europe/Paris',
    enabledLocales: o.site.enabledLocales,
    defaultLocale: o.site.defaultLocale,
    tenant: tenantId,
  }
  if (!site) {
    site = await payload.create({ collection: 'sites', data: { ...siteData, status: 'draft' }, overrideAccess: true })
    console.log(`created site ${o.site.slug} (${site.id})`)
  } else {
    site = await payload.update({ collection: 'sites', id: site.id, data: siteData, overrideAccess: true })
  }
  const siteId = Number(site.id)

  const home = await payload.find({ collection: 'pages', where: { and: [{ site: { equals: siteId } }, { tenant: { equals: tenantId } }, { slug: { equals: 'home' } }] }, limit: 1, overrideAccess: true })
  if (!home.docs[0]) {
    const page = await payload.create({
      collection: 'pages',
      locale: 'fr',
      data: {
        title: o.site.brandName,
        slug: 'home',
        site: siteId,
        tenant: tenantId,
        _status: 'published',
        blocks: [{ blockType: 'hero', heading: o.site.brandName, provenance: { origin: 'human', sourceFact: 'onboarding' } }],
        meta: { title: o.site.brandName },
      },
      overrideAccess: true,
    })
    // Required localized fields must exist in every locale before the page validates there.
    await payload.update({
      collection: 'pages',
      id: page.id,
      locale: 'en',
      data: {
        title: o.site.brandName,
        _status: 'published',
        blocks: (page.blocks ?? []).map((b) => ({ ...b, heading: o.site.brandName })),
        meta: { title: o.site.brandName },
      },
      overrideAccess: true,
    })
    console.log(`created home page (${page.id})`)
  }
  return { tenantId, siteId }
}

async function upsert(payload: Payload, tenantId: number, siteId: number, f: ReturnType<typeof normaliseFacts>[number]) {
  const existing = (
    await payload.find({
      collection: 'facts',
      where: { and: [{ tenant: { equals: tenantId } }, { key: { equals: f.key } }, { value: { equals: f.value } }] },
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0]
  const data = {
    key: f.key,
    value: f.value,
    site: siteId,
    confidence: f.confidence,
    method: f.method,
    source: f.source ?? undefined,
    occurrences: f.occurrences,
    evidence: f.evidence as unknown as Record<string, unknown>[],
  }
  if (existing) {
    // Re-import refreshes evidence; the decision (status) stays as the business left it.
    await payload.update({ collection: 'facts', id: existing.id, data, overrideAccess: true })
    return 'updated'
  }
  await payload.create({ collection: 'facts', data: { ...data, tenant: tenantId, status: 'unconfirmed' }, overrideAccess: true })
  return 'created'
}

async function decide(payload: Payload, tenantId: number, siteId: number, d: Decision) {
  const norm = normaliseValue(d.key, d.value)
  const value = norm ? norm[1] : d.value
  const existing = (
    await payload.find({
      collection: 'facts',
      where: { and: [{ tenant: { equals: tenantId } }, { key: { equals: d.key } }, { value: { equals: value } }] },
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0]
  if (existing) {
    if (existing.status === d.status && existing.decisionNote === d.note) return 'unchanged'
    await payload.update({ collection: 'facts', id: existing.id, data: { status: d.status, decisionNote: d.note }, overrideAccess: true })
    return 'decided'
  }
  await payload.create({
    collection: 'facts',
    data: { key: d.key, value, site: siteId, tenant: tenantId, method: 'manual', confidence: 1, status: d.status, decisionNote: d.note, occurrences: 1 },
    overrideAccess: true,
  })
  return 'added'
}

const run = async () => {
  if (!file) throw new Error('Usage: import-facts.ts <onboarding.json> [--publish] [--dry-run]')
  const o = JSON.parse(readFileSync(file, 'utf8')) as Onboarding
  const raw = JSON.parse(readFileSync(path.join(process.cwd(), '.ingest', o.ingestHost, 'facts.json'), 'utf8')) as RawFact[]
  const facts = normaliseFacts(raw)
  console.log(`${raw.length} sightings -> ${facts.length} distinct facts`)
  if (dryRun) {
    for (const f of facts) console.log(`  ${f.key} = ${f.value}  (${f.method}, ${f.confidence}, x${f.occurrences})`)
    process.exit(0)
  }
  const payload = await getPayload({ config })
  const t0 = Date.now()
  const { tenantId, siteId } = await ensureTenantAndSite(payload, o)
  const counts: Record<string, number> = {}
  for (const f of facts) {
    const r = await upsert(payload, tenantId, siteId, f)
    counts[r] = (counts[r] ?? 0) + 1
  }
  for (const d of o.decisions) {
    const r = await decide(payload, tenantId, siteId, d)
    counts[r] = (counts[r] ?? 0) + 1
  }
  const byStatus = await Promise.all(
    (['unconfirmed', 'confirmed', 'rejected'] as const).map(async (s) => [
      s,
      (await payload.count({ collection: 'facts', where: { and: [{ tenant: { equals: tenantId } }, { status: { equals: s } }] }, overrideAccess: true })).totalDocs,
    ]),
  )
  console.log(`facts: ${JSON.stringify(counts)}; now ${byStatus.map(([s, n]) => `${n} ${s}`).join(', ')} (${Date.now() - t0} ms)`)
  if (doPublish) {
    const seq = await nextPublishSeq(payload, tenantId, siteId)
    const res = await publishSite(payload, { tenantId, siteId, seq, by: 'import-facts' })
    console.log(`publish: ${JSON.stringify(res)}`)
  }
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
