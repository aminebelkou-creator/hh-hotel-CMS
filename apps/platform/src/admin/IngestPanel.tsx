'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { useConfig, useDocumentInfo, useFormFields } from '@payloadcms/ui'

type Crawl = { id: number; status: string; startUrl: string; pagesCrawled: number; pagesLeft: number; factsFound: number; factsNew: number; updatedAt: string }
type Gen = { locale: string; facts: number; rooms: { created: number; kept: number }; pages: { slug: string; created: boolean; generated: number; kept: number }[]; model: string | null; error?: string }
type Chunk = { crawlId: number; status: string; pagesCrawled: number; pagesLeft: number; factsFound: number; factsNew: number; error?: string }

/**
 * Sidebar panel on Sites: import the hotel's current website into the fact base. The
 * browser drives the crawl chunk by chunk (each request stays short on serverless), then
 * points at the review screen where the hotelier confirms or rejects what was found.
 */
export function IngestPanel() {
  const { config } = useConfig()
  const api = `${config.serverURL ?? ''}${config.routes.api}`
  const admin = `${config.serverURL ?? ''}${config.routes.admin}`
  const { id } = useDocumentInfo()
  const siteId = id ? Number(id) : null
  const sourceUrl = useFormFields(([fields]) => fields?.sourceUrl?.value as string | undefined)
  const enabledLocales = useFormFields(([fields]) => (fields?.enabledLocales?.value as string[] | undefined) ?? [])
  const defaultLocale = useFormFields(([fields]) => (fields?.defaultLocale?.value as string | undefined) ?? 'en')
  const [tr, setTr] = useState<{ to: string; text: string } | null>(null)
  const [trBusy, setTrBusy] = useState<string | null>(null)
  const [url, setUrl] = useState('')
  const [last, setLast] = useState<Crawl | null>(null)
  const [running, setRunning] = useState<Chunk | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [unconfirmed, setUnconfirmed] = useState<number | null>(null)
  const [gen, setGen] = useState<Gen | null>(null)
  const [genBusy, setGenBusy] = useState(false)

  useEffect(() => {
    if (sourceUrl && !url) setUrl(sourceUrl)
  }, [sourceUrl, url])

  const load = useCallback(async () => {
    if (!siteId) return
    const [c, f] = await Promise.all([
      fetch(`${api}/crawls?where[site][equals]=${siteId}&sort=-createdAt&limit=1&depth=0`, { credentials: 'include' }).then((x) => (x.ok ? x.json() : { docs: [] })),
      fetch(`${api}/facts?where[site][equals]=${siteId}&where[status][equals]=unconfirmed&limit=0&depth=0`, { credentials: 'include' }).then((x) => (x.ok ? x.json() : null)),
    ])
    setLast(c?.docs?.[0] ?? null)
    setUnconfirmed(f?.totalDocs ?? null)
  }, [api, siteId])

  useEffect(() => {
    void load()
  }, [load])

  const run = async () => {
    if (!siteId || !url) return
    setError(null)
    setRunning({ crawlId: 0, status: 'running', pagesCrawled: 0, pagesLeft: 0, factsFound: 0, factsNew: 0 })
    try {
      let res = await fetch(`${api}/sites/${siteId}/ingest`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      let body = (await res.json().catch(() => ({}))) as Chunk & { error?: string }
      if (!res.ok && !body.crawlId) throw new Error(body.error || `Failed (HTTP ${res.status})`)
      setRunning(body)
      // Keep going until the crawler says it is done; each request is one short chunk.
      for (let i = 0; i < 60 && body.status === 'running'; i++) {
        res = await fetch(`${api}/crawls/${body.crawlId}/continue`, { method: 'POST', credentials: 'include' })
        body = (await res.json().catch(() => ({}))) as Chunk & { error?: string }
        setRunning(body)
      }
      if (body.status === 'failed') setError(body.error || 'The import failed; see the crawl log.')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRunning(null)
      void load()
    }
  }

  const generate = async () => {
    if (!siteId) return
    setGenBusy(true)
    setError(null)
    try {
      const res = await fetch(`${api}/sites/${siteId}/generate`, { method: 'POST', credentials: 'include' })
      const body = (await res.json().catch(() => ({}))) as Gen
      if (!res.ok) throw new Error(body.error || `Failed (HTTP ${res.status})`)
      setGen(body)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setGenBusy(false)
    }
  }

  const translate = async (to: string) => {
    if (!siteId) return
    setTrBusy(to)
    setError(null)
    try {
      const res = await fetch(`${api}/sites/${siteId}/translate`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ to }) })
      const body = (await res.json().catch(() => ({}))) as { pages?: number; rooms?: number; fields?: number; model?: string | null; skipped?: string[]; error?: string }
      if (!res.ok) throw new Error(body.error || `Failed (HTTP ${res.status})`)
      setTr({ to, text: body.skipped?.length ? body.skipped.join('; ') : `${body.fields} texts translated on ${body.pages} pages and ${body.rooms} room types (${body.model}). Your own translations were kept.` })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setTrBusy(null)
    }
  }

  if (!siteId) return null
  const shown = running ?? last
  return (
    <div style={box}>
      <p style={{ fontWeight: 600, margin: '0 0 6px' }}>Import the current website</p>
      <p style={{ margin: '0 0 10px', fontSize: 13, opacity: 0.8 }}>
        Reads the hotel’s existing site and proposes facts (phones, times, rooms, services). Nothing is published: you confirm each fact first.
      </p>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://www.example-hotel.com"
        style={{ width: '100%', padding: '7px 9px', marginBottom: 8, borderRadius: 4, border: '1px solid var(--theme-elevation-250)', background: 'transparent', color: 'inherit' }}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button type="button" style={btn(true)} disabled={running !== null || !url} onClick={run}>
          {running ? 'Importing…' : 'Import from website'}
        </button>
        <a href={`${admin}/review/${siteId}`} style={{ ...btn(false), textDecoration: 'none' }}>
          Review facts{unconfirmed != null ? ` (${unconfirmed} to check)` : ''}
        </a>
      </div>
      {error && (
        <p role="alert" style={{ margin: '0 0 8px', fontSize: 13, color: '#b42318' }}>
          {error}
        </p>
      )}
      {shown && (
        <p role="status" style={{ margin: '0 0 12px', fontSize: 12, opacity: 0.85 }}>
          {running ? 'Running' : `Last import ${shown.status}`}: {shown.pagesCrawled} pages read
          {shown.pagesLeft ? `, ${shown.pagesLeft} left` : ''}, {shown.factsFound} facts ({shown.factsNew} new)
        </p>
      )}
      <p style={{ fontWeight: 600, margin: '0 0 6px' }}>Write the pages</p>
      <p style={{ margin: '0 0 10px', fontSize: 13, opacity: 0.8 }}>
        Drafts the home, rooms, services and contact pages and the room types from the confirmed facts. Your own edits are kept; nothing is published.
      </p>
      <button type="button" style={btn(true)} disabled={genBusy} onClick={generate}>
        {genBusy ? 'Writing…' : 'Draft pages from confirmed facts'}
      </button>
      {gen && (
        <p role="status" style={{ margin: '8px 0 0', fontSize: 12, opacity: 0.85 }}>
          {gen.facts} facts used{gen.model ? ` with ${gen.model}` : ''}; rooms: {gen.rooms.created} new, {gen.rooms.kept} kept;{' '}
          {gen.pages.map((p) => `${p.slug}: ${p.created ? 'created' : `${p.generated} written, ${p.kept} kept`}`).join('; ')}. Review them under Pages, then publish.
        </p>
      )}
      {enabledLocales.filter((l) => l !== defaultLocale).length > 0 && (
        <>
          <p style={{ fontWeight: 600, margin: '14px 0 6px' }}>Translate</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {enabledLocales
              .filter((l) => l !== defaultLocale)
              .map((l) => (
                <button key={l} type="button" style={btn(false)} disabled={trBusy !== null} onClick={() => translate(l)}>
                  {trBusy === l ? 'Translating…' : `${defaultLocale.toUpperCase()} → ${l.toUpperCase()}`}
                </button>
              ))}
          </div>
          {tr && (
            <p role="status" style={{ margin: '8px 0 0', fontSize: 12, opacity: 0.85 }}>
              {tr.text}
            </p>
          )}
        </>
      )}
    </div>
  )
}

const box: React.CSSProperties = {
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 6,
  padding: 14,
  marginBottom: 20,
  background: 'var(--theme-elevation-50)',
}
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
