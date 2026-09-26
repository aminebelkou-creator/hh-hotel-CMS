import React from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { HeroRating, OffersBlock, PoliciesBlock, RoomsBlock } from '@hh/pack-hotel/render'
import type { HotelSnapshot } from '@hh/pack-hotel'
import { pick, type Localized, type SiteSnapshot, type SnapshotBlock } from '@/releases/snapshot'
import { bookHref, linkHref, pageHref, siteBooking } from './routing'
import { BookingBar } from './BookingBar'
import { practicalInfo } from './load'
import type { Labels } from './i18n'
import { FormBlock } from './FormBlock'
import { Icon, isIconId } from './icons'
import { Img as SharedImg, fullSizeOf, SIZES } from './Img'
import { Lightbox } from './Lightbox'
import { NewsBlock } from './News'
import { ReviewsBlock } from './Reviews'
import { HeroVideo } from './HeroVideo'

type Ctx = { snapshot: SiteSnapshot; locale: string; t: Labels }

const paragraphs = (text: unknown) =>
  (typeof text === 'string' ? text : '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)


export function Blocks({ blocks, ctx }: { blocks: SnapshotBlock[]; ctx: Ctx }) {
  const { snapshot, locale, t } = ctx
  const Img = (props: { src?: string | null; alt?: string; eager?: boolean; sizes?: keyof typeof SIZES }) => <SharedImg snapshot={snapshot} {...props} />
  const d = snapshot.site.defaultLocale
  const p = <V,>(v: unknown) => pick(v as Localized<V>, locale, d)
  const hasHero = blocks[0]?.blockType === 'hero'
  // The page that lists room types in detail, if any: room cards elsewhere link to it.
  const roomsPage = snapshot.pages.find((pg) => pg.blocks.some((bb) => bb.blockType === 'rooms' && bb.layout === 'detailed'))
  // The hotel's booking engine, if any; else the site's Book link (header button). The hero booking bar opens it.
  const booking = siteBooking(snapshot)
  const book = booking ? bookHref(snapshot, locale) : linkHref(snapshot, locale, snapshot.site.cta?.href ?? undefined)
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
                {b.imageUrl ? <Img src={b.imageUrl as string} alt={p<string>(b.imageAlt)} eager={i === 0} sizes="full" /> : null}
                {b.imageUrl && typeof b.videoUrl === 'string' && b.videoUrl ? (
                  <HeroVideo src={b.videoUrl} mobileSrc={(b.videoMobileUrl as string) || null} labels={{ pauseVideo: t.pauseVideo, playVideo: t.playVideo }} />
                ) : null}
                <div className="hh-hero-inner hh-wrap">
                  {b.rating === 'classification' && <HeroRating facts={snapshot.facts} locale={locale} />}
                  <Tag>{p<string>(b.heading)}</Tag>
                  {p<string>(b.subheading) && <p className="hh-hero-sub">{p<string>(b.subheading)}</p>}
                  {cta && p<string>(b.ctaLabel) && (
                    <a className="hh-btn hh-btn--light" href={cta}>
                      {p<string>(b.ctaLabel)}
                    </a>
                  )}
                </div>
                {b.bookingBar && book ? (
                  <div className="hh-wrap">
                    {/* Opens the hotel's booking engine (or the Book link) with the chosen dates: no availability, no prices (owner decision, 24 Sep). */}
                    <BookingBar
                      id={key}
                      booking={booking}
                      action={book}
                      locale={locale}
                      labels={{ checkAvailability: t.checkAvailability, arrival: t.arrival, departure: t.departure, guests: t.guests, guestsN: t.guestsN, book: t.book }}
                    />
                  </div>
                ) : null}
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
                    {((b.points as { text: unknown }[] | undefined) ?? []).length > 0 && (
                      <ul className="hh-checklist">
                        {(b.points as { text: unknown }[]).map((pt, k) => (
                          <li key={k}>{p<string>(pt.text)}</li>
                        ))}
                      </ul>
                    )}
                    {href && p<string>(b.linkLabel) && (
                      <a className="hh-link-arrow" href={href}>
                        {p<string>(b.linkLabel)}
                      </a>
                    )}
                  </div>
                  {b.imageUrl ? (
                    <div className="hh-split-media">
                      <a className="hh-photo-link" href={fullSizeOf(snapshot, b.imageUrl as string)} data-lightbox={key}>
                        <Img src={b.imageUrl as string} alt={p<string>(b.imageAlt)} sizes="half" />
                      </a>
                    </div>
                  ) : null}
                </div>
              </section>
            )
          }
          case 'features': {
            const items = (b.items as { title: unknown; text?: unknown; icon?: unknown }[]) ?? []
            return (
              <section key={key} className="hh-section hh-section--tint">
                <div className="hh-wrap">
                  {p<string>(b.heading) && <h2 className="hh-section-title">{p<string>(b.heading)}</h2>}
                  {p<string>(b.intro) && <p className="hh-lead">{p<string>(b.intro)}</p>}
                  <ul className="hh-features">
                    {items.map((it, k) => (
                      <li key={k}>
                        {isIconId(it.icon) && (
                          <span className="hh-feature-icon">
                            <Icon id={it.icon} />
                          </span>
                        )}
                        <h3>{p<string>(it.title)}</h3>
                        {p<string>(it.text) && <p>{p<string>(it.text)}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )
          }
          case 'banners': {
            const items = (b.items as { imageUrl: string; imageAlt?: unknown; title: unknown; href?: string | null }[]) ?? []
            if (!items.length) return null
            return (
              <section key={key} className="hh-section hh-banners">
                <div className="hh-wrap">
                  {(p<string>(b.eyebrow) || p<string>(b.heading)) && (
                    <div className="hh-section-head hh-section-head--center">
                      {p<string>(b.eyebrow) && <p className="hh-eyebrow">{p<string>(b.eyebrow)}</p>}
                      {p<string>(b.heading) && <h2 className="hh-section-title">{p<string>(b.heading)}</h2>}
                    </div>
                  )}
                  <ul className="hh-banners-list">
                    {items.map((it, k) => {
                      const href = linkHref(snapshot, locale, it.href ?? undefined)
                      const inner = (
                        <>
                          <Img src={it.imageUrl} alt={p<string>(it.imageAlt)} sizes="full" />
                          <h3>{p<string>(it.title)}</h3>
                        </>
                      )
                      return (
                        <li key={k} className="hh-banner">
                          {href ? (
                            <a className="hh-banner-inner" href={href}>
                              {inner}
                            </a>
                          ) : (
                            <div className="hh-banner-inner">{inner}</div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </section>
            )
          }
          case 'mediaBand':
            return b.imageUrl ? (
              <section key={key} className="hh-media-band">
                <Img src={b.imageUrl as string} alt={p<string>(b.imageAlt)} sizes="full" />
              </section>
            ) : null
          case 'gallery': {
            const images = (b.images as { url: string; alt?: unknown }[]) ?? []
            return (
              <section key={key} className="hh-section">
                <div className="hh-wrap">
                  {p<string>(b.heading) && <h2 className="hh-section-title">{p<string>(b.heading)}</h2>}
                  {/* Plain links to the full-size file (work without JS); the page's Lightbox opens them. */}
                  <div className="hh-gallery">
                    {images.map((im, k) => (
                      <figure key={k}>
                        <a className="hh-gallery-link" href={fullSizeOf(snapshot, im.url)} data-lightbox={key}>
                          <Img src={im.url} alt={p<string>(im.alt)} sizes="third" />
                        </a>
                      </figure>
                    ))}
                  </div>
                </div>
              </section>
            )
          }
          case 'text': {
            const parts = paragraphs(p<string>(b.body))
            return (
              <section key={key} className="hh-section">
                <div className="hh-wrap hh-prose">
                  {p<string>(b.heading) && <h2 className="hh-section-title">{p<string>(b.heading)}</h2>}
                  {parts.map((para, k) =>
                    para.startsWith('## ') ? (
                      <h3 key={k}>{para.slice(3)}</h3>
                    ) : (
                      <p key={k}>
                        {para.split('\n').map((line, j, arr) => (
                          <React.Fragment key={j}>
                            {line}
                            {j < arr.length - 1 && <br />}
                          </React.Fragment>
                        ))}
                      </p>
                    ),
                  )}
                </div>
              </section>
            )
          }
          case 'faq': {
            const items = ((b.items as { question: unknown; answer: unknown }[]) ?? []).map((it) => ({ q: p<string>(it.question) ?? '', a: p<string>(it.answer) ?? '' }))
            if (!items.length) return null
            const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map((it) => ({ '@type': 'Question', name: it.q, acceptedAnswer: { '@type': 'Answer', text: it.a } })) }
            return (
              <section key={key} className="hh-section">
                <div className="hh-wrap hh-prose">
                  {p<string>(b.heading) && <h2 className="hh-section-title">{p<string>(b.heading)}</h2>}
                  <div className="hh-faq">
                    {items.map((it, k) => (
                      <details key={k}>
                        <summary>{it.q}</summary>
                        {paragraphs(it.a).map((para, j) => (
                          <p key={j}>{para}</p>
                        ))}
                      </details>
                    ))}
                  </div>
                </div>
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
              </section>
            )
          }
          case 'offers':
            return (
              <OffersBlock
                key={key}
                block={b as never}
                hotel={snapshot.packs.hotel as HotelSnapshot | undefined}
                locale={locale}
                defaultLocale={d}
                resolveHref={(h) => linkHref(snapshot, locale, h)}
                images={snapshot.images}
              />
            )
          case 'reviews':
            return <ReviewsBlock key={key} block={b} ctx={ctx} headingLevel={!hasHero && i === 0 ? 'h1' : 'h2'} />
          case 'news':
            return <NewsBlock key={key} block={b} ctx={ctx} headingLevel={!hasHero && i === 0 ? 'h1' : 'h2'} />
          case 'policies': {
            const info = practicalInfo(snapshot)
            return <PoliciesBlock key={key} block={b as never} locale={locale} defaultLocale={d} checkIn={info.checkIn} checkOut={info.checkOut} />
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
            const points = ((b.points as { text?: unknown }[] | undefined) ?? []).map((pt) => p<string>(pt.text)).filter(Boolean) as string[]
            const button = href && p<string>(b.buttonLabel) && (
              <a className="hh-btn hh-btn--book" href={href}>
                {p<string>(b.buttonLabel)}
              </a>
            )
            const list = points.length > 0 && (
              <ul className="hh-cta-points">
                {points.map((pt, k) => (
                  <li key={k}>{pt}</li>
                ))}
              </ul>
            )
            if (b.variant === 'strip') {
              // A slim line right under the hero: why book direct, and the button.
              return (
                <section key={key} className="hh-cta-strip" aria-label={p<string>(b.heading) || undefined}>
                  <div className="hh-wrap hh-cta-strip-inner">
                    {p<string>(b.heading) && <p className="hh-cta-strip-title">{p<string>(b.heading)}</p>}
                    {list}
                    {button}
                  </div>
                </section>
              )
            }
            return (
              <section key={key} className={b.imageUrl ? 'hh-cta hh-cta--image' : 'hh-cta'}>
                {b.imageUrl ? <Img src={b.imageUrl as string} alt="" sizes="full" /> : null}
                <div className="hh-wrap hh-cta-inner">
                  {p<string>(b.heading) && <h2>{p<string>(b.heading)}</h2>}
                  {p<string>(b.text) && <p>{p<string>(b.text)}</p>}
                  {list}
                  {button}
                </div>
              </section>
            )
          }
          case 'form': {
            const formId = Number(typeof b.form === 'object' && b.form ? (b.form as { id: number }).id : b.form)
            const form = (snapshot.forms ?? []).find((f) => f.id === formId)
            if (!form) return null
            return (
              <section key={key} className="hh-section">
                <div className="hh-wrap hh-prose">
                  {p<string>(b.heading) && <h2 className="hh-section-title">{p<string>(b.heading)}</h2>}
                  {paragraphs(p<string>(b.intro)).map((para, k) => (
                    <p key={k} className="hh-lead">
                      {para}
                    </p>
                  ))}
                  <FormBlock form={form} t={t} />
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
            const open = `https://www.openstreetmap.org/?mlat=${info.lat}&mlon=${info.lon}#map=${z}/${info.lat}/${info.lon}`
            // A static image made at publish time (no third-party request from the visitor's browser).
            const img = snapshot.mapImage
            return (
              <section key={key} className="hh-section">
                <div className="hh-wrap">
                  {p<string>(b.heading) && <h2 className="hh-section-title">{p<string>(b.heading)}</h2>}
                  {paragraphs(p<string>(b.text)).map((para, k) => (
                    <p key={k} className="hh-lead">
                      {para}
                    </p>
                  ))}
                  {img && (
                    <div className="hh-map">
                      <a href={open} rel="noopener">
                        <img src={img} alt={`${t.address}: ${info.address ?? ''}`.trim()} width={1200} height={640} loading="lazy" decoding="async" />
                      </a>
                      <a className="hh-map-credit" href="https://www.openstreetmap.org/copyright" rel="noopener">
                        © OpenStreetMap contributors
                      </a>
                    </div>
                  )}
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
                bookHref={booking ? (bookHref(snapshot, locale) ?? undefined) : undefined}
                linkHref={linkHref(snapshot, locale, b.linkHref as string) ?? undefined}
                images={snapshot.images}
                headingLevel={!hasHero && i === 0 ? 'h1' : 'h2'}
              />
            )
          default:
            return null
        }
      })}
      <Lightbox labels={{ close: t.close, previous: t.previous, next: t.next }} />
    </>
  )
}
