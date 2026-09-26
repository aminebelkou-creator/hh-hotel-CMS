'use client'
import React, { useState } from 'react'
import { useConfig, useDocumentInfo } from '@payloadcms/ui'

const TOPICS = [
  { id: 'practical', label: 'Before you arrive (address, times, contact)' },
  { id: 'amenities', label: 'Services and facilities' },
  { id: 'rooms', label: 'Our rooms, one by one' },
  { id: 'breakfast', label: 'Breakfast' },
] as const

type Result = { ok: true; postId: number; title: string; model: string | null } | { ok: false; reason?: string; error?: string }

/**
 * Sidebar panel on Sites: "Suggest a blog post". Writes a DRAFT post from the confirmed facts
 * (polished by the model when one is configured) and links to it. Nothing is published: the
 * owner reads it, edits it, sets it to Published and publishes the site.
 */
export function BlogDraftPanel() {
  const { config } = useConfig()
  const api = `${config.serverURL ?? ''}${config.routes.api}`
  const admin = `${config.serverURL ?? ''}${config.routes.admin}`
  const { id } = useDocumentInfo()
  const siteId = id ? Number(id) : null
  const [topic, setTopic] = useState<string>(TOPICS[0].id)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  if (!siteId) return null
  const suggest = async () => {
    setBusy(true)
    setResult(null)
    try {
      const res = await fetch(`${api}/sites/${siteId}/suggest-post`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ topic }) })
      setResult((await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }))) as Result)
    } catch (e) {
      setResult({ ok: false, error: e instanceof Error ? e.message : String(e) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={box}>
      <p style={{ fontWeight: 600, margin: '0 0 6px' }}>Blog</p>
      <p style={{ margin: '0 0 10px', fontSize: 13, opacity: 0.8 }}>
        Suggest a post written from your confirmed facts. It is saved as a draft: read it, change what you like, then publish it.
      </p>
      <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>
        Topic
        <select value={topic} onChange={(e) => setTopic(e.target.value)} style={{ display: 'block', width: '100%', marginTop: 4, padding: 6 }}>
          {TOPICS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <button type="button" onClick={suggest} disabled={busy} style={btn}>
        {busy ? 'Writing…' : 'Suggest a draft post'}
      </button>
      {result && result.ok && (
        <p role="status" style={{ margin: '10px 0 0', fontSize: 13, color: '#1f7a3d' }}>
          Draft ready: <a href={`${admin}/collections/posts/${result.postId}`}>{result.title}</a>
          {result.model ? ` (written with ${result.model})` : ' (from your facts)'}
        </p>
      )}
      {result && !result.ok && (
        <p role="status" style={{ margin: '10px 0 0', fontSize: 13, color: '#b42318' }}>
          {result.reason || result.error}
        </p>
      )}
    </div>
  )
}

const box: React.CSSProperties = { border: '1px solid var(--theme-elevation-150)', borderRadius: 6, padding: 14, marginBottom: 20, background: 'var(--theme-elevation-50)' }
const btn: React.CSSProperties = { marginTop: 6, padding: '7px 12px', borderRadius: 4, border: 'none', background: 'var(--theme-success-500, #1f7a3d)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }
