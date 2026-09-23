/**
 * Measures one publish and one rollback on a real site, for the Gate 2 evidence.
 *
 *   pnpm exec tsx src/releases/time-release.ts <site-slug>
 *
 * Publishes the site's current content as a new release (verifying it over HTTP when
 * RELEASE_VERIFY_BASE_URL is set), then rolls back to the previous release. The site ends
 * on the release it started on. Engineer-run; uses only the pipeline's own functions.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'
import { nextPublishSeq, publishSite, rollbackSite } from './publish'

const slug = process.argv[2]
const run = async () => {
  if (!slug) throw new Error('Usage: time-release.ts <site-slug>')
  const payload = await getPayload({ config })
  const site = (await payload.find({ collection: 'sites', where: { slug: { equals: slug } }, depth: 0, limit: 1, overrideAccess: true })).docs[0]
  if (!site) throw new Error(`No site ${slug}`)
  const tenantId = Number(typeof site.tenant === 'object' && site.tenant ? site.tenant.id : site.tenant)
  const siteId = Number(site.id)
  const t0 = Date.now()
  const pub = await publishSite(payload, { tenantId, siteId, seq: await nextPublishSeq(payload, tenantId, siteId), by: 'time-release' })
  const publishMs = Date.now() - t0
  const t1 = Date.now()
  const rb = await rollbackSite(payload, { tenantId, siteId, by: 'time-release' })
  const rollbackMs = Date.now() - t1
  console.log(JSON.stringify({ site: slug, publish: { ...pub, wallMs: publishMs }, rollback: { ...rb, wallMs: rollbackMs } }))
  process.exit(0)
}
run().catch((e) => {
  console.error(e)
  process.exit(1)
})
