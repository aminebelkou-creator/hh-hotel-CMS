import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { bookingAdapterFor, BookingSearchError, formatMoney, searchFromParams, type AvailabilityResult } from '@/booking'
import { labelsFor, liveReleaseFor, localeFor } from '@/releases/render-data'
import { BookingForm, SiteFooter, SiteHeader } from '../chrome'

type SP = Record<string, string | string[] | undefined>
type Props = { params: Promise<{ site: string }>; searchParams: Promise<SP> }

export const dynamic = 'force-dynamic'

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''


export async function generateMetadata(props: Props): Promise<Metadata> {
  const { site } = await props.params
  const live = await liveReleaseFor(site)
  if (!live) return {}
  const s = live.release.snapshot.site
  // The booking path is not a landing page: keep it out of search results.
  return { title: `${labelsFor(localeFor(live.release.snapshot, one((await props.searchParams).lang))).book} · ${s.brandName || s.name}`, robots: { index: false } }
}

/**
 * Same-domain booking step (contract rule 1). The booking engine (here the clockPMS BE mock)
 * owns availability and rates; the platform renders what it returns and never invents a rate.
 */
export default async function BookPage(props: Props) {
  const { site } = await props.params
  const sp = await props.searchParams
  const live = await liveReleaseFor(site)
  if (!live) notFound()
  const snapshot = live.release.snapshot
  const adapter = bookingAdapterFor(snapshot.site.booking)
  if (!adapter) notFound()
  const locale = localeFor(snapshot, one(sp.lang))
  const t = labelsFor(locale)
  const intl = locale === 'fr' ? 'fr-FR' : 'en-GB'
  const search = searchFromParams(sp)

  let result: AvailabilityResult | null = null
  let error: string | null = null
  if (search) {
    try {
      result = await adapter.availability(search)
    } catch (e) {
      if (e instanceof BookingSearchError) error = e.message
      else throw e
    }
  }
  const chosen = result?.offers.find((o) => o.roomCode === one(sp.room) && o.ratePlan.code === one(sp.rate) && o.available > 0)
  const base = `/s/${snapshot.site.slug}/book`

  return (
    <>
      <SiteHeader snapshot={snapshot} locale={locale} />
      <main className="hh-wrap" style={{ padding: '32px 20px 48px' }}>
        <h1>{t.book}</h1>
        <p className="hh-note">{t.mock}</p>
        <div className="hh-grid">
          <section className="hh-card" aria-labelledby="hh-results">
            <h2 id="hh-results">{search ? `${search.checkIn} → ${search.checkOut}` : t.search}</h2>
            {error && (
              <p className="hh-error" role="alert">
                {error}
              </p>
            )}
            {chosen && search && (
              <div role="status">
                <p>
                  <strong>
                    {chosen.roomName} · {chosen.ratePlan.name}
                  </strong>
                  <br />
                  {t.total}: {formatMoney(chosen.total, chosen.currency, intl)} ({result!.nights} {t.nights})
                </p>
                <p className="hh-note">{t.chosen}</p>
              </div>
            )}
            {result && !chosen && (
              <ul className="hh-offers">
                {result.offers.map((o) => (
                  <li key={`${o.roomCode}-${o.ratePlan.code}`} className="hh-card hh-offer">
                    <div>
                      <strong>{o.roomName}</strong>
                      <br />
                      <small>
                        {o.ratePlan.name} · {result!.nights} {t.nights}
                        {o.available > 0 && o.available <= 3 ? ` · ${o.available} ${t.left}` : ''}
                      </small>
                    </div>
                    <div>
                      <span className="hh-price">{formatMoney(o.total, o.currency, intl)}</span>{' '}
                      {o.available > 0 ? (
                        <a className="hh-btn" href={`${adapter.bookingUrl(base, search!, o)}&lang=${locale}`}>
                          {t.select}
                        </a>
                      ) : (
                        <small>{t.soldOut}</small>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {result && (
              <p className="hh-footer" style={{ border: 0, padding: 0 }}>
                {result.engine} · {result.propertyCode} · {new Date(result.freshAt).toISOString()}
              </p>
            )}
          </section>
          <section className="hh-card" aria-labelledby="hh-search">
            <h2 id="hh-search">{t.search}</h2>
            <BookingForm
              siteSlug={snapshot.site.slug}
              locale={locale}
              t={t}
              values={search ? { checkIn: search.checkIn, checkOut: search.checkOut, adults: String(search.adults), children: String(search.children ?? 0), promo: search.promoCode ?? '' } : undefined}
            />
            <p>
              <a href={`/s/${snapshot.site.slug}${locale !== snapshot.site.defaultLocale ? `?lang=${locale}` : ''}`}>{t.back}</a>
            </p>
          </section>
        </div>
      </main>
      <SiteFooter release={live.release} t={t} mock />
    </>
  )
}
