/**
 * Monthly service report per hotel (Phase 4): what the platform did and noticed in a month,
 * in plain words. Computed from the tenant's own rows (releases, issues, form submissions,
 * crawls); sent by email when SMTP is configured, otherwise shown in the dashboard.
 */
import type { Payload } from 'payload'

export type MonthlyReport = {
  month: string
  site: { id: number; name: string; slug: string }
  publishes: { count: number; versions: string[]; lastAt: string | null }
  issues: { opened: number; resolved: number; applied: number; stillOpen: number; byKind: Record<string, number> }
  messages: number
  imports: number
  pages: number
  text: string
}

const monthRange = (month: string) => {
  const [y, m] = month.split('-').map(Number)
  const from = new Date(Date.UTC(y, m - 1, 1))
  const to = new Date(Date.UTC(y, m, 1))
  return { from: from.toISOString(), to: to.toISOString() }
}

export async function monthlyReport(payload: Payload, args: { tenantId: number; siteId: number; month?: string; locale?: string }): Promise<MonthlyReport> {
  const site = (await payload.find({ collection: 'sites', where: { and: [{ id: { equals: args.siteId } }, { tenant: { equals: args.tenantId } }] }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
  if (!site) throw new Error(`Site ${args.siteId} not found in tenant ${args.tenantId}`)
  const month = args.month && /^\d{4}-\d{2}$/.test(args.month) ? args.month : new Date().toISOString().slice(0, 7)
  const { from, to } = monthRange(month)
  const t = { tenant: { equals: args.tenantId } }
  const inMonth = (field: string) => ({ and: [{ [field]: { greater_than_equal: from } }, { [field]: { less_than: to } }] })

  const releases = await payload.find({ collection: 'releases', where: { and: [t, { site: { equals: args.siteId } }, inMonth('createdAt')] }, sort: '-createdAt', limit: 100, depth: 0, overrideAccess: true })
  const opened = await payload.find({ collection: 'issues', where: { and: [t, { site: { equals: args.siteId } }, inMonth('detectedAt')] }, limit: 500, depth: 0, overrideAccess: true })
  const resolved = await payload.count({ collection: 'issues', where: { and: [t, { site: { equals: args.siteId } }, { status: { equals: 'resolved' } }, inMonth('resolvedAt')] }, overrideAccess: true })
  const applied = await payload.count({ collection: 'issues', where: { and: [t, { site: { equals: args.siteId } }, { status: { equals: 'applied' } }, inMonth('updatedAt')] }, overrideAccess: true })
  const stillOpen = await payload.count({ collection: 'issues', where: { and: [t, { site: { equals: args.siteId } }, { status: { equals: 'open' } }] }, overrideAccess: true })
  const messages = await payload.count({ collection: 'form-submissions', where: { and: [t, inMonth('createdAt')] }, overrideAccess: true }).catch(() => ({ totalDocs: 0 }))
  const imports = await payload.count({ collection: 'crawls', where: { and: [t, { site: { equals: args.siteId } }, inMonth('createdAt')] }, overrideAccess: true })
  const pages = await payload.count({ collection: 'pages', where: { and: [t, { site: { equals: args.siteId } }, { _status: { equals: 'published' } }] }, overrideAccess: true })
  const byKind: Record<string, number> = {}
  for (const i of opened.docs) byKind[i.kind] = (byKind[i.kind] ?? 0) + 1

  const fr = (args.locale ?? site.defaultLocale) === 'fr'
  const name = site.brandName || site.name
  const lines = fr
    ? [
        `Rapport mensuel — ${name} — ${month}`,
        `Publications : ${releases.totalDocs}${releases.totalDocs ? ` (${releases.docs.map((r) => r.version).join(', ')})` : ''}.`,
        `Pages en ligne : ${pages.totalDocs}.`,
        `Messages reçus par le formulaire de contact : ${messages.totalDocs}.`,
        `Points relevés par la plateforme : ${opened.totalDocs} (${Object.entries(byKind).map(([k, n]) => `${n} ${k}`).join(', ') || 'aucun'}) ; ${resolved.totalDocs} résolus, ${applied.totalDocs} corrigés d’un clic ; ${stillOpen.totalDocs} encore ouverts.`,
        imports.totalDocs ? `Imports depuis l’ancien site : ${imports.totalDocs}.` : '',
      ]
    : [
        `Monthly report — ${name} — ${month}`,
        `Publishes: ${releases.totalDocs}${releases.totalDocs ? ` (${releases.docs.map((r) => r.version).join(', ')})` : ''}.`,
        `Pages live: ${pages.totalDocs}.`,
        `Messages received through the contact form: ${messages.totalDocs}.`,
        `Things the platform noticed: ${opened.totalDocs} (${Object.entries(byKind).map(([k, n]) => `${n} ${k}`).join(', ') || 'none'}); ${resolved.totalDocs} resolved, ${applied.totalDocs} fixed with one tap; ${stillOpen.totalDocs} still open.`,
        imports.totalDocs ? `Imports from the previous website: ${imports.totalDocs}.` : '',
      ]
  return {
    month,
    site: { id: Number(site.id), name, slug: site.slug },
    publishes: { count: releases.totalDocs, versions: releases.docs.map((r) => r.version), lastAt: releases.docs[0]?.createdAt ?? null },
    issues: { opened: opened.totalDocs, resolved: resolved.totalDocs, applied: applied.totalDocs, stillOpen: stillOpen.totalDocs, byKind },
    messages: messages.totalDocs,
    imports: imports.totalDocs,
    pages: pages.totalDocs,
    text: lines.filter(Boolean).join('\n'),
  }
}

/** Email the report to the tenant's users when an email adapter is configured. */
export async function sendMonthlyReport(payload: Payload, args: { tenantId: number; siteId: number; month?: string }): Promise<{ sent: number; to: string[]; text: string }> {
  const report = await monthlyReport(payload, args)
  const users = await payload.find({ collection: 'users', where: { 'tenants.tenant': { equals: args.tenantId } }, limit: 20, depth: 0, overrideAccess: true })
  const to = users.docs.map((u) => u.email).filter(Boolean)
  if (!process.env.SMTP_HOST || !to.length) return { sent: 0, to, text: report.text }
  await payload.sendEmail({ to: to.join(', '), subject: report.text.split('\n')[0], text: report.text })
  return { sent: to.length, to, text: report.text }
}
