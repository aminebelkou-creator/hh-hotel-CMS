import React from 'react'
import type { AdminViewServerProps, Payload } from 'payload'
import { isSuperAdmin } from '../access'
import { Gutter } from '@payloadcms/ui'
import { IssueList } from './IssueList'
import { HelpBox, Icon, type IconName } from './ui'

type NavGroup = { label: string; entities: { slug: string; type: 'collections' | 'globals'; label: string }[] }
type Props = AdminViewServerProps & { navGroups?: NavGroup[]; user?: { id: number | string; roles?: string[] | null } | null }
type User = { id: number | string; roles?: string[] | null; email?: string; name?: string | null }
type SiteDoc = { id: number | string; name: string; slug: string; booking?: { url?: string | null } | null }

const rel = (iso?: string | null) => {
  if (!iso) return 'never'
  const d = (Date.now() - new Date(iso).getTime()) / 86400000
  return d < 1 ? 'today' : d < 2 ? 'yesterday' : `${Math.round(d)} days ago`
}
const idOf = (v: unknown) => Number(typeof v === 'object' && v ? (v as { id: unknown }).id : v)

/**
 * Admin home. A hotel sees its website: what is live, a short "get set up" list with what each
 * step does, the checks the platform ran, shortcuts to everything it edits, and help. Our team
 * sees the fleet in one table. All data is read with the signed-in user's own access.
 */
export async function Dashboard(props: Props) {
  const { payload, user: u } = props.initPageResult.req
  const user = u as User | null
  if (!user) return null
  const admin = payload.config.routes.admin
  const superAdmin = isSuperAdmin(user)
  const sites = await payload.find({ collection: 'sites', user, overrideAccess: false, limit: superAdmin ? 500 : 20, depth: 0, sort: 'name' })
  const siteIds = sites.docs.map((s) => Number(s.id))
  const none = { docs: [] as never[] }
  const openIssues = siteIds.length ? await payload.find({ collection: 'issues', user, overrideAccess: false, where: { and: [{ status: { equals: 'open' } }, { site: { in: siteIds } }] }, limit: 1000, depth: 0, sort: '-severity' }) : none
  const releases = siteIds.length ? await payload.find({ collection: 'releases', user, overrideAccess: false, where: { site: { in: siteIds } }, limit: 1000, depth: 0, sort: '-createdAt' }) : none
  const domains = siteIds.length ? await payload.find({ collection: 'domains', user, overrideAccess: false, where: { site: { in: siteIds } }, limit: 1000, depth: 0 }) : none
  const lastRelease = new Map<number, { version: string; createdAt: string }>()
  for (const r of releases.docs as { site: unknown; version: string; createdAt: string }[]) if (!lastRelease.has(idOf(r.site))) lastRelease.set(idOf(r.site), r)
  const issuesBySite = new Map<number, { error: number; warning: number; info: number }>()
  for (const i of openIssues.docs as { site: unknown; severity: string }[]) {
    const c = issuesBySite.get(idOf(i.site)) ?? { error: 0, warning: 0, info: 0 }
    c[(i.severity as 'error' | 'warning' | 'info') ?? 'info']++
    issuesBySite.set(idOf(i.site), c)
  }
  const domainsOf = (sid: number) => (domains.docs as { site: unknown; hostname: string; status: string; primary?: boolean | null }[]).filter((d) => idOf(d.site) === sid)
  const health = (sid: number) => {
    const c = issuesBySite.get(sid)
    if (c?.error) return { label: `${c.error} to fix`, tone: 'err' }
    if (c?.warning) return { label: `${c.warning} to look at`, tone: 'warn' }
    return { label: 'All good', tone: 'ok' }
  }

  if (superAdmin) {
    return (
      <Gutter>
        <div className="hh-dash">
          <h1>All hotels</h1>
          <p className="hh-dash-lead">
            {sites.totalDocs} sites, {openIssues.docs.length} open checks across the fleet. Open a hotel to act as its team would.
          </p>
          <table className="hh-fleet">
            <thead>
              <tr>
                <th>Hotel</th>
                <th>Domain</th>
                <th>Live</th>
                <th>Last publish</th>
                <th>Health</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sites.docs.map((s) => {
                const sid = Number(s.id)
                const r = lastRelease.get(sid)
                const ds = domainsOf(sid)
                const h = health(sid)
                return (
                  <tr key={sid}>
                    <td>
                      <a href={`${admin}/collections/sites/${sid}`}>{s.name}</a>
                    </td>
                    <td>{ds.length ? ds.map((d) => `${d.hostname} (${d.status})`).join(', ') : <span style={{ opacity: 0.55 }}>platform only</span>}</td>
                    <td>{r ? r.version : <span style={{ opacity: 0.55 }}>not published</span>}</td>
                    <td>{rel(r?.createdAt)}</td>
                    <td>
                      <span className={`hh-pill hh-pill--${h.tone}`}>{h.label}</span>
                    </td>
                    <td>
                      <a href={`/s/${s.slug}`} target="_blank" rel="noopener">
                        View ↗
                      </a>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Gutter>
    )
  }

  return (
    <Gutter>
      <div className="hh-dash">
        {sites.docs.length === 0 && (
          <>
            <h1>Welcome</h1>
            <p className="hh-dash-lead">Your website is being prepared. Your platform contact will let you know as soon as it is ready to edit.</p>
          </>
        )}
        {(sites.docs as unknown as SiteDoc[]).map((s) => (
          <SiteHome key={String(s.id)} payload={payload} user={user} admin={admin} site={s} release={lastRelease.get(Number(s.id))} domains={domainsOf(Number(s.id))} health={health(Number(s.id))} openCount={(openIssues.docs as { site: unknown }[]).filter((i) => idOf(i.site) === Number(s.id)).length} />
        ))}
      </div>
    </Gutter>
  )
}

type SiteHomeProps = {
  payload: Payload
  user: User
  admin: string
  site: SiteDoc
  release?: { version: string; createdAt: string }
  domains: { hostname: string; status: string; primary?: boolean | null }[]
  health: { label: string; tone: string }
  openCount: number
}

async function SiteHome({ payload, user, admin, site, release, domains, health, openCount }: SiteHomeProps) {
  const sid = Number(site.id)
  const from = `${new Date().toISOString().slice(0, 7)}-01T00:00:00.000Z`
  const count = (collection: string, where: Record<string, unknown>) =>
    payload.count({ collection: collection as 'pages', user, overrideAccess: false, where: where as never }).then((r) => r.totalDocs).catch(() => 0)
  const [pages, toCheck, confirmed, posts, reviews, messages, published, fixed, rooms] = await Promise.all([
    count('pages', { site: { equals: sid } }),
    count('facts', { and: [{ site: { equals: sid } }, { status: { equals: 'unconfirmed' } }] }),
    count('facts', { and: [{ site: { equals: sid } }, { status: { equals: 'confirmed' } }] }),
    count('posts', { and: [{ site: { equals: sid } }, { status: { equals: 'published' } }] }),
    count('reviews', { and: [{ site: { equals: sid } }, { status: { equals: 'published' } }] }),
    count('form-submissions', { createdAt: { greater_than_equal: from } }),
    count('releases', { and: [{ site: { equals: sid } }, { createdAt: { greater_than_equal: from } }] }),
    count('issues', { and: [{ site: { equals: sid } }, { status: { in: ['resolved', 'applied'] } }, { updatedAt: { greater_than_equal: from } }] }),
    count('rooms', {}),
  ])
  const domain = domains.find((d) => d.primary) ?? domains[0]
  const live = domains.some((d) => d.status === 'active' || d.status === 'verified')
  const siteUrl = `/s/${site.slug}`
  const edit = `${admin}/collections/sites/${sid}`

  const steps: { done: boolean; title: string; text: string; href: string; action: string }[] = [
    {
      done: confirmed > 0 && toCheck === 0,
      title: 'Check the facts about your hotel',
      text: toCheck ? `${toCheck} fact${toCheck > 1 ? 's' : ''} read from your current website wait for a yes or no. Only facts you confirm ever appear on the site.` : 'Address, times, services, rooms: everything the site says comes from facts you confirmed.',
      href: `${admin}/review/${sid}`,
      action: toCheck ? 'Review facts' : 'See facts',
    },
    {
      done: Boolean(site.booking?.url),
      title: 'Connect your booking engine',
      text: 'Every Book button then opens your own booking engine, with the dates the guest chose.',
      href: `${edit}#booking`,
      action: site.booking?.url ? 'Change' : 'Add it',
    },
    {
      done: Boolean(release),
      title: 'Publish your website',
      text: 'Nothing goes online until you press Publish site. Each publish is a version you can undo.',
      href: edit,
      action: 'Open publishing',
    },
    {
      done: reviews > 0,
      title: 'Show what guests say',
      text: 'Add real reviews, word for word, with where they come from. They appear on the home page.',
      href: `${admin}/collections/reviews`,
      action: reviews ? 'Manage reviews' : 'Add a review',
    },
    {
      done: posts > 0,
      title: 'Write your first blog post',
      text: 'Tips on the neighbourhood help guests and search engines. The Blog box on Website settings can draft one from your facts.',
      href: `${admin}/collections/posts`,
      action: posts ? 'See posts' : 'Start a post',
    },
    {
      done: live,
      title: 'Use your own domain',
      text: 'Point your address (e.g. www.your-hotel.com) at the new site. Your platform contact does this with you.',
      href: `${admin}/collections/domains`,
      action: 'See domains',
    },
  ]
  const done = steps.filter((s) => s.done).length

  const tiles: { icon: IconName; title: string; text: string; href: string }[] = [
    { icon: 'pages', title: 'Pages', text: `${pages} page${pages === 1 ? '' : 's'}: text, photos and sections of each page.`, href: `${admin}/collections/pages?where[site][equals]=${sid}` },
    { icon: 'bed', title: 'Rooms & offers', text: `${rooms} room type${rooms === 1 ? '' : 's'}. Descriptions, photos, current offers.`, href: `${admin}/collections/rooms` },
    { icon: 'pen', title: 'Blog', text: `${posts} published post${posts === 1 ? '' : 's'}. News and tips for guests.`, href: `${admin}/collections/posts` },
    { icon: 'star', title: 'Guest reviews', text: `${reviews} on the site. Real words only, never rewritten.`, href: `${admin}/collections/reviews` },
    { icon: 'photo', title: 'Photos', text: 'Upload from your phone; they are resized for you.', href: `${admin}/collections/media` },
    { icon: 'mail', title: 'Messages', text: `${messages} received this month through the contact form.`, href: `${admin}/collections/form-submissions` },
    { icon: 'shield', title: 'Hotel facts', text: `${confirmed} confirmed${toCheck ? `, ${toCheck} to check` : ''}. The source of every detail on the site.`, href: `${admin}/review/${sid}` },
    { icon: 'settings', title: 'Website settings', text: 'Look, languages, booking engine, publishing.', href: edit },
  ]

  return (
    <section style={{ marginBottom: 40 }}>
      <h1>Your website</h1>
      <p className="hh-dash-lead">Everything about {site.name} online: what guests see now, what to do next, and where to change it.</p>

      <div className="hh-hero-card">
        <div>
          <span className="hh-pill">{release ? `Live · version ${release.version}` : 'Not published yet'}</span>
          <h2 style={{ marginTop: 10 }}>{site.name}</h2>
          <p>{release ? `Last published ${rel(release.createdAt)}.` : 'Publish from Website settings when you are ready.'} {domain ? `Address: ${domain.hostname} (${domain.status}).` : `Preview address: ${siteUrl}`}</p>
        </div>
        <div className="hh-actions">
          <a className="hh-primary" href={siteUrl} target="_blank" rel="noopener">
            View your site ↗
          </a>
          <a href={edit}>Publish & settings</a>
          <a href={`${admin}/collections/pages?where[site][equals]=${sid}`}>Edit pages</a>
        </div>
      </div>

      <div className="hh-grid hh-grid--4">
        <Stat icon="rocket" label="Live version" value={release ? release.version : '—'} sub={release ? `published ${rel(release.createdAt)}` : 'not published yet'} />
        <Stat icon="shield" label="Site health" value={health.label} sub={openCount ? `${openCount} check${openCount > 1 ? 's' : ''} open, below` : 'the checks run every night'} tone={health.tone} />
        <Stat icon="mail" label="Messages this month" value={String(messages)} sub="from the contact form" />
        <Stat icon="calendar" label="This month" value={`${published} publish${published === 1 ? '' : 'es'}`} sub={`${fixed} check${fixed === 1 ? '' : 's'} fixed`} />
      </div>

      <div className="hh-grid hh-grid--2" style={{ marginTop: 16 }}>
        <div className="hh-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
            <h3>Get set up</h3>
            <span style={{ fontSize: 13, color: 'var(--hh-muted)' }}>
              {done} of {steps.length} done
            </span>
          </div>
          <div className="hh-progress" aria-hidden="true">
            <span style={{ width: `${Math.round((done / steps.length) * 100)}%` }} />
          </div>
          <ol className="hh-steps">
            {steps.map((s, i) => (
              <li key={s.title} className={s.done ? 'hh-step hh-step--done' : 'hh-step'}>
                <span className="hh-step-mark" aria-label={s.done ? 'Done' : `Step ${i + 1}`}>
                  {s.done ? <Icon name="check" size={14} /> : i + 1}
                </span>
                <div className="hh-step-body">
                  <strong>{s.title}</strong>
                  <p>{s.text}</p>
                </div>
                <a className="hh-btn-link" href={s.href}>
                  {s.action}
                </a>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <IssueList siteId={sid} />
          <HelpBox title="How your website works" open>
            <ol>
              <li>
                <strong>Edit</strong> a page, a room or a post and save it. Saving does not change the live site.
              </li>
              <li>
                <strong>Publish</strong> from Website settings: every saved change goes online together, in a few seconds.
              </li>
              <li>
                <strong>Undo</strong> the last publish in one click if something looks wrong; the previous version comes back.
              </li>
            </ol>
            <p>The platform checks your live site every night (broken links, missing photo descriptions, offers that ended) and lists what it found here, often with a one-click fix.</p>
          </HelpBox>
        </div>
      </div>

      <div className="hh-section-title">
        <h2>Manage your content</h2>
        <span>Each part of the site, with what you can change there</span>
      </div>
      <div className="hh-grid hh-grid--3">
        {tiles.map((t) => (
          <a key={t.title} className="hh-card hh-tile" href={t.href}>
            <span className="hh-stat-icon">
              <Icon name={t.icon} />
            </span>
            <span>
              <h3>{t.title}</h3>
              <p>{t.text}</p>
            </span>
          </a>
        ))}
      </div>
      <p style={{ fontSize: 13, color: 'var(--hh-muted)', margin: '20px 0 0' }}>
        Every change is recorded in the <a href={`${admin}/collections/audit-log`}>action log</a>. The monthly report is at <code>/api/sites/{sid}/report</code>.
      </p>
    </section>
  )
}

function Stat({ icon, label, value, sub, tone }: { icon: IconName; label: string; value: string; sub?: string; tone?: string }) {
  const color = tone === 'err' ? 'var(--hh-err)' : tone === 'warn' ? 'var(--hh-warn)' : tone === 'ok' ? 'var(--hh-ok)' : undefined
  return (
    <div className="hh-card hh-stat">
      <span className="hh-stat-icon">
        <Icon name={icon} />
      </span>
      <div>
        <div className="hh-stat-label">{label}</div>
        <div className="hh-stat-value" style={{ color }}>
          {value}
        </div>
        {sub && <div className="hh-stat-sub">{sub}</div>}
      </div>
    </div>
  )
}
