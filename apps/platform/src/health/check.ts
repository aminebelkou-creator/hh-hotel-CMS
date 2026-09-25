/**
 * Site checks (Phase 4): what a person would notice on a hotel's website, found nightly and
 * written as issues with a proposed fix where one is safe to apply with one tap.
 *
 * Reads the LIVE release only (what guests see), plus the offers table for expiry. Runs for
 * (tenantId, siteId) with the tenant carried explicitly; every query filters on it.
 * Network: link checks with a short timeout, a few at a time; the platform never crawls
 * beyond the links the hotel itself published.
 */
import type { Payload } from 'payload'
import { loadLiveRelease } from '../releases/resolve'
import type { SiteSnapshot } from '../releases/snapshot'
import { ISSUE_KINDS } from './kinds'

export type Finding = {
  kind: (typeof ISSUE_KINDS)[number]
  severity: 'info' | 'warning' | 'error'
  title: string
  detail?: string
  url?: string
  fingerprint: string
  fix?: { collection: 'pages' | 'offers'; id: number; data: Record<string, unknown>; locale?: string }
  fixLabel?: string
}
export type CheckResult = { siteId: number; findings: number; opened: number; reopened: number; resolved: number; skipped?: string }

const STALE_DAYS = 90
const SLOW_MS = 3000

const strOf = (v: unknown): string => (typeof v === 'string' ? v : v && typeof v === 'object' ? String(Object.values(v as Record<string, unknown>).find((x) => typeof x === 'string' && x) ?? '') : '')

/** Every link and image address the published pages carry, with where it sits. */
export function linksOf(snapshot: SiteSnapshot): { href: string; where: string; page: string }[] {
  const out: { href: string; where: string; page: string }[] = []
  const push = (href: unknown, where: string, page: string) => {
    if (typeof href === 'string' && href.trim()) out.push({ href: href.trim(), where, page })
  }
  if (snapshot.site.cta?.href) push(snapshot.site.cta.href, 'header button', 'site')
  if (snapshot.site.logoUrl) push(snapshot.site.logoUrl, 'logo', 'site')
  for (const p of snapshot.pages) {
    for (const b of p.blocks as Record<string, unknown>[]) {
      for (const k of ['ctaHref', 'buttonHref', 'linkHref', 'imageUrl']) push(b[k], `${b.blockType} block`, p.slug)
      for (const img of (b.images as { url?: string }[] | undefined) ?? []) push(img.url, 'gallery photo', p.slug)
    }
  }
  return out
}

const checkUrl = async (href: string): Promise<{ ok: boolean; status: number; ms: number }> => {
  const t0 = Date.now()
  try {
    let r = await fetch(href, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(8000), headers: { 'user-agent': 'hh-health/1.0' } })
    if (r.status === 405 || r.status === 403) r = await fetch(href, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(8000), headers: { 'user-agent': 'hh-health/1.0' } })
    return { ok: r.ok, status: r.status, ms: Date.now() - t0 }
  } catch {
    return { ok: false, status: 0, ms: Date.now() - t0 }
  }
}

export async function findIssues(payload: Payload, args: { tenantId: number; siteId: number; publicBase?: string; fetchLinks?: boolean }): Promise<{ findings: Finding[]; skipped?: string }> {
  const site = (await payload.find({ collection: 'sites', where: { and: [{ id: { equals: args.siteId } }, { tenant: { equals: args.tenantId } }] }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
  if (!site) throw new Error(`Site ${args.siteId} not found in tenant ${args.tenantId}`)
  const live = await loadLiveRelease(payload, site.slug)
  if (!live || Number(live.site.id) !== Number(site.id)) return { findings: [], skipped: 'no live release' }
  const snap = live.release.snapshot
  const findings: Finding[] = []
  const d = snap.site.defaultLocale
  const pageSlugs = new Set(snap.pages.map((p) => p.slug))

  // 1. Links and images: internal slugs must exist; external addresses must answer.
  const links = linksOf(snap)
  const seen = new Set<string>()
  for (const l of links) {
    if (/^(tel:|mailto:|#)/i.test(l.href)) continue
    if (/^https?:\/\//i.test(l.href)) {
      if (args.fetchLinks === false || seen.has(l.href)) continue
      seen.add(l.href)
      if (seen.size > 40) break
      const r = await checkUrl(l.href)
      if (!r.ok) findings.push({ kind: 'broken-link', severity: 'error', title: `A link does not answer (${r.status || 'timeout'})`, detail: `${l.where} on page "${l.page}": ${l.href}`, url: l.href, fingerprint: `link:${l.href}` })
    } else {
      const slug = l.href.replace(/^\/+/, '').split(/[?#]/)[0]
      if (slug && slug !== 'home' && !pageSlugs.has(slug)) findings.push({ kind: 'broken-link', severity: 'error', title: `A link points to a page that is not published: "${slug}"`, detail: `${l.where} on page "${l.page}"`, fingerprint: `slug:${l.page}:${slug}` })
    }
  }

  // 2. Photos without a description (screen readers, search engines).
  for (const p of snap.pages) {
    for (const [i, b] of (p.blocks as Record<string, unknown>[]).entries()) {
      const imgs = (b.images as { url?: string; alt?: unknown }[] | undefined) ?? []
      const missing = imgs.filter((img) => img.url && !strOf(img.alt)).length
      if (missing) findings.push({ kind: 'missing-alt', severity: 'warning', title: `${missing} photo${missing > 1 ? 's' : ''} without a description on "${p.slug}"`, detail: 'Add what each photo shows (gallery block, "alt").', fingerprint: `alt:${p.id}:${i}` })
      if (b.imageUrl && !strOf(b.imageAlt)) findings.push({ kind: 'missing-alt', severity: 'warning', title: `A photo without a description on "${p.slug}"`, detail: `${b.blockType} block`, fingerprint: `alt:${p.id}:${i}:image` })
    }
  }

  // 3. Search preview text missing: propose the first paragraph.
  for (const p of snap.pages) {
    if (strOf(p.seo?.description)) continue
    const text = (p.blocks as Record<string, unknown>[]).map((b) => strOf(b.body ?? b.intro ?? b.subheading ?? b.text)).find((t) => t.length > 40)
    const proposal = text ? text.replace(/\s+/g, ' ').slice(0, 155).replace(/\s\S*$/, '') : undefined
    findings.push({
      kind: 'missing-meta',
      severity: 'warning',
      title: `No search description on "${p.slug}"`,
      detail: proposal ? `Proposed: “${proposal}”` : 'Write one or two sentences under SEO → description.',
      fingerprint: `meta:${p.id}`,
      ...(proposal ? { fix: { collection: 'pages', id: p.id, data: { meta: { description: proposal } }, locale: d }, fixLabel: 'Use the first paragraph as the search description' } : {}),
    })
  }

  // 4. Freshness: an old release, and offers past their date still active.
  const rel = await payload.findByID({ collection: 'releases', id: live.release.id, depth: 0, overrideAccess: true }).catch(() => null)
  const ageDays = rel ? (Date.now() - new Date(rel.createdAt).getTime()) / 86400000 : 0
  if (ageDays > STALE_DAYS) findings.push({ kind: 'stale-content', severity: 'info', title: `Nothing published for ${Math.round(ageDays)} days`, detail: 'Guests and search engines like a living site: an offer, a season, a photo.', fingerprint: 'stale' })
  const offers = await payload.find({ collection: 'offers', where: { and: [{ tenant: { equals: args.tenantId } }, { active: { equals: true } }, { validTo: { less_than: new Date().toISOString() } }] }, limit: 50, depth: 0, overrideAccess: true }).catch(() => ({ docs: [] as { id: number; slug: string; validTo?: string | null }[] }))
  for (const o of offers.docs) {
    findings.push({ kind: 'expired-offer', severity: 'info', title: `The offer "${o.slug}" ended on ${String(o.validTo).slice(0, 10)}`, detail: 'It is no longer shown to guests; deactivate it to keep the list tidy.', fingerprint: `offer:${o.id}`, fix: { collection: 'offers', id: Number(o.id), data: { active: false } }, fixLabel: 'Deactivate the offer' })
  }

  // 5. Facts search engines expect for a hotel.
  const has = (k: string) => snap.facts.some((f) => f.key === k && f.value)
  for (const [key, label] of [['contact.phone', 'a phone number'], ['address', 'the address'], ['geo.lat', 'the map position'], ['policy.checkin', 'the check-in time'], ['policy.checkout', 'the check-out time']] as const) {
    if (!has(key)) findings.push({ kind: 'missing-fact', severity: key === 'geo.lat' ? 'info' : 'warning', title: `Google does not know ${label}`, detail: `Confirm the fact "${key}" (Facts, or the review screen) and publish.`, fingerprint: `fact:${key}` })
  }

  // 6. Is the site up, and fast enough, from here.
  if (args.publicBase) {
    const url = `${args.publicBase.replace(/\/+$/, '')}/s/${site.slug}`
    const r = await checkUrl(url)
    if (!r.ok) findings.push({ kind: 'uptime', severity: 'error', title: `The site did not answer (${r.status || 'timeout'})`, url, fingerprint: 'uptime' })
    else if (r.ms > SLOW_MS) findings.push({ kind: 'performance', severity: 'warning', title: `The home page took ${(r.ms / 1000).toFixed(1)} s`, url, fingerprint: 'slow' })
  }
  return { findings }
}

/** Write findings as issues: open new ones, refresh or reopen matching ones, resolve what disappeared. */
export async function recordFindings(payload: Payload, args: { tenantId: number; siteId: number; findings: Finding[]; source: string; resolveMissing?: boolean }): Promise<Omit<CheckResult, 'skipped'>> {
  const existing = await payload.find({ collection: 'issues', where: { and: [{ tenant: { equals: args.tenantId } }, { site: { equals: args.siteId } }] }, limit: 1000, depth: 0, overrideAccess: true })
  const byFp = new Map(existing.docs.map((d) => [d.fingerprint, d]))
  const now = new Date().toISOString()
  let opened = 0
  let reopened = 0
  let resolved = 0
  const seen = new Set<string>()
  for (const f of args.findings) {
    seen.add(f.fingerprint)
    const cur = byFp.get(f.fingerprint)
    const data = { kind: f.kind, severity: f.severity, title: f.title, detail: f.detail, url: f.url, fix: (f.fix ?? null) as unknown as Record<string, unknown>, fixLabel: f.fixLabel, source: args.source, detectedAt: now }
    if (!cur) {
      await payload.create({ collection: 'issues', data: { ...data, tenant: args.tenantId, site: args.siteId, fingerprint: f.fingerprint, status: 'open' } as never, overrideAccess: true })
      opened++
    } else if (cur.status === 'resolved') {
      await payload.update({ collection: 'issues', id: cur.id, data: { ...data, status: 'open', resolvedAt: null } as never, overrideAccess: true })
      reopened++
    } else if (cur.status === 'open') {
      await payload.update({ collection: 'issues', id: cur.id, data: data as never, overrideAccess: true })
    }
    // dismissed and applied: left alone until the fingerprint disappears
  }
  if (args.resolveMissing !== false) {
    for (const d of existing.docs) {
      if (seen.has(d.fingerprint) || d.source !== args.source) continue
      if (d.status === 'open' || d.status === 'applied') {
        await payload.update({ collection: 'issues', id: d.id, data: { status: 'resolved', resolvedAt: now } as never, overrideAccess: true })
        resolved++
      }
    }
  }
  return { siteId: args.siteId, findings: args.findings.length, opened, reopened, resolved }
}

export async function checkSite(payload: Payload, args: { tenantId: number; siteId: number; publicBase?: string; fetchLinks?: boolean }): Promise<CheckResult> {
  const { findings, skipped } = await findIssues(payload, args)
  if (skipped) return { siteId: args.siteId, findings: 0, opened: 0, reopened: 0, resolved: 0, skipped }
  return recordFindings(payload, { tenantId: args.tenantId, siteId: args.siteId, findings, source: 'check' })
}
