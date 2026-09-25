import React from 'react'
import type { AdminViewServerProps, Payload } from 'payload'
import { isSuperAdmin } from '../access'
import { Gutter } from '@payloadcms/ui'
import { IssueList } from './IssueList'

type NavGroup = { label: string; entities: { slug: string; type: 'collections' | 'globals'; label: string }[] }
type Props = AdminViewServerProps & { navGroups?: NavGroup[]; user?: { id: number | string; roles?: string[] | null } | null }

const rel = (iso?: string | null) => {
  if (!iso) return 'never'
  const d = (Date.now() - new Date(iso).getTime()) / 86400000
  return d < 1 ? 'today' : d < 2 ? 'yesterday' : `${Math.round(d)} days ago`
}

/**
 * Admin home (Phase 4). A hotel sees its website's state: live version, last publish, open
 * issues with one-tap fixes, this month's numbers, the next steps. Our team sees the fleet:
 * every hotel with its domain, last publish, open issues and health, in one table.
 * All data is read with the signed-in user's own access.
 */
export async function Dashboard(props: Props) {
  const { payload, user: u } = props.initPageResult.req
  const user = u as { id: number | string; roles?: string[] | null; email?: string } | null
  if (!user) return null
  const admin = props.initPageResult.req.payload.config.routes.admin
  const superAdmin = isSuperAdmin(user)
  const sites = await payload.find({ collection: 'sites', user, overrideAccess: false, limit: superAdmin ? 500 : 20, depth: 0, sort: 'name' })
  const siteIds = sites.docs.map((s) => Number(s.id))
  const openIssues = siteIds.length ? await payload.find({ collection: 'issues', user, overrideAccess: false, where: { and: [{ status: { equals: 'open' } }, { site: { in: siteIds } }] }, limit: 1000, depth: 0, sort: '-severity' }) : { docs: [] as never[] }
  const releases = siteIds.length ? await payload.find({ collection: 'releases', user, overrideAccess: false, where: { site: { in: siteIds } }, limit: 1000, depth: 0, sort: '-createdAt' }) : { docs: [] as never[] }
  const domains = siteIds.length ? await payload.find({ collection: 'domains', user, overrideAccess: false, where: { site: { in: siteIds } }, limit: 1000, depth: 0 }) : { docs: [] as never[] }
  const lastRelease = new Map<number, { version: string; createdAt: string }>()
  for (const r of releases.docs as { site: unknown; version: string; createdAt: string }[]) {
    const sid = Number(typeof r.site === 'object' && r.site ? (r.site as { id: unknown }).id : r.site)
    if (!lastRelease.has(sid)) lastRelease.set(sid, r)
  }
  const issuesBySite = new Map<number, { error: number; warning: number; info: number }>()
  for (const i of openIssues.docs as { site: unknown; severity: string }[]) {
    const sid = Number(typeof i.site === 'object' && i.site ? (i.site as { id: unknown }).id : i.site)
    const c = issuesBySite.get(sid) ?? { error: 0, warning: 0, info: 0 }
    c[(i.severity as 'error' | 'warning' | 'info') ?? 'info']++
    issuesBySite.set(sid, c)
  }
  const domainOf = (sid: number) => (domains.docs as { site: unknown; hostname: string; status: string; primary?: boolean | null }[]).filter((d) => Number(typeof d.site === 'object' && d.site ? (d.site as { id: unknown }).id : d.site) === sid)
  const health = (sid: number) => {
    const c = issuesBySite.get(sid)
    if (!c) return { label: 'good', color: '#1f7a3d' }
    if (c.error) return { label: `${c.error} to fix`, color: '#b42318' }
    if (c.warning) return { label: `${c.warning} to look at`, color: '#b54708' }
    return { label: 'good', color: '#1f7a3d' }
  }

  return (
    <Gutter>
    <div style={{ padding: '0 0 40px' }}>
      <h1 style={{ margin: '24px 0 4px' }}>{superAdmin ? 'All hotels' : 'Your website'}</h1>
      <p style={{ margin: '0 0 20px', opacity: 0.75 }}>
        {superAdmin ? `${sites.totalDocs} sites, ${openIssues.docs.length} open issues across the fleet.` : 'What is live, what the platform noticed, and what to do next.'}
      </p>

      {superAdmin ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', opacity: 0.7 }}>
              <th style={th}>Hotel</th>
              <th style={th}>Domain</th>
              <th style={th}>Live</th>
              <th style={th}>Last publish</th>
              <th style={th}>Health</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {sites.docs.map((s) => {
              const sid = Number(s.id)
              const r = lastRelease.get(sid)
              const ds = domainOf(sid)
              const h = health(sid)
              return (
                <tr key={sid} style={{ borderTop: '1px solid var(--theme-elevation-150)' }}>
                  <td style={td}>
                    <a href={`${admin}/collections/sites/${sid}`}>{s.name}</a>
                  </td>
                  <td style={td}>{ds.length ? ds.map((d) => `${d.hostname} (${d.status})`).join(', ') : <span style={{ opacity: 0.5 }}>platform only</span>}</td>
                  <td style={td}>{r ? r.version : <span style={{ opacity: 0.5 }}>not published</span>}</td>
                  <td style={td}>{rel(r?.createdAt)}</td>
                  <td style={{ ...td, color: h.color, fontWeight: 600 }}>{h.label}</td>
                  <td style={td}>
                    <a href={`/s/${s.slug}`} target="_blank" rel="noopener">
                      view ↗
                    </a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      ) : (
        sites.docs.map((s) => {
          const sid = Number(s.id)
          const r = lastRelease.get(sid)
          const ds = domainOf(sid)
          const h = health(sid)
          const mine = (openIssues.docs as { site: unknown; id: number }[]).filter((i) => Number(typeof i.site === 'object' && i.site ? (i.site as { id: unknown }).id : i.site) === sid)
          return (
            <section key={sid} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 14 }}>
                <Stat label="Site" value={s.name} href={`${admin}/collections/sites/${sid}`} />
                <Stat label="Live version" value={r ? r.version : 'not published'} sub={r ? rel(r.createdAt) : 'publish from the Website panel'} />
                <Stat label="Domain" value={ds.find((d) => d.primary)?.hostname ?? ds[0]?.hostname ?? 'platform address'} sub={ds[0] ? ds[0].status : `/s/${s.slug}`} />
                <Stat label="Health" value={h.label} color={h.color} sub={`${mine.length} open`} />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, fontSize: 13 }}>
                <a href={`${admin}/collections/pages?where[site][equals]=${sid}`} style={link}>Pages</a>
                <a href={`${admin}/review/${sid}`} style={link}>Review facts</a>
                <a href={`${admin}/collections/media`} style={link}>Photos</a>
                <a href={`${admin}/collections/form-submissions`} style={link}>Messages</a>
                <a href={`${admin}/collections/audit-log`} style={link}>Action log</a>
                <a href={`/s/${s.slug}`} target="_blank" rel="noopener" style={link}>View site ↗</a>
              </div>
              <IssueList siteId={sid} />
              <ReportBox payload={payload} user={user} siteId={sid} />
            </section>
          )
        })
      )}
    </div>
    </Gutter>
  )
}

async function ReportBox({ payload, user, siteId }: { payload: Payload; user: { id: number | string }; siteId: number }) {
  const month = new Date().toISOString().slice(0, 7)
  const from = `${month}-01T00:00:00.000Z`
  const rel = await payload.count({ collection: 'releases', user, overrideAccess: false, where: { and: [{ site: { equals: siteId } }, { createdAt: { greater_than_equal: from } }] } })
  const msgs = await payload.count({ collection: 'form-submissions', user, overrideAccess: false, where: { createdAt: { greater_than_equal: from } } }).catch(() => ({ totalDocs: 0 }))
  const fixed = await payload.count({ collection: 'issues', user, overrideAccess: false, where: { and: [{ site: { equals: siteId } }, { status: { in: ['resolved', 'applied'] } }, { updatedAt: { greater_than_equal: from } }] } })
  return (
    <p style={{ fontSize: 13, opacity: 0.8, margin: '12px 0 0' }}>
      This month: {rel.totalDocs} publish{rel.totalDocs === 1 ? '' : 'es'}, {msgs.totalDocs} message{msgs.totalDocs === 1 ? '' : 's'} received, {fixed.totalDocs} issue{fixed.totalDocs === 1 ? '' : 's'} fixed. The full monthly report is at{' '}
      <code>/api/sites/{siteId}/report</code>.
    </p>
  )
}

function Stat({ label, value, sub, href, color }: { label: string; value: string; sub?: string; href?: string; color?: string }) {
  return (
    <div style={{ minWidth: 160, padding: '10px 14px', border: '1px solid var(--theme-elevation-150)', borderRadius: 6, background: 'var(--theme-elevation-50)' }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em', opacity: 0.6 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color }}>{href ? <a href={href}>{value}</a> : value}</div>
      {sub && <div style={{ fontSize: 12, opacity: 0.7 }}>{sub}</div>}
    </div>
  )
}

const th: React.CSSProperties = { padding: '6px 8px' }
const td: React.CSSProperties = { padding: '8px' }
const link: React.CSSProperties = { padding: '6px 10px', border: '1px solid var(--theme-elevation-250)', borderRadius: 4, textDecoration: 'none' }
