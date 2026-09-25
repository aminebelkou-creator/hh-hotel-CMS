'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { useConfig, useDocumentInfo, useForm, useFormFields, useFormModified } from '@payloadcms/ui'

type Release = { id: number; version: string; status: string; createdAt: string; durationMs?: number | null; publishedBy?: string | null }
type Site = { id: number; slug: string; currentRelease?: number | { id: number } | null }
type Outcome = { outcome?: string; version?: string; durationMs?: number; error?: string; from?: string; to?: string }

const idOf = (v: unknown): number | null => {
  if (v == null || v === '') return null
  if (typeof v === 'object' && v && 'id' in v) return Number((v as { id: unknown }).id)
  return Number(v)
}

/**
 * Sidebar panel on Sites (and Pages): publish the site's published pages as a new release,
 * roll back to the previous one, open the public site, and see recent releases.
 * Calls the platform endpoints, which check the user's access to the site.
 *
 * Publishing reads what is stored, never the form on screen. So on a site, unsaved changes
 * (a new template, brand colours) are saved first; on a page, which has its own draft/publish
 * step, the panel says the changes are not saved and publishes nothing until they are.
 */
export function PublishPanel() {
  const { config } = useConfig()
  const api = `${config.serverURL ?? ''}${config.routes.api}`
  const { id, collectionSlug } = useDocumentInfo()
  const siteField = useFormFields(([fields]) => fields?.site?.value)
  const siteId = collectionSlug === 'sites' ? idOf(id) : idOf(siteField)
  const modified = useFormModified()
  const { submit, validateForm } = useForm()
  const pageStatus = useFormFields(([fields]) => fields?._status?.value) as string | undefined

  const [site, setSite] = useState<Site | null>(null)
  const [releases, setReleases] = useState<Release[]>([])
  const [busy, setBusy] = useState<'publish' | 'rollback' | null>(null)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  const load = useCallback(async () => {
    if (!siteId) return
    const [s, r] = await Promise.all([
      fetch(`${api}/sites/${siteId}?depth=0&select[slug]=true&select[currentRelease]=true`, { credentials: 'include' }).then((x) => (x.ok ? x.json() : null)),
      fetch(
        `${api}/releases?where[site][equals]=${siteId}&sort=-createdAt&limit=6&depth=0&select[version]=true&select[status]=true&select[createdAt]=true&select[durationMs]=true&select[publishedBy]=true`,
        { credentials: 'include' },
      ).then((x) => (x.ok ? x.json() : { docs: [] })),
    ])
    setSite(s)
    setReleases(r?.docs ?? [])
  }, [api, siteId])

  useEffect(() => {
    void load()
  }, [load])

  const act = async (kind: 'publish' | 'rollback') => {
    if (!siteId) return
    setBusy(kind)
    setMessage(null)
    try {
      if (kind === 'publish' && modified) {
        if (collectionSlug !== 'sites') {
          setMessage({ tone: 'error', text: 'This page has unsaved changes. Click "Publish changes" at the top first, then Publish site.' })
          return
        }
        // A site's settings: save them now, so the new version carries them.
        setMessage({ tone: 'ok', text: 'Saving your changes…' })
        if (!(await validateForm())) {
          setMessage({ tone: 'error', text: 'Some fields need attention (in red). Fix them, then Publish site again.' })
          return
        }
        await submit()
      }
      const res = await fetch(`${api}/sites/${siteId}/${kind}`, { method: 'POST', credentials: 'include' })
      const body = (await res.json().catch(() => ({}))) as Outcome
      if (kind === 'publish' && body.outcome === 'live') setMessage({ tone: 'ok', text: `Published ${body.version} in ${((body.durationMs ?? 0) / 1000).toFixed(1)} s${modified && collectionSlug === 'sites' ? ' (your changes were saved first)' : ''}` })
      else if (kind === 'rollback' && body.outcome === 'rolled-back') setMessage({ tone: 'ok', text: `Rolled back from ${body.from} to ${body.to}` })
      else if (body.outcome === 'busy') setMessage({ tone: 'error', text: 'Another publish is running. Try again in a few seconds.' })
      else if (body.outcome === 'superseded') setMessage({ tone: 'ok', text: 'A newer publish took over and goes live instead.' })
      else if (body.outcome === 'nothing-to-roll-back') setMessage({ tone: 'error', text: 'There is no earlier release to go back to.' })
      else setMessage({ tone: 'error', text: body.error || `Failed (HTTP ${res.status})` })
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof Error ? e.message : String(e) })
    } finally {
      setBusy(null)
      void load()
    }
  }

  if (!siteId) return <div style={box}>Save the document first to publish its site.</div>
  const current = idOf(site?.currentRelease)
  const siteUrl = site?.slug ? `/s/${site.slug}` : null

  return (
    <div style={box}>
      <p style={{ fontWeight: 600, margin: '0 0 6px' }}>Website</p>
      <p style={{ margin: '0 0 12px', fontSize: 13, opacity: 0.8 }}>
        Publishing makes every published page live at once, as a new version you can undo.
      </p>
      {modified && (
        <p role="note" style={{ margin: '0 0 10px', fontSize: 13, color: '#9a6700' }}>
          {collectionSlug === 'sites' ? 'Unsaved changes: Publish site saves them first.' : 'Unsaved changes on this page: publish the page first (button at the top).'}
        </p>
      )}
      {!modified && collectionSlug === 'pages' && pageStatus === 'draft' && (
        <p role="note" style={{ margin: '0 0 10px', fontSize: 13, color: '#9a6700' }}>
          This page's latest changes are a draft: the site shows its last published version until you click "Publish changes".
        </p>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button type="button" style={btn(true)} disabled={busy !== null} onClick={() => act('publish')}>
          {busy === 'publish' ? 'Publishing…' : 'Publish site'}
        </button>
        <button type="button" style={btn(false)} disabled={busy !== null || releases.length < 2} onClick={() => act('rollback')}>
          {busy === 'rollback' ? 'Rolling back…' : 'Undo last publish'}
        </button>
        {siteUrl && (
          <a href={siteUrl} target="_blank" rel="noopener" style={{ ...btn(false), textDecoration: 'none' }}>
            View site ↗
          </a>
        )}
      </div>
      {message && (
        <p role="status" style={{ margin: '0 0 10px', fontSize: 13, color: message.tone === 'ok' ? '#1f7a3d' : '#b42318' }}>
          {message.text}
        </p>
      )}
      {releases.length > 0 && (
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', opacity: 0.7 }}>
              <th>Version</th>
              <th>Status</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {releases.map((r) => (
              <tr key={r.id} style={{ fontWeight: r.id === current ? 600 : 400 }}>
                <td>{r.version}</td>
                <td>{r.id === current ? 'live' : r.status}</td>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
