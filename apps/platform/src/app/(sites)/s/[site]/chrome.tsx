import React from 'react'
import { pick, type SiteSnapshot } from '@/releases/snapshot'
import type { Labels } from '@/releases/render-data'

type ReleaseInfo = { id: number; version: string; checksum: string }

export function SiteHeader(props: { snapshot: SiteSnapshot; locale: string; current?: string }) {
  const { snapshot, locale } = props
  const s = snapshot.site
  const base = `/s/${s.slug}`
  const q = locale !== s.defaultLocale ? `?lang=${locale}` : ''
  return (
    <header className="hh-header">
      <div className="hh-wrap">
        <a className="hh-brand" href={`${base}${q}`}>
          {s.brandName || s.name}
        </a>
        <nav className="hh-nav" aria-label="Main">
          {snapshot.pages
            .filter((p) => p.slug !== 'home')
            .map((p) => (
              <a key={p.slug} href={`${base}/${p.slug}${q}`} aria-current={props.current === p.slug ? 'page' : undefined}>
                {pick(p.title, locale, s.defaultLocale) ?? p.slug}
              </a>
            ))}
          {s.enabledLocales.length > 1 &&
            s.enabledLocales
              .filter((l) => l !== locale)
              .map((l) => (
                <a key={l} href={`${base}${props.current && props.current !== 'home' ? `/${props.current}` : ''}?lang=${l}`} hrefLang={l} lang={l}>
                  {l.toUpperCase()}
                </a>
              ))}
        </nav>
      </div>
    </header>
  )
}

export function BookingForm(props: { siteSlug: string; locale: string; t: Labels; values?: Record<string, string> }) {
  const { t, values = {} } = props
  const today = new Date()
  const d = (n: number) => new Date(today.getTime() + n * 86_400_000).toISOString().slice(0, 10)
  return (
    <form className="hh-form" method="get" action={`/s/${props.siteSlug}/book`}>
      <input type="hidden" name="lang" value={props.locale} />
      <label>
        {t.arrival}
        <input type="date" name="checkIn" required defaultValue={values.checkIn ?? d(14)} min={d(0)} />
      </label>
      <label>
        {t.departure}
        <input type="date" name="checkOut" required defaultValue={values.checkOut ?? d(16)} min={d(1)} />
      </label>
      <label>
        {t.adults}
        <input type="number" name="adults" min={1} max={8} defaultValue={values.adults ?? '2'} />
      </label>
      <label>
        {t.children}
        <input type="number" name="children" min={0} max={6} defaultValue={values.children ?? '0'} />
      </label>
      <label className="hh-full">
        {t.promo}
        <input type="text" name="promo" defaultValue={values.promo ?? ''} autoComplete="off" />
      </label>
      <div className="hh-full">
        <button className="hh-btn" type="submit">
          {t.search}
        </button>
      </div>
    </form>
  )
}

export function SiteFooter(props: { release: ReleaseInfo; t: Labels; mock: boolean }) {
  return (
    <footer className="hh-footer">
      <div className="hh-wrap">
        {props.mock && <p>{props.t.mock}</p>}
        <p>
          {props.t.release} {props.release.version} · sha256 {props.release.checksum.slice(0, 12)} · Hotelier Website Platform (xedge)
        </p>
      </div>
    </footer>
  )
}
