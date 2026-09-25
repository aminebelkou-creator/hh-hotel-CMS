'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { useConfig, useDocumentInfo } from '@payloadcms/ui'

type Proposal = { status: string; template: string; accent: string; rationale?: string; sources: { accent: string; template: string[] }; alternatives: { template: string; accent: string }[]; createdAt: string }
const NAMES: Record<string, string> = { maison: 'Maison', atelier: 'Atelier', soiree: 'Soirée' }

/**
 * Sidebar panel on Sites: propose a look (template + accent) from the hotel's logo, photos
 * and facts; apply it after the person approves. Reload the document after applying to see
 * the template and brand fields change.
 */
export function BrandPanel() {
  const { config } = useConfig()
  const api = `${config.serverURL ?? ''}${config.routes.api}`
  const { id } = useDocumentInfo()
  const siteId = id ? Number(id) : null
  const [p, setP] = useState<Proposal | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  const load = useCallback(async () => {
    if (!siteId) return
    const s = await fetch(`${api}/sites/${siteId}?depth=0&select[brandProposal]=true`, { credentials: 'include' }).then((x) => (x.ok ? x.json() : null))
    setP((s?.brandProposal as Proposal | null) ?? null)
  }, [api, siteId])
  useEffect(() => {
    void load()
  }, [load])

  const call = async (path: string, body?: unknown) => {
    if (!siteId) return
    setBusy(path)
    setMsg(null)
    try {
      const res = await fetch(`${api}/sites/${siteId}/${path}`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
      const j = (await res.json().catch(() => ({}))) as { error?: string; template?: string }
      if (!res.ok) throw new Error(j.error || `Failed (HTTP ${res.status})`)
      if (path === 'apply-brand') setMsg({ tone: 'ok', text: `Applied ${NAMES[j.template ?? ''] ?? j.template}. Reload the page to see the fields, then publish.` })
    } catch (e) {
      setMsg({ tone: 'error', text: e instanceof Error ? e.message : String(e) })
    } finally {
      setBusy(null)
      void load()
    }
  }

  if (!siteId) return null
  return (
    <div style={box}>
      <p style={{ fontWeight: 600, margin: '0 0 6px' }}>Look</p>
      <p style={{ margin: '0 0 10px', fontSize: 13, opacity: 0.8 }}>Suggest a template and an accent colour from the logo, the photos and the confirmed facts. Nothing changes until you apply it.</p>
      <button type="button" style={btn(false)} disabled={busy !== null} onClick={() => call('propose-brand')}>
        {busy === 'propose-brand' ? 'Looking…' : p ? 'Propose again' : 'Propose a look'}
      </button>
      {p && (
        <div style={{ marginTop: 10, fontSize: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 22, height: 22, borderRadius: 4, background: p.accent, border: '1px solid rgba(0,0,0,.15)' }} />
            <strong>{NAMES[p.template] ?? p.template}</strong> · accent {p.accent} <span style={{ opacity: 0.6 }}>(from the {p.sources.accent})</span>
          </div>
          {p.rationale && <p style={{ margin: '6px 0' }}>{p.rationale}</p>}
          <ul style={{ margin: '6px 0', paddingLeft: 18, opacity: 0.8 }}>
            {p.sources.template.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          {p.status === 'proposed' ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" style={btn(true)} disabled={busy !== null} onClick={() => call('apply-brand')}>
                Apply {NAMES[p.template] ?? p.template}
              </button>
              {p.alternatives.map((a) => (
                <button key={a.template} type="button" style={btn(false)} disabled={busy !== null} onClick={() => call('apply-brand', { template: a.template })}>
                  Rather {NAMES[a.template] ?? a.template}
                </button>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, opacity: 0.7 }}>Proposal {p.status} on {new Date(p.createdAt).toLocaleDateString()}.</p>
          )}
        </div>
      )}
      {msg && (
        <p role="status" style={{ margin: '8px 0 0', fontSize: 13, color: msg.tone === 'ok' ? '#1f7a3d' : '#b42318' }}>
          {msg.text}
        </p>
      )}
    </div>
  )
}

const box: React.CSSProperties = { border: '1px solid var(--theme-elevation-150)', borderRadius: 6, padding: 14, marginBottom: 20, background: 'var(--theme-elevation-50)' }
const btn = (primary: boolean): React.CSSProperties => ({
  padding: '7px 12px',
  borderRadius: 4,
  border: primary ? 'none' : '1px solid var(--theme-elevation-250)',
  background: primary ? 'var(--theme-success-500, #1f7a3d)' : 'transparent',
  color: primary ? '#fff' : 'inherit',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
})
