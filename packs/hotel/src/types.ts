/** Shapes the pack shares with the platform renderer, kept structural so the pack imports nothing from the app. */
export type Localized<T> = T | Record<string, T | null | undefined>

export type SnapshotRoom = {
  id: number
  slug: string
  name: Localized<string>
  category: string | null
  summary: Localized<string> | null
  description: Localized<string> | null
  sizeSqm: number | null
  maxOccupancy: number | null
  bed: Localized<string> | null
  view: Localized<string> | null
  features: { label: Localized<string> }[]
  images: { url: string; alt: Localized<string> | null }[]
}

export type SnapshotOffer = {
  id: number
  slug: string
  title: Localized<string>
  highlight: Localized<string> | null
  summary: Localized<string> | null
  conditions: Localized<string> | null
  validFrom: string | null
  validTo: string | null
  imageUrl: string | null
  imageAlt: Localized<string> | null
  ctaLabel: Localized<string> | null
  ctaHref: string | null
}

export type HotelSnapshot = { rooms: SnapshotRoom[]; offers?: SnapshotOffer[] }

/** Offers shown on a given day: inside their dates (inclusive), whole days in UTC. */
export function currentOffers(offers: SnapshotOffer[] | undefined, today = new Date().toISOString().slice(0, 10)) {
  return (offers ?? []).filter((o) => (!o.validFrom || o.validFrom.slice(0, 10) <= today) && (!o.validTo || o.validTo.slice(0, 10) >= today))
}

export type Fact = { key: string; value: string }

/** Pick a localized value: requested locale, then the site default, then any non-empty value. */
export function pick<T>(v: Localized<T> | undefined | null, locale: string, fallback: string): T | undefined {
  if (v === null || v === undefined) return undefined
  if (typeof v !== 'object' || Array.isArray(v)) return v as T
  const rec = v as Record<string, T | null | undefined>
  const keys = Object.keys(rec)
  if (!keys.length) return undefined
  if (!keys.every((k) => /^[a-z]{2}(-[A-Z]{2})?$/.test(k))) return v as T
  return (rec[locale] ?? rec[fallback] ?? keys.map((k) => rec[k]).find((x) => x !== null && x !== undefined)) ?? undefined
}
