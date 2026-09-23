import type { Endpoint, PayloadRequest } from 'payload'
import { nextPublishSeq, publishSite, rollbackSite } from './publish'

/**
 * POST /api/sites/:id/publish   (?queue=1 to queue the publishSite job instead of running now)
 * POST /api/sites/:id/rollback
 *
 * The caller's right to the site is checked with the caller's own access (overrideAccess
 * false): a user who cannot read site :id gets 404, whatever tenant it is in. Only then does
 * the pipeline run, with the site's tenant carried explicitly.
 */
const siteForCaller = async (req: PayloadRequest) => {
  if (!req.user) return { ok: false as const, res: Response.json({ error: 'Unauthorized' }, { status: 401 }) }
  const id = Number(req.routeParams?.id)
  if (!Number.isInteger(id)) return { ok: false as const, res: Response.json({ error: 'Bad site id' }, { status: 400 }) }
  const site = await req.payload
    .findByID({ collection: 'sites', id, depth: 0, user: req.user, overrideAccess: false })
    .catch(() => null)
  if (!site) return { ok: false as const, res: Response.json({ error: 'Not found' }, { status: 404 }) }
  const tenantId = Number(typeof site.tenant === 'object' && site.tenant ? site.tenant.id : site.tenant)
  return { ok: true as const, site, tenantId, by: `${req.user.collection}:${req.user.id}` }
}

export const publishEndpoint: Endpoint = {
  path: '/:id/publish',
  method: 'post',
  handler: async (req) => {
    const s = await siteForCaller(req)
    if (!s.ok) return s.res
    const siteId = Number(s.site.id)
    const seq = await nextPublishSeq(req.payload, s.tenantId, siteId)
    const input = { tenantId: s.tenantId, siteId, seq, by: s.by }
    if (req.searchParams?.get('queue') === '1') {
      const job = await req.payload.jobs.queue({ task: 'publishSite', input })
      return Response.json({ queued: true, jobId: job.id, seq }, { status: 202 })
    }
    const res = await publishSite(req.payload, input)
    const status = res.outcome === 'live' ? 200 : res.outcome === 'busy' ? 409 : res.outcome === 'superseded' ? 202 : 500
    return Response.json({ seq, ...res }, { status })
  },
}

export const rollbackEndpoint: Endpoint = {
  path: '/:id/rollback',
  method: 'post',
  handler: async (req) => {
    const s = await siteForCaller(req)
    if (!s.ok) return s.res
    const res = await rollbackSite(req.payload, { tenantId: s.tenantId, siteId: Number(s.site.id), by: s.by })
    const status = res.outcome === 'rolled-back' ? 200 : res.outcome === 'busy' ? 409 : 422
    return Response.json(res, { status })
  },
}
