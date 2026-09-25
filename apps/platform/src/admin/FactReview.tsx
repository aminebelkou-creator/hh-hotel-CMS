'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useConfig } from '@payloadcms/ui'

type Fact = { id: number; key: string; value: string; status: string; confidence?: number | null; method?: string | null; source?: string | null; occurrences?: number | null }

const LABELS: Record<string, string> = {
  'business.name': 'Hotel name',
  'business.description': 'Description',
  'business.type': 'Type',
  'contact.phone': 'Phone',
  'contact.email': 'Email',
  address: 'Address',
  'geo.lat': 'Latitude',
  'geo.lon': 'Longitude',
  'rating.stars': 'Stars',
  'hotel.stars': 'Stars',
  'policy.checkin': 'Check-in time',
  'policy.checkout': 'Check-out time',
  'policy.pets': 'Pets',
  'policy.children': 'Children',
  'policy.cancellation': 'Cancellation',
  'policy.payment': 'Payment',
  'policy.smoking': 'Smoking',
  'breakfast.hours': 'Breakfast hours',
  'breakfast.price': 'Breakfast price',
  'room.name': 'Room type',
  'room.description': 'Room description',
  'room.size': 'Room size',
  'room.occupancy': 'Room occupancy',
  'room.bed': 'Beds',
  'room.price-from': 'Room price from',
  service: 'Service',
  amenity: 'Amenity',
  nearby: 'Nearby',
  'access.transport': 'Getting here',
  parking: 'Parking',
  'profile.link': 'Profile link',
  'profile.google-maps': 'Google Maps',
  'booking.engine': 'Booking engine',
  'site.description': 'Site description',
  'site.language': 'Language',
  'site.name': 'Site name',
  'site.logo': 'Logo',
  'site.generator': 'Site generator',
  'price.range': 'Price range',
  'reviews.aggregate': 'Reviews',
}
const ORDER = ['business.', 'contact.', 'address', 'geo.', 'rating.', 'policy.', 'breakfast.', 'room.', 'service', 'amenity', 'parking', 'access.', 'nearby', 'profile.', 'booking.', 'price.', 'reviews.', 'site.']
const rank = (k: string) => {
  const i = ORDER.findIndex((p) => k.startsWith(p))
  return i < 0 ? 99 : i
}

/**
 * One pass over a site's facts: unconfirmed first, grouped by kind. Confirm keeps the value
 * (edited or not), reject hides it from generation. Every write goes through the REST API
 * with the signed-in user's own rights, so a user only ever touches their hotel's facts.
 */
export function FactReview({ siteId }: { siteId: number }) {
  const { config } = useConfig()
  const api = `${config.serverURL ?? ''}${config.routes.api}`
  const admin = `${config.serverURL ?? ''}${config.routes.admin}`
  const [facts, setFacts] = useState<Fact[]>([])
  const [site, setSite] = useState<{ name: string } | null>(null)
  const [edits, setEdits] = useState<Record<number, string>>({})
  const [busy, setBusy] = useState<number | 'all' | null>(null)
  const [filter, setFilter] = useState<'unconfirmed' | 'all'>('unconfirmed')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [s, f] = await Promise.all([
      fetch(`${api}/sites/${siteId}?depth=0&select[name]=true`, { credentials: 'include' }).then((x) => (x.ok ? x.json() : null)),
      fetch(`${api}/facts?where[site][equals]=${siteId}&limit=500&depth=0&sort=key`, { credentials: 'include' }).then((x) => (x.ok ? x.json() : { docs: [] })),
    ])
    setSite(s)
    setFacts(f.docs ?? [])
  }, [api, siteId])
  useEffect(() => {
    void load()
  }, [load])

  const decide = async (f: Fact, status: 'confirmed' | 'rejected' | 'unconfirmed') => {
    setBusy(f.id)
    setError(null)
    try {
      const value = (edits[f.id] ?? f.value).trim()
      const res = await fetch(`${api}/facts/${f.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status, value: value || f.value }),
      })
      if (!res.ok) throw new Error(`Could not save (HTTP ${res.status})`)
      const j = (await res.json()) as { doc: Fact }
      setFacts((all) => all.map((x) => (x.id === f.id ? { ...x, ...j.doc } : x)))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  const confirmSure = async () => {
    setBusy('all')
    for (const f of facts.filter((x) => x.status === 'unconfirmed' && (x.confidence ?? 0) >= 0.8)) await decide(f, 'confirmed')
    setBusy(null)
  }

  const shown = useMemo(() => facts.filter((f) => filter === 'all' || f.status === 'unconfirmed').sort((a, b) => rank(a.key) - rank(b.key) || a.key.localeCompare(b.key) || (b.confidence ?? 0) - (a.confidence ?? 0)), [facts, filter])
  const groups = useMemo(() => {
    const m = new Map<string, Fact[]>()
    for (const f of shown) (m.get(f.key) ?? m.set(f.key, []).get(f.key)!).push(f)
    return [...m.entries()]
  }, [shown])
  const counts = { unconfirmed: facts.filter((f) => f.status === 'unconfirmed').length, confirmed: facts.filter((f) => f.status === 'confirmed').length, rejected: facts.filter((f) => f.status === 'rejected').length }
  const sure = facts.filter((x) => x.status === 'unconfirmed' && (x.confidence ?? 0) >= 0.8).length

  return (
    <div>
      <h1 style={{ margin: '24px 0 4px' }}>Review facts{site ? ` — ${site.name}` : ''}</h1>
      <p style={{ margin: '0 0 16px', opacity: 0.8 }}>
        {counts.unconfirmed} to check · {counts.confirmed} confirmed · {counts.rejected} rejected. Only confirmed facts are used to write pages and reach guests.
        Correct a value before confirming it if needed.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button type="button" style={btn(true)} disabled={busy !== null || sure === 0} onClick={confirmSure}>
          {busy === 'all' ? 'Confirming…' : `Confirm the ${sure} sure ones (found in structured data or links)`}
        </button>
        <button type="button" style={btn(false)} onClick={() => setFilter(filter === 'all' ? 'unconfirmed' : 'all')}>
          {filter === 'all' ? 'Show only facts to check' : 'Show all facts'}
        </button>
        <a href={`${admin}/collections/sites/${siteId}`} style={{ ...btn(false), textDecoration: 'none' }}>
          Back to the site
        </a>
      </div>
      {error && (
        <p role="alert" style={{ color: '#b42318' }}>
          {error}
        </p>
      )}
      {groups.length === 0 && <p>Nothing to review. Import the hotel’s website from the site’s Website panel, or add facts by hand.</p>}
      {groups.map(([key, list]) => (
        <section key={key} style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 15, margin: '0 0 6px' }}>
            {LABELS[key] ?? key} <span style={{ opacity: 0.5, fontWeight: 400, fontSize: 12 }}>{key}</span>
          </h2>
          {list.map((f) => (
            <div key={f.id} style={row(f.status)}>
              <input
                type="text"
                value={edits[f.id] ?? f.value}
                onChange={(e) => setEdits({ ...edits, [f.id]: e.target.value })}
                disabled={f.status === 'rejected'}
                style={{ flex: '1 1 320px', minWidth: 200, padding: '6px 8px', borderRadius: 4, border: '1px solid var(--theme-elevation-250)', background: 'transparent', color: 'inherit' }}
              />
              <span style={{ fontSize: 11, opacity: 0.65, flex: '0 0 auto' }}>
                {Math.round((f.confidence ?? 0) * 100)}% · {f.method ?? '?'}
                {f.occurrences && f.occurrences > 1 ? ` · seen ${f.occurrences}×` : ''}
                {f.source && (
                  <>
                    {' · '}
                    <a href={f.source} target="_blank" rel="noopener">
                      source ↗
                    </a>
                  </>
                )}
              </span>
              <span style={{ display: 'flex', gap: 6 }}>
                {f.status !== 'confirmed' && (
                  <button type="button" style={btn(true)} disabled={busy !== null} onClick={() => decide(f, 'confirmed')}>
                    Confirm
                  </button>
                )}
                {f.status !== 'rejected' && (
                  <button type="button" style={btn(false)} disabled={busy !== null} onClick={() => decide(f, 'rejected')}>
                    Reject
                  </button>
                )}
                {f.status !== 'unconfirmed' && (
                  <button type="button" style={btn(false)} disabled={busy !== null} onClick={() => decide(f, 'unconfirmed')}>
                    Undo
                  </button>
                )}
              </span>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}

const row = (status: string): React.CSSProperties => ({
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  flexWrap: 'wrap',
  padding: '6px 8px',
  marginBottom: 4,
  borderRadius: 4,
  background: status === 'confirmed' ? 'rgba(31,122,61,.08)' : status === 'rejected' ? 'rgba(180,35,24,.06)' : 'var(--theme-elevation-50)',
  opacity: status === 'rejected' ? 0.7 : 1,
})
const btn = (primary: boolean): React.CSSProperties => ({
  padding: '6px 10px',
  borderRadius: 4,
  border: primary ? 'none' : '1px solid var(--theme-elevation-250)',
  background: primary ? 'var(--theme-success-500, #1f7a3d)' : 'transparent',
  color: primary ? '#fff' : 'inherit',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
})
