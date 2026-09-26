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

/**
 * The hotel's overall scores on review sites, from confirmed facts only (never computed from the
 * few reviews shown): reviews.<source>.score ("4.6/5", "8.9/10"), .count and .url.
 */
export function reviewScores(snapshot: SiteSnapshot) {
  const facts = snapshot.facts ?? []
  const get = (k: string) => facts.find((f) => f.key === k)?.value
  const sources = [...new Set(facts.map((f) => /^reviews\.([a-z]+)\.score$/.exec(f.key)?.[1]).filter(Boolean) as string[])]
  return sources
    .map((s) => {
      const m = /^\s*(\d+(?:[.,]\d+)?)\s*\/\s*(\d+)\s*$/.exec(get(`reviews.${s}.score`) ?? '')
      if (!m) return null
      const count = Number((get(`reviews.${s}.count`) ?? '').replace(/[^\d]/g, '')) || null
      const url = get(`reviews.${s}.url`)
      return { source: s, name: SOURCE_NAMES[s] ?? s, score: Number(m[1].replace(',', '.')), scale: Number(m[2]), count, url: url && /^https:\/\//.test(url) ? url : null }
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x && x.scale > 0 && x.score <= x.scale))
}

function Scores({ ctx }: { ctx: Ctx }) {
  const { snapshot, locale, t } = ctx
  const scores = reviewScores(snapshot)
  if (!scores.length) return null
  return (
    <ul className="hh-review-scores">
      {scores.map((s) => {
        const body = (
          <>
            <span className="hh-review-scores-name">{s.name}</span>
            <strong>
              {num(s.score, locale)}/{num(s.scale, locale)}
            </strong>
            {s.count ? <span className="hh-review-scores-count">{t.reviewsCount.replace('{n}', new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-GB').format(s.count))}</span> : null}
          </>
        )
        return <li key={s.source}>{s.url ? <a href={s.url} rel="noopener nofollow">{body}</a> : body}</li>
      })}
    </ul>
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
        <Scores ctx={ctx} />
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
