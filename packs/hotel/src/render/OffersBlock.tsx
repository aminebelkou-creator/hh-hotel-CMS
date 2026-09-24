import React from 'react'
import { currentOffers, pick, type HotelSnapshot, type Localized } from '../types'

type Props = {
  block: { heading?: Localized<string>; intro?: Localized<string>; limit?: number | null }
  hotel: HotelSnapshot | undefined
  locale: string
  defaultLocale: string
  resolveHref: (href: string | null | undefined) => string | null
  today?: string
}

const T = { fr: { until: 'Jusqu’au', from: 'À partir du' }, en: { until: 'Until', from: 'From' } }

/** Current offers as cards. Dates are checked when the page is served, not when it was published. */
export function OffersBlock({ block, hotel, locale, defaultLocale, resolveHref, today }: Props) {
  const p = <V,>(v: Localized<V> | null | undefined) => pick(v, locale, defaultLocale)
  const t = locale === 'fr' ? T.fr : T.en
  const fmt = (d: string) => new Date(d).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
  const offers = currentOffers(hotel?.offers, today).slice(0, block.limit || undefined)
  if (!offers.length) return null
  return (
    <section className="hh-section hh-offers-block">
      <div className="hh-wrap">
        {p(block.heading) && <h2 className="hh-section-title">{p(block.heading)}</h2>}
        {p(block.intro) && <p className="hh-lead">{p(block.intro)}</p>}
        <div className="hh-offer-grid">
          {offers.map((o) => {
            const href = resolveHref(o.ctaHref)
            return (
              <article key={o.id} className="hh-offer-card" id={`offer-${o.slug}`}>
                {o.imageUrl && (
                  <div className="hh-offer-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={o.imageUrl} alt={p(o.imageAlt) || ''} loading="lazy" decoding="async" />
                    {p(o.highlight) && <span className="hh-badge">{p(o.highlight)}</span>}
                  </div>
                )}
                <div className="hh-offer-body">
                  {!o.imageUrl && p(o.highlight) && <span className="hh-badge hh-badge--inline">{p(o.highlight)}</span>}
                  <h3>{p(o.title)}</h3>
                  {p(o.summary) && <p>{p(o.summary)}</p>}
                  {(o.validFrom || o.validTo) && (
                    <p className="hh-room-meta">
                      {o.validFrom && `${t.from} ${fmt(o.validFrom)}`}
                      {o.validFrom && o.validTo && ' · '}
                      {o.validTo && `${t.until} ${fmt(o.validTo)}`}
                    </p>
                  )}
                  {p(o.conditions) && <p className="hh-small">{p(o.conditions)}</p>}
                  {href && p(o.ctaLabel) && (
                    <a className="hh-link-arrow" href={href}>
                      {p(o.ctaLabel)}
                    </a>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
