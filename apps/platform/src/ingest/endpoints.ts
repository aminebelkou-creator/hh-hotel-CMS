import type { Endpoint, PayloadRequest } from 'payload'
import { runCrawlChunk, startCrawl } from './run'

/**
 * POST /api/sites/:id/ingest   { url, maxPages? }  → creates the crawl and runs its first chunk
 * POST /api/crawls/:id/continue                    → runs the next chunk
 *
 * The caller's right to the site or crawl is checked with the caller's own access
 * (overrideAccess false): 404 for anything outside their tenants. Only then does the
 * crawler run, with the tenant carried explicitly.
 */
const tenantOf = (doc: { tenant?: unknown }) => Number(typeof doc.tenant === 'object' && doc.tenant ? (doc.tenant as { id: unknown }).id : doc.tenant)

const unauthorized = () => Response.json({ error: 'Unauthorized' }, { status: 401 })

export const ingestEndpoint: Endpoint = {
  path: '/:id/ingest',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    if (!req.user) return unauthorized()
    const id = Number(req.routeParams?.id)
    if (!Number.isInteger(id)) return Response.json({ error: 'Bad site id' }, { status: 400 })
    const site = await req.payload.findByID({ collection: 'sites', id, depth: 0, user: req.user, overrideAccess: false }).catch(() => null)
    if (!site) return Response.json({ error: 'Not found' }, { status: 404 })
    const body = (await req.json?.().catch(() => ({}))) as { url?: string; maxPages?: number }
    const url = String(body.url ?? '').trim()
    if (!url) return Response.json({ error: 'url required' }, { status: 400 })
    const tenantId = tenantOf(site)
    let crawl
    try {
      crawl = await startCrawl(req.payload, { tenantId, siteId: Number(site.id), url, maxPages: body.maxPages, by: `${req.user.collection}:${req.user.id}` })
    } catch (e) {
      return Response.json({ error: (e as Error).message }, { status: 422 })
    }
    const res = await runCrawlChunk(req.payload, { tenantId, crawlId: Number(crawl.id) })
    return Response.json({ crawlId: crawl.id, ...res }, { status: res.status === 'failed' ? 502 : 200 })
  },
}

export const continueEndpoint: Endpoint = {
  path: '/:id/continue',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    if (!req.user) return unauthorized()
    const id = Number(req.routeParams?.id)
    if (!Number.isInteger(id)) return Response.json({ error: 'Bad crawl id' }, { status: 400 })
    const crawl = await req.payload.findByID({ collection: 'crawls', id, depth: 0, user: req.user, overrideAccess: false }).catch(() => null)
    if (!crawl) return Response.json({ error: 'Not found' }, { status: 404 })
    const res = await runCrawlChunk(req.payload, { tenantId: tenantOf(crawl), crawlId: Number(crawl.id) })
    return Response.json({ crawlId: crawl.id, ...res }, { status: res.status === 'failed' ? 502 : 200 })
  },
}
