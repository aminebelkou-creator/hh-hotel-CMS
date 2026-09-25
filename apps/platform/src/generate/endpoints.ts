import type { Endpoint, PayloadRequest } from 'payload'
import { generateSite } from './generate'
import { translateSite, type Locale } from './translate'

const siteForCaller = async (req: PayloadRequest) => {
  if (!req.user) return { ok: false as const, res: Response.json({ error: 'Unauthorized' }, { status: 401 }) }
  const id = Number(req.routeParams?.id)
  if (!Number.isInteger(id)) return { ok: false as const, res: Response.json({ error: 'Bad site id' }, { status: 400 }) }
  const site = await req.payload.findByID({ collection: 'sites', id, depth: 0, user: req.user, overrideAccess: false }).catch(() => null)
  if (!site) return { ok: false as const, res: Response.json({ error: 'Not found' }, { status: 404 }) }
  const tenantId = Number(typeof site.tenant === 'object' && site.tenant ? site.tenant.id : site.tenant)
  return { ok: true as const, site, tenantId, by: `${req.user.collection}:${req.user.id}` }
}

/**
 * POST /api/sites/:id/translate { to, from? } → fills the target locale of pages and rooms with a model.
 */
export const translateEndpoint: Endpoint = {
  path: '/:id/translate',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    const s = await siteForCaller(req)
    if (!s.ok) return s.res
    const body = (await req.json?.().catch(() => ({}))) as { to?: string; from?: string }
    const locales = ['en', 'fr', 'de', 'es', 'it']
    if (!body.to || !locales.includes(body.to)) return Response.json({ error: 'to must be one of en, fr, de, es, it' }, { status: 400 })
    try {
      const res = await translateSite(req.payload, { tenantId: s.tenantId, siteId: Number(s.site.id), to: body.to as Locale, from: body.from as Locale | undefined, by: s.by })
      return Response.json(res)
    } catch (e) {
      return Response.json({ error: (e as Error).message }, { status: 422 })
    }
  },
}

/**
 * POST /api/sites/:id/generate → drafts pages and room types from the site's confirmed facts.
 * The caller's right to the site is checked with the caller's own access; the generator then
 * runs with the tenant carried explicitly. Nothing is published.
 */
export const generateEndpoint: Endpoint = {
  path: '/:id/generate',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const id = Number(req.routeParams?.id)
    if (!Number.isInteger(id)) return Response.json({ error: 'Bad site id' }, { status: 400 })
    const site = await req.payload.findByID({ collection: 'sites', id, depth: 0, user: req.user, overrideAccess: false }).catch(() => null)
    if (!site) return Response.json({ error: 'Not found' }, { status: 404 })
    const tenantId = Number(typeof site.tenant === 'object' && site.tenant ? site.tenant.id : site.tenant)
    try {
      const res = await generateSite(req.payload, { tenantId, siteId: Number(site.id), by: `${req.user.collection}:${req.user.id}` })
      return Response.json(res)
    } catch (e) {
      return Response.json({ error: (e as Error).message }, { status: 500 })
    }
  },
}
