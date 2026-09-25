import React from 'react'
import { pick, type HotelSnapshot, type Localized } from '../types'
import { fullOf, imgAttrs, SIZES, type ImageIndex } from './img'

type Props = {
  block: { heading?: Localized<string>; intro?: Localized<string>; limit?: number | null; layout?: string | null; linkLabel?: Localized<string>; linkHref?: string | null }
  /** Resolved "see all" address (the site's routing turns a slug into a path); undefined hides the link. */
  linkHref?: string
  /** Platform photos of the release, for srcset and sizes. */
  images?: ImageIndex
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

// Small line icons for the card facts (24-box, 1.5 stroke, currentColor), our own paths.
const ICON = {
  user: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.5 18.5a6.5 6.5 0 0 1 11 0"/>',
  bed: '<path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7"/><path d="M3 15h18"/><path d="M6 9V6.5A1.5 1.5 0 0 1 7.5 5h9A1.5 1.5 0 0 1 18 6.5V9"/><path d="M3 18v2M21 18v2"/>',
  size: '<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M8 4v4M4 8h4M16 20v-4M20 16h-4"/>',
}
const Ico = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: d }} />
)

export function RoomsBlock({ block, hotel, locale, defaultLocale, roomsHref, headingLevel = 'h2', linkHref, images }: Props) {
  const t = locale === 'fr' ? T.fr : T.en
  const p = <V,>(v: Localized<V> | null | undefined) => pick(v, locale, defaultLocale)
  const rooms = (hotel?.rooms ?? []).slice(0, block.limit || undefined)
  if (!rooms.length) return null
  const Heading = headingLevel
  const detailed = block.layout === 'detailed'
  return (
    <section className="hh-section hh-rooms">
      <div className="hh-wrap">
        {linkHref && p(block.linkLabel) ? (
          <div className="hh-section-head hh-section-head--split">
            <div>
              {p(block.heading) && <Heading className="hh-section-title">{p(block.heading)}</Heading>}
              {p(block.intro) && <p className="hh-lead">{p(block.intro)}</p>}
            </div>
            <a className="hh-link-arrow" href={linkHref}>
              {p(block.linkLabel)}
            </a>
          </div>
        ) : (
          <>
            {p(block.heading) && <Heading className="hh-section-title">{p(block.heading)}</Heading>}
            {p(block.intro) && <p className="hh-lead">{p(block.intro)}</p>}
          </>
        )}
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
                    {detailed ? (
                      // Room page: the photos open in the page's lightbox, browsed per room.
                      <a className="hh-photo-link" href={fullOf(images, img.url)} data-lightbox={`room-${r.slug}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt={p(img.alt) || p(r.name) || ''} loading="lazy" decoding="async" {...imgAttrs(images, img.url, SIZES.half)} />
                      </a>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img.url} alt={p(img.alt) || p(r.name) || ''} loading="lazy" decoding="async" {...imgAttrs(images, img.url, SIZES.card)} />
                    )}
                    {!detailed && r.category && <span className="hh-room-tag">{r.category}</span>}
                  </div>
                )}
                <div className="hh-room-body">
                  {r.category && <p className="hh-eyebrow">{r.category}</p>}
                  <h3>{p(r.name)}</h3>
                  {meta.length > 0 && <p className="hh-room-meta">{meta.join(' · ')}</p>}
                  {!detailed && (r.maxOccupancy || p(r.bed) || r.sizeSqm) ? (
                    <ul className="hh-room-facts">
                      {r.maxOccupancy ? (
                        <li>
                          <Ico d={ICON.user} />
                          {t.guests(r.maxOccupancy)}
                        </li>
                      ) : null}
                      {p(r.bed) ? (
                        <li>
                          <Ico d={ICON.bed} />
                          {p(r.bed)}
                        </li>
                      ) : null}
                      {r.sizeSqm ? (
                        <li>
                          <Ico d={ICON.size} />
                          {r.sizeSqm} {t.size}
                        </li>
                      ) : null}
                    </ul>
                  ) : null}
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
                        <a key={i} className="hh-photo-link" href={fullOf(images, im.url)} data-lightbox={`room-${r.slug}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={im.url} alt={p(im.alt) || p(r.name) || ''} loading="lazy" decoding="async" {...imgAttrs(images, im.url, SIZES.thumb)} />
                        </a>
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
