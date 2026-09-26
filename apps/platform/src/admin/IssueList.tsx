'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { useConfig } from '@payloadcms/ui'

type Issue = { id: number; kind: string; severity: string; title: string; detail?: string | null; url?: string | null; status: string; fixLabel?: string | null; fix?: Record<string, unknown> | null; detectedAt?: string | null }
const COLOR: Record<string, string> = { error: '#b42318', warning: '#b54708', info: '#1f5fa8' }

/** Open issues of one site with one-tap fixes, dismiss, and "check now". Uses the user's own session. */
export function IssueList({ siteId }: { siteId: number }) {
  const { config } = useConfig()
  const api = `${config.serverURL ?? ''}${config.routes.api}`
  const [issues, setIssues] = useState<Issue[]>([])
  const [busy, setBusy] = useState<number | 'check' | null>(null)
  const [note, setNote] = useState<string | null>(null)

  const load = useCallback(async () => {
    const r = await fetch(`${api}/issues?where[site][equals]=${siteId}&where[status][equals]=open&limit=100&depth=0&sort=severity`, { credentials: 'include' }).then((x) => (x.ok ? x.json() : { docs: [] }))
    setIssues(r.docs ?? [])
  }, [api, siteId])
  useEffect(() => {
    void load()
  }, [load])

  const apply = async (i: Issue) => {
    setBusy(i.id)
    setNote(null)
    try {
      const r = await fetch(`${api}/issues/${i.id}/apply`, { method: 'POST', credentials: 'include' })
      const j = (await r.json().catch(() => ({}))) as { note?: string; error?: string }
      setNote(r.ok ? (j.note ?? 'Applied.') : (j.error ?? `Failed (HTTP ${r.status})`))
    } finally {
      setBusy(null)
      void load()
    }
  }
  const dismiss = async (group: Issue[]) => {
    setBusy(group[0].id)
    try {
      for (const i of group) await fetch(`${api}/issues/${i.id}`, { method: 'PATCH', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'dismissed' }) })
    } finally {
      setBusy(null)
      void load()
    }
  }
  const check = async () => {
    setBusy('check')
    setNote(null)
    try {
      const r = await fetch(`${api}/sites/${siteId}/check`, { method: 'POST', credentials: 'include' })
      const j = (await r.json().catch(() => ({}))) as { findings?: number; opened?: number; resolved?: number; skipped?: string; error?: string }
      setNote(r.ok ? (j.skipped ? `Not checked: ${j.skipped}.` : `Checked: ${j.findings} finding(s), ${j.opened} new, ${j.resolved} resolved.`) : (j.error ?? `Failed (HTTP ${r.status})`))
    } finally {
      setBusy(null)
      void load()
    }
  }

  const order = { error: 0, warning: 1, info: 2 } as Record<string, number>
  const sorted = [...issues].sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3))
  // The same finding on several pages reads as one line ("on 8 pages"), not eight.
  const groups: Issue[][] = []
  for (const i of sorted) {
    const g = groups.find((x) => x[0].title === i.title && x[0].severity === i.severity && !i.fix && !x[0].fix)
    if (g) g.push(i)
    else groups.push([i])
  }
  return (
    <div className="hh-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <p className="hh-panel-title">What the platform noticed</p>
          <p className="hh-panel-lead">Checks of your live site: links, photo descriptions, offers, search texts. Fix it where it lives, or dismiss what does not matter.</p>
        </div>
        <button type="button" className="hh-mini-btn" disabled={busy !== null} onClick={check}>
          {busy === 'check' ? 'Checking…' : 'Check now'}
        </button>
      </div>
      {note && (
        <p role="status" style={{ margin: '0 0 8px', fontSize: 13 }}>
          {note}
        </p>
      )}
      {groups.length === 0 && <p className="hh-empty">✓ Nothing to fix. The checks run again tonight.</p>}
      <div className="hh-issues">
        {groups.map((g) => {
          const i = g[0]
          const details = g.map((x) => x.detail).filter(Boolean) as string[]
          return (
            <div key={i.id} className="hh-issue">
              <span className="hh-issue-dot" style={{ background: COLOR[i.severity] ?? 'currentColor' }} aria-label={i.severity} />
              <div className="hh-issue-body">
                <strong>
                  {i.title}
                  {g.length > 1 ? ` · ${g.length} places` : ''}
                </strong>
                {details.length > 0 && <span style={{ whiteSpace: 'pre-line' }}>{details.slice(0, 3).join('\n') + (details.length > 3 ? `\n… and ${details.length - 3} more` : '')}</span>}
                {i.url && (
                  <div>
                    <a href={i.url} target="_blank" rel="noopener" style={{ fontSize: 12 }}>
                      {i.url}
                    </a>
                  </div>
                )}
              </div>
              <div className="hh-issue-actions">
                {i.fix && g.length === 1 && (
                  <button type="button" className="hh-mini-btn hh-mini-btn--primary" disabled={busy !== null} title={i.fixLabel ?? ''} onClick={() => apply(i)}>
                    {busy === i.id ? '…' : (i.fixLabel ?? 'Fix it')}
                  </button>
                )}
                <button type="button" className="hh-mini-btn" disabled={busy !== null} onClick={() => dismiss(g)}>
                  {g.length > 1 ? 'Dismiss all' : 'Dismiss'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
