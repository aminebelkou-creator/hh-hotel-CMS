import React from 'react'
import { pick, type SiteSnapshot, type SnapshotReview } from '@/releases/snapshot'
import type { Labels } from './i18n'

const SOURCE_NAMES: Record<string, string> = { google: 'Google', booking: 'Booking.com', tripadvisor: 'Tripadvisor', expedia: 'Expedia' }

type Ctx = { snapshot: SiteSnapshot; locale: string; t: Labels }

const monthYear = (iso: string | null, locale: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d)
}

const num = (n: number, locale: string) => new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', { maximumFractionDigits: 1 }).format(n)

/** The score as the guest gave it: stars on a 5 scale, "9.2/10" otherwise; always with a spoken label. */
function Rating({ r, locale, t }: { r: SnapshotReview; locale: string; t: Labels }) {
  if (r.rating === null || !r.ratingScale) return null
  const label = t.ratedOutOf.replace('{n}', num(r.rating, locale)).replace('{max}', num(r.ratingScale, locale))
  if (r.ratingScale === 5) {
    const full = Math.round(r.rating)
    return (
      <p className="hh-review-rating" role="img" aria-label={label}>
        <span aria-hidden="true">{'★'.repeat(full)}{'☆'.repeat(Math.max(0, 5 - full))}</span>
      </p>
    )
  }
  return (
    <p className="hh-review-rating hh-review-score" role="img" aria-label={label}>
      <span aria-hidden="true">
        {num(r.rating, locale)}/{num(r.ratingScale, locale)}
      </span>
    </p>
  )
}

/** Guest reviews, word for word in the guest's language (lang attribute), with where they come from. */
export function ReviewsBlock({ block, ctx, headingLevel }: { block: Record<string, unknown>; ctx: Ctx; headingLevel: 'h1' | 'h2' }) {
  const { snapshot, locale, t } = ctx
  const d = snapshot.site.defaultLocale
  const p = (v: unknown) => pick(v as never, locale, d) as string | undefined
  const reviews = (snapshot.reviews ?? []).slice(0, Number(block.limit) || 6)
  if (!reviews.length) return null
  const Heading = headingLevel
  return (
    <section className="hh-section hh-reviews">
      <div className="hh-wrap">
        {p(block.heading) && <Heading className="hh-section-title">{p(block.heading)}</Heading>}
        {p(block.intro) && <p className="hh-lead">{p(block.intro)}</p>}
        <ul className="hh-review-grid">
          {reviews.map((r) => {
            const name = SOURCE_NAMES[r.source]
            const where = r.source === 'direct' ? t.directReview : name ? t.reviewOn.replace('{source}', name) : ''
            const when = monthYear(r.visitedAt, locale)
            return (
              <li key={r.id}>
                <figure className="hh-review">
                  <Rating r={r} locale={locale} t={t} />
                  <blockquote lang={r.language !== 'other' ? r.language : undefined}>
                    {r.text.split(/\n\s*\n/).map((para, k) => (
                      <p key={k}>{para.trim()}</p>
                    ))}
                  </blockquote>
                  <figcaption>
                    <span className="hh-review-author">
                      {r.author}
                      {r.origin ? `, ${r.origin}` : ''}
                    </span>
                    {(where || when) && (
                      <span className="hh-review-meta">
                        {r.sourceUrl && name ? (
                          <a href={r.sourceUrl} rel="noopener nofollow">
                            {where}
                          </a>
                        ) : (
                          where
                        )}
                        {where && when ? ' · ' : ''}
                        {when}
                      </span>
                    )}
                  </figcaption>
                </figure>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
