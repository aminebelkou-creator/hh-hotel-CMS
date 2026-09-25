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
  const dismiss = async (i: Issue) => {
    setBusy(i.id)
    try {
      await fetch(`${api}/issues/${i.id}`, { method: 'PATCH', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'dismissed' }) })
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
  return (
    <div style={{ border: '1px solid var(--theme-elevation-150)', borderRadius: 6, padding: 14, background: 'var(--theme-elevation-50)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <p style={{ fontWeight: 600, margin: 0 }}>What the platform noticed</p>
        <button type="button" style={btn(false)} disabled={busy !== null} onClick={check}>
          {busy === 'check' ? 'Checking…' : 'Check now'}
        </button>
      </div>
      {note && (
        <p role="status" style={{ margin: '0 0 8px', fontSize: 13 }}>
          {note}
        </p>
      )}
      {sorted.length === 0 && <p style={{ margin: 0, fontSize: 13, opacity: 0.75 }}>Nothing open. The checks run every night.</p>}
      {sorted.map((i) => (
        <div key={i.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderTop: '1px solid var(--theme-elevation-150)', fontSize: 13 }}>
          <span style={{ color: COLOR[i.severity] ?? 'inherit', fontWeight: 700, minWidth: 8 }}>●</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{i.title}</div>
            {i.detail && <div style={{ opacity: 0.8, whiteSpace: 'pre-line' }}>{i.detail}</div>}
            {i.url && (
              <a href={i.url} target="_blank" rel="noopener" style={{ fontSize: 12 }}>
                {i.url}
              </a>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {i.fix && (
              <button type="button" style={btn(true)} disabled={busy !== null} title={i.fixLabel ?? ''} onClick={() => apply(i)}>
                {busy === i.id ? '…' : i.fixLabel ?? 'Apply'}
              </button>
            )}
            <button type="button" style={btn(false)} disabled={busy !== null} onClick={() => dismiss(i)}>
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

const btn = (primary: boolean): React.CSSProperties => ({
  padding: '5px 10px',
  borderRadius: 4,
  border: primary ? 'none' : '1px solid var(--theme-elevation-250)',
  background: primary ? 'var(--theme-success-500, #1f7a3d)' : 'transparent',
  color: primary ? '#fff' : 'inherit',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
})
