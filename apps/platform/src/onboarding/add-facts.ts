/**
 * Adds facts read from the hotel's own pages, as confirmed, when the site does not already hold
 * that key and value. Nothing is removed or changed.
 *
 *   pnpm exec tsx src/onboarding/add-facts.ts <site-slug> <facts.json>
 *
 * facts.json: [{ "key": "breakfast.hours", "value": "07:00-10:30", "source": "https://…", "note": "…" }]
 * Engineer-run system operation (overrideAccess), tenant named on every query; the owner sees and
 * can reject every fact under Review facts. Publish afterwards.
 */
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'

type NewFact = { key: string; value: string; source: string; note?: string }

export async function addFacts(payload: Payload, siteSlug: string, facts: NewFact[]) {
  const site = (await payload.find({ collection: 'sites', where: { slug: { equals: siteSlug } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0]
  if (!site) throw new Error(`Site ${siteSlug} not found`)
  const tenantId = Number(typeof site.tenant === 'object' && site.tenant ? (site.tenant as { id: number }).id : site.tenant)
  const report: { key: string; value: string; added: boolean }[] = []
  for (const f of facts) {
    if (!/^[a-z][a-z0-9.-]*$/.test(f.key) || !f.value.trim() || !/^https:\/\//.test(f.source)) throw new Error(`Bad fact: ${JSON.stringify(f)}`)
    const same = await payload.count({ collection: 'facts', where: { and: [{ tenant: { equals: tenantId } }, { site: { equals: site.id } }, { key: { equals: f.key } }, { value: { equals: f.value } }] }, overrideAccess: true })
    if (same.totalDocs) {
      report.push({ key: f.key, value: f.value, added: false })
      continue
    }
    const doc = await payload.create({
      collection: 'facts',
      data: { tenant: tenantId, site: site.id, key: f.key, value: f.value, method: 'manual', confidence: 1, source: f.source, decisionNote: f.note ?? 'Read on the hotel’s own website' } as never,
      overrideAccess: true,
    })
    await payload.update({ collection: 'facts', id: doc.id, data: { status: 'confirmed' }, overrideAccess: true })
    report.push({ key: f.key, value: f.value, added: true })
  }
  return report
}

const isMain = process.argv[1] && /onboarding[\\/]add-facts\.ts$/.test(process.argv[1])
if (isMain) {
  const [siteSlug, file] = process.argv.slice(2)
  const run = async () => {
    if (!siteSlug || !file) throw new Error('Usage: add-facts.ts <site-slug> <facts.json>')
    const facts = JSON.parse(readFileSync(file, 'utf8')) as NewFact[]
    const payload = await getPayload({ config })
    console.log(JSON.stringify(await addFacts(payload, siteSlug, facts)))
    process.exit(0)
  }
  run().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
