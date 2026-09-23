import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { labelsFor, liveReleaseFor, localeFor, practicalInfo } from '@/releases/render-data'
import { pick } from '@/releases/snapshot'
import { BookingForm, SiteFooter, SiteHeader } from '../chrome'

type Props = {
  params: Promise<{ site: string; slug?: string[] }>
  searchParams: Promise<{ lang?: string | string[] }>
}

export const dynamic = 'force-dynamic'

async function load(props: Props) {
  const { site, slug } = await props.params
  const { lang } = await props.searchParams
  const live = await liveReleaseFor(site)
  if (!live) return null
  const snapshot = live.release.snapshot
  const path = slug?.join('/') || 'home'
  const page = snapshot.pages.find((p) => p.slug === path)
  if (!page) return null
  const locale = localeFor(snapshot, lang)
  return { live, snapshot, page, locale, path }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const d = await load(props)
  if (!d) return {}
  const { snapshot, page, locale, live } = d
  const def = snapshot.site.defaultLocale
  const brand = snapshot.site.brandName || snapshot.site.name
  const title = pick(page.seo?.title, locale, def) || pick(page.title, locale, def) || brand
  return {
    title: title === brand ? brand : `${title} · ${brand}`,
    description: pick(page.seo?.description, locale, def) || undefined,
    // Release stamp: the pipeline's verification step reads this to confirm what is served.
    other: { 'x-release': String(live.release.id), 'x-release-version': live.release.version },
  }
}

export default async function SitePage(props: Props) {
  const d = await load(props)
  if (!d) notFound()
  const { live, snapshot, page, locale, path } = d
  const def = snapshot.site.defaultLocale
  const t = labelsFor(locale)
  const info = practicalInfo(snapshot)
  const hasBooking = snapshot.site.booking.engine !== 'none' && Boolean(snapshot.site.booking.propertyCode)
  const hasInfo = Boolean(info.checkIn || info.checkOut || info.phones.length || info.email || info.address)

  return (
    <>
      <SiteHeader snapshot={snapshot} locale={locale} current={path} />
      <main>
        {page.blocks.map((b, i) => {
          if (b.blockType === 'hero') {
            const Tag = i === 0 ? 'h1' : 'h2'
            return (
              <section key={b.id ?? i} className="hh-hero">
                <div className="hh-wrap">
                  <Tag>{pick(b.heading, locale, def)}</Tag>
                  {pick(b.subheading, locale, def) && <p>{pick(b.subheading, locale, def)}</p>}
                </div>
              </section>
            )
          }
          if (b.blockType === 'richText') {
            const content = pick(b.content, locale, def) as SerializedEditorState | undefined
            if (!content) return null
            return (
              <section key={b.id ?? i} className="hh-wrap hh-rich">
                <RichText data={content} />
              </section>
            )
          }
          return null
        })}
        {!page.blocks.some((b) => b.blockType === 'hero') && (
          <section className="hh-hero">
            <div className="hh-wrap">
              <h1>{pick(page.title, locale, def)}</h1>
            </div>
          </section>
        )}
        {(hasBooking || hasInfo) && (
          <div className="hh-wrap hh-grid">
            {hasBooking ? (
              <section className="hh-card" aria-labelledby="hh-book">
                <h2 id="hh-book">{t.book}</h2>
                <BookingForm siteSlug={snapshot.site.slug} locale={locale} t={t} />
              </section>
            ) : (
              <div />
            )}
            {hasInfo && (
              <section className="hh-card" aria-labelledby="hh-info">
                <h2 id="hh-info">{t.practical}</h2>
                <dl className="hh-facts">
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
                  {info.phones.map((p) => (
                    <React.Fragment key={p}>
                      <dt>{t.phone}</dt>
                      <dd>
                        <a href={`tel:${p.replace(/\s/g, '')}`}>{p}</a>
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
                  {info.address && (
                    <>
                      <dt>{t.address}</dt>
                      <dd>{info.address}</dd>
                    </>
                  )}
                </dl>
              </section>
            )}
          </div>
        )}
      </main>
      <SiteFooter release={live.release} t={t} mock={snapshot.site.booking.engine === 'clockpms-be-mock'} />
    </>
  )
}
