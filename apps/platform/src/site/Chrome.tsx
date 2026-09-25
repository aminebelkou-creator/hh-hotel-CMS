import React from 'react'
import { pick, type Localized, type SiteSnapshot } from '@/releases/snapshot'
import { linkHref, pageHref } from './routing'
import { practicalInfo } from './load'
import { LOCALE_NAMES, type Labels } from './i18n'

type Props = { snapshot: SiteSnapshot; locale: string; t: Labels; current: string }

export function navPages(snapshot: SiteSnapshot) {
  return [...snapshot.pages].filter((p) => p.showInNav).sort((a, b) => a.navOrder - b.navOrder || a.slug.localeCompare(b.slug))
}

export function SiteHeader({ snapshot, locale, t, current }: Props) {
  const s = snapshot.site
  const d = s.defaultLocale
  const p = (v: Localized<string> | null | undefined) => pick(v, locale, d)
  const name = s.brandName || s.name
  const cta = linkHref(snapshot, locale, s.cta.href)
  const nav = navPages(snapshot).filter((pg) => pg.slug !== 'home')
  const others = s.enabledLocales.filter((l) => l !== locale)
  // The first confirmed phone number, as a tel: link: in the header on desktop, in the sticky bar on phones.
  const phone = practicalInfo(snapshot).phones[0]
  const tel = phone ? `tel:${phone.replace(/[^+\d]/g, '')}` : null
  const links = (
    <>
      {nav.map((pg) => (
        <a key={pg.slug} href={pageHref(snapshot, locale, pg.slug)} aria-current={current === pg.slug ? 'page' : undefined}>
          {p(pg.navLabel) || p(pg.title) || pg.slug}
        </a>
      ))}
      {others.map((l) => (
        <a key={l} className="hh-lang" href={pageHref(snapshot, l, current)} hrefLang={l} lang={l} title={LOCALE_NAMES[l] ?? l}>
          {l.toUpperCase()}
        </a>
      ))}
    </>
  )
  return (
    <>
    <header className="hh-header">
      <a className="hh-skip" href="#main">
        {t.skip}
      </a>
      <div className="hh-wrap hh-header-inner">
        <a className="hh-brand" href={pageHref(snapshot, locale, 'home')}>
          {s.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.logoUrl} alt="" className="hh-logo" />
          ) : null}
          <span>
            <span className="hh-brand-name">{name}</span>
            {p(s.tagline) && <span className="hh-brand-tag">{p(s.tagline)}</span>}
          </span>
        </a>
        <nav className="hh-nav" aria-label={t.menu}>
          {links}
        </nav>
        {tel && (
          <a className="hh-header-phone" href={tel}>
            {phone}
          </a>
        )}
        {cta && (
          <a className="hh-btn hh-header-cta" href={cta}>
            {p(s.cta.label) || t.book}
          </a>
        )}
        <details className="hh-burger">
          <summary aria-label={t.menu}>
            <span />
            <span />
            <span />
          </summary>
          <nav className="hh-nav-mobile" aria-label={t.menu}>
            {links}
            {cta && (
              <a className="hh-btn" href={cta}>
                {p(s.cta.label) || t.book}
              </a>
            )}
          </nav>
        </details>
      </div>
    </header>
      {(tel || cta) && (
        // Phones only (CSS): Call and Book always one tap away, whatever the page or the scroll position.
        // A sibling of the header, not a child: the header's backdrop-filter would otherwise contain the fixed bar.
        <nav className="hh-sticky-bar" aria-label={t.quickActions}>
          {tel && (
            <a className="hh-sticky-call" href={tel}>
              {t.call}
            </a>
          )}
          {cta && (
            <a className="hh-btn hh-sticky-book" href={cta}>
              {p(s.cta.label) || t.book}
            </a>
          )}
        </nav>
      )}
    </>
  )
}

export function SiteFooter({ snapshot, locale, t, release }: Omit<Props, 'current'> & { release: { version: string; checksum: string } }) {
  const s = snapshot.site
  const info = practicalInfo(snapshot)
  const nav = navPages(snapshot)
  const p = (v: Localized<string> | null | undefined) => pick(v, locale, s.defaultLocale)
  return (
    <footer className="hh-footer">
      <div className="hh-wrap hh-footer-grid">
        <div>
          <p className="hh-footer-name">{s.brandName || s.name}</p>
          {p(s.tagline) && <p>{p(s.tagline)}</p>}
          {info.address && <p>{info.address}</p>}
        </div>
        <div>
          <p className="hh-footer-title">{t.contact}</p>
          {info.phones.map((ph) => (
            <p key={ph}>
              <a href={`tel:${ph.replace(/\s/g, '')}`}>{ph}</a>
            </p>
          ))}
          {info.email && (
            <p>
              <a href={`mailto:${info.email}`}>{info.email}</a>
            </p>
          )}
        </div>
        <div>
          <p className="hh-footer-title">{t.menu}</p>
          {nav.map((pg) => (
            <p key={pg.slug}>
              <a href={pageHref(snapshot, locale, pg.slug)}>{p(pg.navLabel) || p(pg.title)}</a>
            </p>
          ))}
        </div>
        {info.profiles.length > 0 && (
          <div>
            <p className="hh-footer-title">{t.followUs}</p>
            {info.profiles.map((u) => (
              <p key={u}>
                <a href={u} rel="noopener">
                  {u.includes('instagram') ? 'Instagram' : u.includes('facebook') ? 'Facebook' : u.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              </p>
            ))}
          </div>
        )}
      </div>
      {snapshot.pages.some((pg) => pg.showInFooter) && (
        <nav className="hh-wrap hh-footer-legal" aria-label={t.legal}>
          {[...snapshot.pages]
            .filter((pg) => pg.showInFooter)
            .sort((a, b) => a.navOrder - b.navOrder)
            .map((pg) => (
              <a key={pg.slug} href={pageHref(snapshot, locale, pg.slug)}>
                {p(pg.navLabel) || p(pg.title)}
              </a>
            ))}
        </nav>
      )}
      <div className="hh-wrap hh-footer-meta">
        {t.release} {release.version} · {release.checksum.slice(0, 10)} · Hotelier Website Platform (xedge)
      </div>
    </footer>
  )
}
