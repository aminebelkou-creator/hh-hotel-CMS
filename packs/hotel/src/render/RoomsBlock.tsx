import React from 'react'
import { pick, type HotelSnapshot, type Localized } from '../types'

type Props = {
  block: { heading?: Localized<string>; intro?: Localized<string>; limit?: number | null; layout?: string | null }
  hotel: HotelSnapshot | undefined
  locale: string
  defaultLocale: string
  /** Where "details" links point: the rooms page of the site, in the current locale */
  roomsHref?: string
  headingLevel?: 'h1' | 'h2'
}

const T = {
  fr: { guests: (n: number) => `${n} personne${n > 1 ? 's' : ''}`, size: 'm²', details: 'Voir la chambre', features: 'Équipements' },
  en: { guests: (n: number) => `${n} guest${n > 1 ? 's' : ''}`, size: 'm²', details: 'View room', features: 'In the room' },
}

export function RoomsBlock({ block, hotel, locale, defaultLocale, roomsHref, headingLevel = 'h2' }: Props) {
  const t = locale === 'fr' ? T.fr : T.en
  const p = <V,>(v: Localized<V> | null | undefined) => pick(v, locale, defaultLocale)
  const rooms = (hotel?.rooms ?? []).slice(0, block.limit || undefined)
  if (!rooms.length) return null
  const Heading = headingLevel
  const detailed = block.layout === 'detailed'
  return (
    <section className="hh-section hh-rooms">
      <div className="hh-wrap">
        {p(block.heading) && <Heading className="hh-section-title">{p(block.heading)}</Heading>}
        {p(block.intro) && <p className="hh-lead">{p(block.intro)}</p>}
        <div className={detailed ? 'hh-room-list' : 'hh-room-grid'}>
          {rooms.map((r) => {
            const img = r.images[0]
            const meta = [
              r.sizeSqm ? `${r.sizeSqm} ${t.size}` : null,
              r.maxOccupancy ? t.guests(r.maxOccupancy) : null,
              p(r.bed) || null,
              p(r.view) || null,
            ].filter(Boolean)
            return (
              <article key={r.id} id={`room-${r.slug}`} className={detailed ? 'hh-room hh-room--detailed' : 'hh-room'}>
                {img && (
                  <div className="hh-room-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={p(img.alt) || p(r.name) || ''} loading="lazy" decoding="async" />
                  </div>
                )}
                <div className="hh-room-body">
                  {r.category && <p className="hh-eyebrow">{r.category}</p>}
                  <h3>{p(r.name)}</h3>
                  {meta.length > 0 && <p className="hh-room-meta">{meta.join(' · ')}</p>}
                  <p>{detailed ? p(r.description) || p(r.summary) : p(r.summary)}</p>
                  {detailed && r.features.length > 0 && (
                    <>
                      <h4 className="hh-room-features-title">{t.features}</h4>
                      <ul className="hh-room-features">
                        {r.features.map((f, i) => (
                          <li key={i}>{p(f.label)}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {detailed && r.images.length > 1 && (
                    <div className="hh-room-thumbs">
                      {r.images.slice(1, 5).map((im, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={im.url} alt={p(im.alt) || ''} loading="lazy" decoding="async" />
                      ))}
                    </div>
                  )}
                  {!detailed && roomsHref && (
                    <a className="hh-link-arrow" href={`${roomsHref}#room-${r.slug}`}>
                      {t.details}
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
