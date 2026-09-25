import type { Endpoint } from 'payload'

/**
 * POST /api/contact: a visitor's contact-form submission, from the hotel's own domain or the
 * platform host. Visitors are anonymous, and the multi-tenant plugin rightly refuses anonymous
 * writes to a tenant field over REST, so the submission is stored through the Local API with
 * the tenant taken from the form itself: it can never land in another hotel's inbox.
 * Bot checks: a honeypot field no person fills, and a minimum time since the form was opened.
 * The form-builder plugin's own hooks then send the hotel its email.
 */
export const contactEndpoint: Endpoint = {
  path: '/contact',
  method: 'post',
  handler: async (req) => {
    const body = (await req.json?.().catch(() => null)) as { form?: unknown; submissionData?: { field?: unknown; value?: unknown }[] } | null
    const formId = Number(typeof body?.form === 'object' && body.form ? (body.form as { id: number }).id : body?.form)
    const rows = Array.isArray(body?.submissionData) ? body!.submissionData! : null
    if (!Number.isFinite(formId) || !rows) return Response.json({ error: 'Bad request' }, { status: 400 })
    const clean = rows
      .filter((r) => typeof r.field === 'string' && r.field.length <= 100)
      .map((r) => ({ field: String(r.field), value: String(r.value ?? '').slice(0, 5000) }))
    const honey = clean.find((r) => r.field === '_hp')
    if (honey && honey.value.trim()) return Response.json({ error: 'Rejected' }, { status: 422 })
    const started = Number(clean.find((r) => r.field === '_t')?.value)
    if (!Number.isFinite(started) || Date.now() - started < 2500) return Response.json({ error: 'Rejected' }, { status: 422 })
    const form = await req.payload.findByID({ collection: 'forms', id: formId, depth: 0, overrideAccess: true }).catch(() => null)
    if (!form) return Response.json({ error: 'Unknown form' }, { status: 404 })
    const tenant = Number(typeof form.tenant === 'object' && form.tenant ? (form.tenant as { id: number }).id : form.tenant)
    const allowed = new Set((form.fields ?? []).map((f) => (f as { name?: string }).name).filter(Boolean))
    const submissionData = clean.filter((r) => allowed.has(r.field))
    for (const f of form.fields ?? []) {
      const field = f as { name?: string; required?: boolean | null; blockType: string }
      if (field.required && field.blockType !== 'message' && !submissionData.find((r) => r.field === field.name && r.value.trim())) {
        return Response.json({ error: `Missing ${field.name}` }, { status: 400 })
      }
    }
    const doc = await req.payload.create({
      collection: 'form-submissions',
      data: { form: formId, tenant, submissionData } as never,
      overrideAccess: true,
    })
    return Response.json({ ok: true, id: doc.id }, { status: 201 })
  },
}
