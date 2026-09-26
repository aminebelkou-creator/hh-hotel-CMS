/**
 * The hotel's booking engine, as a link: the platform runs no booking logic, it sends the guest
 * to the engine the hotel already uses (owner decision, 24 Sep), with the dates when known.
 *
 * Pure (no server imports): the booking bar's client component builds the same URL.
 */
export type BookingEngine = 'link' | 'clock-pms'
export type Booking = { engine: BookingEngine; url: string }
export type Stay = { arrival?: string | null; departure?: string | null; adults?: number | null }

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

/**
 * The engine's address for a stay.
 * - clock-pms (Clock PMS+ web booking engine, e.g. https://sky-eu1.clock-software.com/spa/pms-wbe/#/hotel/12223):
 *   the query lives in the hash; with both dates it opens the room list for those dates.
 * - link: any other engine or page; arrival, departure and adults are added as query parameters.
 */
export function bookingUrl(b: Booking, locale: string, stay: Stay = {}): string {
  const dates = stay.arrival && stay.departure && ISO_DAY.test(stay.arrival) && ISO_DAY.test(stay.departure) && stay.departure > stay.arrival
  const adults = stay.adults && stay.adults > 0 && stay.adults < 10 ? stay.adults : null
  if (b.engine === 'clock-pms') {
    const [base, hash = ''] = b.url.split('#')
    const [route, existing = ''] = hash.split('?')
    const q = new URLSearchParams(existing)
    if (dates) {
      q.set('submit', 'true')
      q.set('arrival', stay.arrival!)
      q.set('departure', stay.departure!)
      q.set('adults', String(adults ?? 2))
      q.set('children', '0')
    }
    q.set('site_language', locale)
    return `${base}#${route || '/'}?${q.toString()}`
  }
  const u = new URL(b.url)
  if (dates) {
    u.searchParams.set('arrival', stay.arrival!)
    u.searchParams.set('departure', stay.departure!)
  }
  if (adults) u.searchParams.set('adults', String(adults))
  return u.toString()
}

/** A usable engine setting, or null (no URL, or not https). */
export function bookingOf(v: { engine?: string | null; url?: string | null } | null | undefined): Booking | null {
  const url = (v?.url ?? '').trim()
  if (!/^https:\/\/[^\s]+$/.test(url)) return null
  return { engine: v?.engine === 'clock-pms' ? 'clock-pms' : 'link', url }
}
