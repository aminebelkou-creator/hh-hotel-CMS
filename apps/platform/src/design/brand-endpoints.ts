import type { Endpoint, PayloadRequest } from 'payload'
import { applyBrandProposal, proposeBrand } from './propose-brand'
import type { TemplateId } from './templates'

const siteForCaller = async (req: PayloadRequest) => {
  if (!req.user) return { ok: false as const, res: Response.json({ error: 'Unauthorized' }, { status: 401 }) }
  const id = Number(req.routeParams?.id)
  if (!Number.isInteger(id)) return { ok: false as const, res: Response.json({ error: 'Bad site id' }, { status: 400 }) }
  const site = await req.payload.findByID({ collection: 'sites', id, depth: 0, user: req.user, overrideAccess: false }).catch(() => null)
  if (!site) return { ok: false as const, res: Response.json({ error: 'Not found' }, { status: 404 }) }
  return { ok: true as const, site, tenantId: Number(typeof site.tenant === 'object' && site.tenant ? site.tenant.id : site.tenant) }
}

/** POST /api/sites/:id/propose-brand → a template and accent suggested from logo, photos and facts (stored, not applied). */
export const proposeBrandEndpoint: Endpoint = {
  path: '/:id/propose-brand',
  method: 'post',
  handler: async (req) => {
    const s = await siteForCaller(req)
    if (!s.ok) return s.res
    try {
      return Response.json(await proposeBrand(req.payload, { tenantId: s.tenantId, siteId: Number(s.site.id) }))
    } catch (e) {
      return Response.json({ error: (e as Error).message }, { status: 500 })
    }
  },
}

/** POST /api/sites/:id/apply-brand { template? } → applies the stored proposal (or one of its alternatives) after the contrast gates. */
export const applyBrandEndpoint: Endpoint = {
  path: '/:id/apply-brand',
  method: 'post',
  handler: async (req) => {
    const s = await siteForCaller(req)
    if (!s.ok) return s.res
    const body = (await req.json?.().catch(() => ({}))) as { template?: string }
    try {
      return Response.json(await applyBrandProposal(req.payload, { tenantId: s.tenantId, siteId: Number(s.site.id), template: body.template as TemplateId | undefined }))
    } catch (e) {
      return Response.json({ error: (e as Error).message }, { status: 422 })
    }
  },
}
