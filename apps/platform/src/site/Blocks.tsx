import React from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { RoomsBlock } from '@hh/pack-hotel/render'
import type { HotelSnapshot } from '@hh/pack-hotel'
import { pick, type Localized, type SiteSnapshot, type SnapshotBlock } from '@/releases/snapshot'
import { linkHref, pageHref } from './routing'
import { practicalInfo } from './load'
import type { Labels } from './i18n'

type Ctx = { snapshot: SiteSnapshot; locale: string; t: Labels }

const paragraphs = (text: unknown) =>
  (typeof text === 'string' ? text : '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

/* eslint-disable @next/next/no-img-element */
function Img({ src, alt, eager }: { src?: string | null; alt?: string; eager?: boolean }) {
  if (!src) return null
  return <img src={src} alt={alt ?? ''} loading={eager ? 'eager' : 'lazy'} decoding="async" />
}

export function Blocks({ blocks, ctx }: { blocks: SnapshotBlock[]; ctx: Ctx }) {
  const { snapshot, locale, t } = ctx
  const d = snapshot.site.defaultLocale
  const p = <V,>(v: unknown) => pick(v as Localized<V>, locale, d)
  const hasHero = blocks[0]?.blockType === 'hero'
  // The page that lists room types in detail, if any: room cards elsewhere link to it.
  const roomsPage = snapshot.pages.find((pg) => pg.blocks.some((bb) => bb.blockType === 'rooms' && bb.layout === 'detailed'))
  return (
    <>
      {blocks.map((b, i) => {
        const key = b.id ?? `${b.blockType}-${i}`
        switch (b.blockType) {
          case 'hero': {
            const Tag = i === 0 ? 'h1' : 'h2'
            const cta = linkHref(snapshot, locale, b.ctaHref as string)
            return (
              <section key={key} className={b.imageUrl ? 'hh-hero hh-hero--image' : 'hh-hero'}>
                {b.imageUrl ? <Img src={b.imageUrl as string} alt={p<string>(b.imageAlt)} eager={i === 0} /> : null}
                <div className="hh-hero-inner hh-wrap">
                  <Tag>{p<string>(b.heading)}</Tag>
                  {p<string>(b.subheading) && <p className="hh-hero-sub">{p<string>(b.subheading)}</p>}
                  {cta && p<string>(b.ctaLabel) && (
                    <a className="hh-btn hh-btn--light" href={cta}>
                      {p<string>(b.ctaLabel)}
                    </a>
                  )}
                </div>
              </section>
            )
          }
          case 'richText': {
            const content = p<SerializedEditorState>(b.content)
            if (!content) return null
            return (
              <section key={key} className="hh-section">
                <div className="hh-wrap hh-prose">
                  <RichText data={content} />
                </div>
              </section>
            )
          }
          case 'textImage': {
            const href = linkHref(snapshot, locale, b.linkHref as string)
            return (
              <section key={key} className="hh-section">
                <div className={`hh-wrap hh-split ${b.imagePosition === 'left' ? 'hh-split--left' : ''}`}>
                  <div className="hh-split-text">
                    {p<string>(b.eyebrow) && <p className="hh-eyebrow">{p<string>(b.eyebrow)}</p>}
                    {p<string>(b.heading) && <h2 className="hh-section-title">{p<string>(b.heading)}</h2>}
                    {paragraphs(p<string>(b.body)).map((para, k) => (
                      <p key={k}>{para}</p>
                    ))}
                    {href && p<string>(b.linkLabel) && (
                      <a className="hh-link-arrow" href={href}>
                        {p<string>(b.linkLabel)}
                      </a>
                    )}
                  </div>
                  {b.imageUrl ? (
                    <div className="hh-split-media">
                      <Img src={b.imageUrl as string} alt={p<string>(b.imageAlt)} />
                    </div>
                  ) : null}
                </div>
              </section>
            )
          }
          case 'features': {
            const items = (b.items as { title: unknown; text?: unknown }[]) ?? []
            return (
              <section key={key} className="hh-section hh-section--tint">
                <div className="hh-wrap">
                  {p<string>(b.heading) && <h2 className="hh-section-title">{p<string>(b.heading)}</h2>}
                  {p<string>(b.intro) && <p className="hh-lead">{p<string>(b.intro)}</p>}
                  <ul className="hh-features">
                    {items.map((it, k) => (
                      <li key={k}>
                        <h3>{p<string>(it.title)}</h3>
                        {p<string>(it.text) && <p>{p<string>(it.text)}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )
          }
          case 'gallery': {
            const images = (b.images as { url: string; alt?: unknown }[]) ?? []
            return (
              <section key={key} className="hh-section">
                <div className="hh-wrap">
                  {p<string>(b.heading) && <h2 className="hh-section-title">{p<string>(b.heading)}</h2>}
                  <div className="hh-gallery">
                    {images.map((im, k) => (
                      <figure key={k}>
                        <Img src={im.url} alt={p<string>(im.alt)} />
                      </figure>
                    ))}
                  </div>
                </div>
              </section>
            )
          }
          case 'quote':
            return (
              <section key={key} className="hh-section">
                <figure className="hh-wrap hh-quote">
                  <blockquote>{p<string>(b.text)}</blockquote>
                  {p<string>(b.author) && <figcaption>{p<string>(b.author)}</figcaption>}
                </figure>
              </section>
            )
          case 'cta': {
            const href = linkHref(snapshot, locale, b.buttonHref as string)
            return (
              <section key={key} className={b.imageUrl ? 'hh-cta hh-cta--image' : 'hh-cta'}>
                {b.imageUrl ? <Img src={b.imageUrl as string} alt="" /> : null}
                <div className="hh-wrap hh-cta-inner">
                  {p<string>(b.heading) && <h2>{p<string>(b.heading)}</h2>}
                  {p<string>(b.text) && <p>{p<string>(b.text)}</p>}
                  {href && p<string>(b.buttonLabel) && (
                    <a className="hh-btn" href={href}>
                      {p<string>(b.buttonLabel)}
                    </a>
                  )}
                </div>
              </section>
            )
          }
          case 'contact': {
            const info = practicalInfo(snapshot)
            return (
              <section key={key} className="hh-section">
                <div className="hh-wrap hh-contact">
                  <div>
                    {p<string>(b.heading) && <h2 className="hh-section-title">{p<string>(b.heading)}</h2>}
                    {paragraphs(p<string>(b.intro)).map((para, k) => (
                      <p key={k}>{para}</p>
                    ))}
                  </div>
                  <dl className="hh-facts">
                    {info.address && (
                      <>
                        <dt>{t.address}</dt>
                        <dd>{info.address}</dd>
                      </>
                    )}
                    {info.phones.map((ph) => (
                      <React.Fragment key={ph}>
                        <dt>{t.phone}</dt>
                        <dd>
                          <a href={`tel:${ph.replace(/\s/g, '')}`}>{ph}</a>
                        </dd>
                      </React.Fragment>
                    ))}
                    {info.email && (
                      <>
                        <dt>{t.email}</dt>
                        <dd>
                          <a href={`mailto:${info.email}`}>{info.email}</a>
                        </dd>
                      </>
                    )}
                    {info.checkIn && (
                      <>
                        <dt>{t.checkIn}</dt>
                        <dd>{info.checkIn}</dd>
                      </>
                    )}
                    {info.checkOut && (
                      <>
                        <dt>{t.checkOut}</dt>
                        <dd>{info.checkOut}</dd>
                      </>
                    )}
                  </dl>
                </div>
              </section>
            )
          }
          case 'map': {
            const info = practicalInfo(snapshot)
            if (!Number.isFinite(info.lat) || !Number.isFinite(info.lon) || !info.lat) return null
            const z = Number(b.zoom) || 16
            // Half-extent of the embedded map around the marker, halving with each zoom level.
            const dx = 0.0045 * Math.pow(2, 16 - z)
            const dy = 0.0022 * Math.pow(2, 16 - z)
            const bbox = [info.lon - dx, info.lat - dy, info.lon + dx, info.lat + dy].map((n) => n.toFixed(5)).join('%2C')
            const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${info.lat}%2C${info.lon}`
            const open = `https://www.openstreetmap.org/?mlat=${info.lat}&mlon=${info.lon}#map=${z}/${info.lat}/${info.lon}`
            return (
              <section key={key} className="hh-section">
                <div className="hh-wrap">
                  {p<string>(b.heading) && <h2 className="hh-section-title">{p<string>(b.heading)}</h2>}
                  {paragraphs(p<string>(b.text)).map((para, k) => (
                    <p key={k} className="hh-lead">
                      {para}
                    </p>
                  ))}
                  <div className="hh-map">
                    <iframe title={p<string>(b.heading) || t.address} src={src} loading="lazy" referrerPolicy="no-referrer" />
                  </div>
                  <p>
                    <a className="hh-link-arrow" href={open} rel="noopener">
                      {t.openMap}
                    </a>
                  </p>
                </div>
              </section>
            )
          }
          case 'rooms':
            return (
              <RoomsBlock
                key={key}
                block={b as never}
                hotel={snapshot.packs.hotel as HotelSnapshot | undefined}
                locale={locale}
                defaultLocale={d}
                roomsHref={roomsPage ? pageHref(snapshot, locale, roomsPage.slug) : undefined}
                headingLevel={!hasHero && i === 0 ? 'h1' : 'h2'}
              />
            )
          default:
            return null
        }
      })}
    </>
  )
}
