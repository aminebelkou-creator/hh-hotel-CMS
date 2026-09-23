import { createHash } from 'node:crypto'
import {
  BookingSearchError,
  type AvailabilityResult,
  type BookingEngineAdapter,
  type BookingEngineConfig,
  type BookingSearch,
  type RoomOffer,
} from './types'

/**
 * clockPMS BE (mock): a stand-in for the xedge booking engine until the real one is
 * available. It is deterministic: the same property, dates and guests always give the same
 * answer, so pages, tests and demos are reproducible. Nothing here is a real rate.
 */
export const CLOCKPMS_MOCK_ENGINE = 'clockpms-be-mock'

export const MOCK_ROOMS = [
  { code: 'CLA', name: 'Classic Double', capacity: 2, base: 15900, stock: 12 },
  { code: 'SUP', name: 'Superior Double', capacity: 2, base: 18900, stock: 10 },
  { code: 'FAM', name: 'Family Room', capacity: 4, base: 24900, stock: 4 },
] as const

const PLANS = [
  { code: 'BAR', name: 'Flexible rate', cancellable: true, factor: 1 },
  { code: 'NRF', name: 'Non-refundable, pay now', cancellable: false, factor: 0.9 },
] as const

/** Seasonal factor by month (Paris: spring, autumn fairs and December are high). */
const SEASON = [0.85, 0.85, 0.95, 1.05, 1.1, 1.15, 1.0, 0.9, 1.15, 1.1, 0.95, 1.05]
export const MAX_NIGHTS = 30
const MAX_ADVANCE_DAYS = 500
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const DAY = 86_400_000

const unit = (...parts: (string | number)[]) =>
  createHash('sha256').update(parts.join('|')).digest().readUInt32BE(0) / 0xffffffff

const parseDate = (s: string, field: 'checkIn' | 'checkOut'): Date => {
  if (typeof s !== 'string' || !DATE_RE.test(s)) throw new BookingSearchError(`${field} must be YYYY-MM-DD`, field)
  const d = new Date(`${s}T00:00:00Z`)
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) {
    throw new BookingSearchError(`${field} is not a real date`, field)
  }
  return d
}
const iso = (d: Date) => d.toISOString().slice(0, 10)

export function validateSearch(search: BookingSearch, today: string): { nights: string[] } {
  const inD = parseDate(search.checkIn, 'checkIn')
  const outD = parseDate(search.checkOut, 'checkOut')
  const todayD = parseDate(today, 'checkIn')
  if (inD < todayD) throw new BookingSearchError('Arrival is in the past', 'checkIn')
  if ((inD.getTime() - todayD.getTime()) / DAY > MAX_ADVANCE_DAYS) {
    throw new BookingSearchError(`Arrival more than ${MAX_ADVANCE_DAYS} days ahead`, 'checkIn')
  }
  const n = Math.round((outD.getTime() - inD.getTime()) / DAY)
  if (n < 1) throw new BookingSearchError('Departure must be after arrival', 'dates')
  if (n > MAX_NIGHTS) throw new BookingSearchError(`At most ${MAX_NIGHTS} nights`, 'dates')
  if (!Number.isInteger(search.adults) || search.adults < 1 || search.adults > 8) {
    throw new BookingSearchError('Adults must be between 1 and 8', 'adults')
  }
  const children = search.children ?? 0
  if (!Number.isInteger(children) || children < 0 || children > 6) {
    throw new BookingSearchError('Children must be between 0 and 6', 'children')
  }
  return { nights: Array.from({ length: n }, (_, i) => iso(new Date(inD.getTime() + i * DAY))) }
}

const roomOf = (code: string) => {
  const room = MOCK_ROOMS.find((r) => r.code === code)
  if (!room) throw new Error(`Unknown room ${code}`)
  return room
}

/** Nightly price of a room, before the rate-plan factor, in minor units (whole euros). */
export function nightlyBase(propertyCode: string, roomCode: string, date: string): number {
  const room = roomOf(roomCode)
  const d = new Date(`${date}T00:00:00Z`)
  const weekend = d.getUTCDay() === 5 || d.getUTCDay() === 6 ? 1.2 : 1
  const jitter = 0.92 + unit(propertyCode, roomCode, date, 'price') * 0.16
  return Math.round((room.base * SEASON[d.getUTCMonth()] * weekend * jitter) / 100) * 100
}

/** Rooms left on one night; about one night in twelve is sold out per room type. */
export function nightlyStock(propertyCode: string, roomCode: string, date: string): number {
  const room = roomOf(roomCode)
  const u = unit(propertyCode, roomCode, date, 'stock')
  return u < 0.08 ? 0 : 1 + Math.floor(u * room.stock)
}

export function createClockPmsMock(
  config: BookingEngineConfig,
  opts: { today?: () => string; now?: () => Date } = {},
): BookingEngineAdapter {
  const propertyCode = config.propertyCode
  const currency = config.currency || 'EUR'
  const today = opts.today ?? (() => new Date().toISOString().slice(0, 10))
  const now = opts.now ?? (() => new Date())
  if (!propertyCode) throw new Error('clockPMS BE: propertyCode is required')

  return {
    engine: CLOCKPMS_MOCK_ENGINE,
    async availability(search: BookingSearch): Promise<AvailabilityResult> {
      const { nights } = validateSearch(search, today())
      const guests = search.adults + (search.children ?? 0)
      const promo = search.promoCode?.trim().toUpperCase() === 'DIRECT10' ? 0.9 : 1
      const offers: RoomOffer[] = []
      for (const room of MOCK_ROOMS) {
        if (room.capacity < guests) continue
        const available = Math.min(...nights.map((d) => nightlyStock(propertyCode, room.code, d)))
        for (const plan of PLANS) {
          const perNight = nights.map((date) => ({
            date,
            amount: Math.round((nightlyBase(propertyCode, room.code, date) * plan.factor * promo) / 100) * 100,
          }))
          offers.push({
            roomCode: room.code,
            roomName: room.name,
            capacity: room.capacity,
            available,
            ratePlan: { code: plan.code, name: plan.name, cancellable: plan.cancellable },
            nights: perNight,
            total: perNight.reduce((s, n) => s + n.amount, 0),
            currency,
          })
        }
      }
      // Bookable offers first, cheapest first; sold-out offers last.
      offers.sort((a, b) => Number(a.available === 0) - Number(b.available === 0) || a.total - b.total)
      return {
        engine: CLOCKPMS_MOCK_ENGINE,
        propertyCode,
        currency,
        search: { ...search, children: search.children ?? 0 },
        nights: nights.length,
        offers,
        freshAt: now().toISOString(),
        mock: true,
      }
    },
    bookingUrl(basePath, search, offer) {
      const q = new URLSearchParams({
        checkIn: search.checkIn,
        checkOut: search.checkOut,
        adults: String(search.adults),
        children: String(search.children ?? 0),
      })
      if (search.promoCode) q.set('promo', search.promoCode)
      if (offer) {
        q.set('room', offer.roomCode)
        q.set('rate', offer.ratePlan.code)
      }
      return `${basePath.replace(/\/$/, '')}?${q.toString()}`
    },
  }
}
