import { createClockPmsMock, CLOCKPMS_MOCK_ENGINE } from './clockpms-be-mock'
import type { BookingEngineAdapter, BookingSearch } from './types'

export * from './types'
export { CLOCKPMS_MOCK_ENGINE } from './clockpms-be-mock'

type SiteBooking = { engine?: string | null; propertyCode?: string | null; currency?: string | null } | null | undefined

/**
 * The adapter for a site's configured booking engine, or null when the site has none.
 * Real engines are added here behind the same interface; the renderer never knows which.
 */
export function bookingAdapterFor(booking: SiteBooking): BookingEngineAdapter | null {
  if (!booking?.engine || booking.engine === 'none') return null
  if (booking.engine === CLOCKPMS_MOCK_ENGINE) {
    if (!booking.propertyCode) return null
    return createClockPmsMock({ engine: booking.engine, propertyCode: booking.propertyCode, currency: booking.currency || 'EUR' })
  }
  return null
}

type Params = Record<string, string | string[] | undefined> | URLSearchParams
const param = (p: Params, k: string) => {
  const v = p instanceof URLSearchParams ? p.get(k) : p[k]
  return (Array.isArray(v) ? v[0] : v) ?? ''
}

/** Search from query parameters (checkIn, checkOut, adults, children, promo); null if dates are missing. */
export function searchFromParams(p: Params): BookingSearch | null {
  if (!param(p, 'checkIn') || !param(p, 'checkOut')) return null
  return {
    checkIn: param(p, 'checkIn'),
    checkOut: param(p, 'checkOut'),
    adults: Number(param(p, 'adults') || 2),
    children: Number(param(p, 'children') || 0),
    promoCode: param(p, 'promo') || undefined,
  }
}

export const formatMoney = (minor: number, currency: string, locale = 'fr-FR') =>
  new Intl.NumberFormat(locale, { style: 'currency', currency }).format(minor / 100)
