import React from 'react'

/**
 * The hotel's official star classification, read from the confirmed facts of the release
 * (`rating.stars`), for the hero's `rating: classification` option. Never a review score,
 * never typed by hand: without a confirmed fact, nothing renders.
 */
export function classificationOf(facts: { key: string; value: string }[]): number | null {
  // `rating.stars` is what the crawler writes; `hotel.stars` is customer zero's older key.
  const raw = (facts.find((f) => f.key === 'rating.stars') ?? facts.find((f) => f.key === 'hotel.stars'))?.value
  const n = Number((raw ?? '').match(/\d/)?.[0])
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null
}

const LABEL: Record<string, (n: number) => string> = {
  fr: (n) => `Hôtel ${n} étoile${n > 1 ? 's' : ''}`,
  en: (n) => `${n}-star hotel`,
}

export function HeroRating({ facts, locale }: { facts: { key: string; value: string }[]; locale: string }) {
  const n = classificationOf(facts)
  if (!n) return null
  const label = (LABEL[locale] ?? LABEL.en)(n)
  return (
    <p className="hh-hero-rating">
      <span className="hh-stars" aria-hidden="true">
        {'★'.repeat(n)}
      </span>
      <span>{label}</span>
    </p>
  )
}
