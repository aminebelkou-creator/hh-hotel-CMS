import type { Endpoint, PayloadRequest } from 'payload'
import { timingSafeEqual } from 'node:crypto'
import { checkSite, recordFindings, type Finding } from './check'
import { monthlyReport, sendMonthlyReport } from './report'
import { ISSUE_KINDS } from './kinds'

/**
 * POST /api/sites/:id/check              → run the checks for one site (caller's access).
 * POST /api/issues/:id/apply             → apply the proposed fix under the caller's own rights.
 * POST /api/health/run  { limit, offset } → service token: run the checks for every live site (nightly).
 * POST /api/health/report { site, findings } → service token: record findings from the nightly browser run.
 */
const publicBase = () => process.env.PUBLIC_BASE_URL || process.env.RELEASE_VERIFY_BASE_URL || undefined
const tenantOf = (doc: { tenant?: unknown }) => Number(typeof doc.tenant === 'object' && doc.tenant ? (doc.tenant as { id: unknown }).id : doc.tenant)

const serviceOk = (req: PayloadRequest) => {
  const expected = process.env.HEALTH_TOKEN || ''
  const given = req.headers.get('x-health-token') || ''
  if (!expected || expected.length < 16 || given.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected))
}

export const checkSiteEndpoint: Endpoint = {
  path: '/:id/check',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const id = Number(req.routeParams?.id)
    if (!Number.isInteger(id)) return Response.json({ error: 'Bad site id' }, { status: 400 })
    const site = await req.payload.findByID({ collection: 'sites', id, depth: 0, user: req.user, overrideAccess: false }).catch(() => null)
    if (!site) return Response.json({ error: 'Not found' }, { status: 404 })
    try {
      return Response.json(await checkSite(req.payload, { tenantId: tenantOf(site), siteId: Number(site.id), publicBase: publicBase() }))
    } catch (e) {
      return Response.json({ error: (e as Error).message }, { status: 500 })
    }
  },
}

export const applyIssueEndpoint: Endpoint = {
  path: '/:id/apply',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const id = Number(req.routeParams?.id)
    if (!Number.isInteger(id)) return Response.json({ error: 'Bad issue id' }, { status: 400 })
    const issue = await req.payload.findByID({ collection: 'issues', id, depth: 0, user: req.user, overrideAccess: false }).catch(() => null)
    if (!issue) return Response.json({ error: 'Not found' }, { status: 404 })
    if (issue.status !== 'open') return Response.json({ error: `Issue is ${issue.status}` }, { status: 409 })
    const fix = issue.fix as { collection: 'pages' | 'offers'; id: number; data: Record<string, unknown>; locale?: string } | null
    if (!fix || !['pages', 'offers'].includes(fix.collection)) return Response.json({ error: 'No fix to apply' }, { status: 422 })
    try {
      // The caller's own access decides whether the target may be changed at all (their tenant only).
      await req.payload.update({
        collection: fix.collection,
        id: fix.id,
        data: fix.data as never,
        locale: (fix.locale as 'en' | 'fr' | undefined) ?? undefined,
        ...(fix.collection === 'pages' ? { draft: true } : {}),
        user: req.user,
        overrideAccess: false,
        context: { generation: true },
      })
    } catch (e) {
      return Response.json({ error: `Could not apply: ${(e as Error).message}` }, { status: 422 })
    }
    await req.payload.update({ collection: 'issues', id: issue.id, data: { status: 'applied', appliedBy: `${req.user.collection}:${req.user.id}` } as never, overrideAccess: true })
    return Response.json({ applied: true, note: fix.collection === 'pages' ? 'Saved as a draft on the page: publish the page, then the site.' : 'Applied; publish the site to update what guests see.' })
  },
}

export const healthRunEndpoint: Endpoint = {
  path: '/health/run',
  method: 'post',
  handler: async (req) => {
    if (!serviceOk(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const body = (await req.json?.().catch(() => ({}))) as { limit?: number; offset?: number }
    const limit = Math.min(20, Math.max(1, Number(body.limit ?? 5)))
    const offset = Math.max(0, Number(body.offset ?? 0))
    const sites = await req.payload.find({ collection: 'sites', where: { currentRelease: { exists: true } }, sort: 'id', limit, page: Math.floor(offset / limit) + 1, depth: 0, overrideAccess: true })
    const results = []
    for (const s of sites.docs) {
      try {
        results.push({ slug: s.slug, ...(await checkSite(req.payload, { tenantId: tenantOf(s), siteId: Number(s.id), publicBase: publicBase() })) })
      } catch (e) {
        results.push({ slug: s.slug, error: (e as Error).message })
      }
    }
    return Response.json({ total: sites.totalDocs, offset, limit, results })
  },
}

export const healthReportEndpoint: Endpoint = {
  path: '/health/report',
  method: 'post',
  handler: async (req) => {
    if (!serviceOk(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const body = (await req.json?.().catch(() => ({}))) as { site?: string; source?: string; findings?: Partial<Finding>[] }
    if (!body.site) return Response.json({ error: 'site (slug) required' }, { status: 400 })
    const site = (await req.payload.find({ collection: 'sites', where: { slug: { equals: body.site } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
    if (!site) return Response.json({ error: 'Unknown site' }, { status: 404 })
    const findings: Finding[] = (body.findings ?? [])
      .filter((f) => f && typeof f.title === 'string' && typeof f.fingerprint === 'string' && (ISSUE_KINDS as readonly string[]).includes(String(f.kind)))
      .map((f) => ({ kind: f.kind as Finding['kind'], severity: (['info', 'warning', 'error'].includes(String(f.severity)) ? f.severity : 'warning') as Finding['severity'], title: String(f.title).slice(0, 200), detail: f.detail ? String(f.detail).slice(0, 2000) : undefined, url: f.url ? String(f.url).slice(0, 500) : undefined, fingerprint: String(f.fingerprint).slice(0, 200) }))
    const source = /^[a-z0-9-]{1,40}$/.test(String(body.source ?? '')) ? String(body.source) : 'nightly'
    return Response.json(await recordFindings(req.payload, { tenantId: tenantOf(site), siteId: Number(site.id), findings, source }))
  },
}

/** GET /api/sites/:id/report?month=YYYY-MM → the monthly service report; POST …/report/send emails it (SMTP). */
const siteForCaller = async (req: PayloadRequest) => {
  if (!req.user) return null
  const id = Number(req.routeParams?.id)
  if (!Number.isInteger(id)) return null
  return req.payload.findByID({ collection: 'sites', id, depth: 0, user: req.user, overrideAccess: false }).catch(() => null)
}
export const reportEndpoint: Endpoint = {
  path: '/:id/report',
  method: 'get',
  handler: async (req) => {
    if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const site = await siteForCaller(req)
    if (!site) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json(await monthlyReport(req.payload, { tenantId: tenantOf(site), siteId: Number(site.id), month: req.searchParams?.get('month') ?? undefined }))
  },
}
export const sendReportEndpoint: Endpoint = {
  path: '/:id/report/send',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const site = await siteForCaller(req)
    if (!site) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json(await sendMonthlyReport(req.payload, { tenantId: tenantOf(site), siteId: Number(site.id), month: req.searchParams?.get('month') ?? undefined }))
  },
}
