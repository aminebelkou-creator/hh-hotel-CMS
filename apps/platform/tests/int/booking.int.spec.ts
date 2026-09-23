/**
 * clockPMS BE mock and the booking adapter boundary. Pure functions: no database.
 */
import { describe, it, expect } from 'vitest'
import { createClockPmsMock, nightlyBase, nightlyStock, MOCK_ROOMS, MAX_NIGHTS } from '@/booking/clockpms-be-mock'
import { bookingAdapterFor, BookingSearchError, searchFromParams, formatMoney } from '@/booking'

const TODAY = '2026-09-23'
const be = createClockPmsMock({ engine: 'clockpms-be-mock', propertyCode: 'HHDOR' }, { today: () => TODAY, now: () => new Date('2026-09-23T10:00:00Z') })
const search = { checkIn: '2026-10-09', checkOut: '2026-10-12', adults: 2 }

describe('clockPMS BE mock', () => {
  it('is deterministic for the same property, dates and guests', async () => {
    const a = await be.availability(search)
    const b = await be.availability(search)
    expect(b).toEqual(a)
  })

  it('prices each night and totals them, in integer minor units', async () => {
    const r = await be.availability(search)
    expect(r.nights).toBe(3)
    for (const o of r.offers) {
      expect(o.nights.map((n) => n.date)).toEqual(['2026-10-09', '2026-10-10', '2026-10-11'])
      expect(o.total).toBe(o.nights.reduce((s, n) => s + n.amount, 0))
      for (const n of o.nights) expect(Number.isInteger(n.amount) && n.amount > 0).toBe(true)
    }
  })

  it('non-refundable is cheaper than flexible for the same room', async () => {
    const r = await be.availability(search)
    for (const room of ['CLA', 'SUP']) {
      const bar = r.offers.find((o) => o.roomCode === room && o.ratePlan.code === 'BAR')!
      const nrf = r.offers.find((o) => o.roomCode === room && o.ratePlan.code === 'NRF')!
      expect(nrf.total).toBeLessThan(bar.total)
      expect(bar.ratePlan.cancellable).toBe(true)
      expect(nrf.ratePlan.cancellable).toBe(false)
    }
  })

  it('weekend nights cost more than the same room midweek, all else equal', () => {
    // Base prices include a small deterministic jitter (±8%) and a 20% weekend uplift,
    // so across a month the average Friday/Saturday is clearly above the average Tuesday.
    const avg = (dow: number) => {
      const xs: number[] = []
      for (let d = 1; d <= 28; d++) {
        const date = `2026-11-${String(d).padStart(2, '0')}`
        if (new Date(`${date}T00:00:00Z`).getUTCDay() === dow) xs.push(nightlyBase('HHDOR', 'CLA', date))
      }
      return xs.reduce((s, x) => s + x, 0) / xs.length
    }
    expect(avg(6)).toBeGreaterThan(avg(2) * 1.08)
  })

  it('hides rooms too small for the party', async () => {
    const r = await be.availability({ ...search, adults: 3, children: 1 })
    expect(new Set(r.offers.map((o) => o.roomCode))).toEqual(new Set(['FAM']))
  })

  it('a stay is sold out if any night is sold out', () => {
    // Find a night the mock sells out for CLA, then search across it.
    let soldOut = ''
    for (let i = 0; i < 400 && !soldOut; i++) {
      const d = new Date(Date.UTC(2026, 9, 1) + i * 86_400_000).toISOString().slice(0, 10)
      if (nightlyStock('HHDOR', 'CLA', d) === 0) soldOut = d
    }
    expect(soldOut).not.toBe('')
    const inD = new Date(Date.parse(`${soldOut}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10)
    const outD = new Date(Date.parse(`${soldOut}T00:00:00Z`) + 2 * 86_400_000).toISOString().slice(0, 10)
    return be.availability({ checkIn: inD, checkOut: outD, adults: 2 }).then((r) => {
      const cla = r.offers.filter((o) => o.roomCode === 'CLA')
      expect(cla.every((o) => o.available === 0)).toBe(true)
      // Sold-out offers are listed after bookable ones.
      const firstSoldOut = r.offers.findIndex((o) => o.available === 0)
      expect(r.offers.slice(firstSoldOut).every((o) => o.available === 0)).toBe(true)
    })
  })

  it('applies the DIRECT10 promo code', async () => {
    const plain = await be.availability(search)
    const promo = await be.availability({ ...search, promoCode: 'direct10' })
    const t = (r: typeof plain) => r.offers.find((o) => o.roomCode === 'SUP' && o.ratePlan.code === 'BAR')!.total
    expect(t(promo)).toBeLessThan(t(plain))
  })

  it('rejects invalid searches with a field', async () => {
    const cases: [Partial<typeof search> & Record<string, unknown>, string][] = [
      [{ checkIn: '2026-09-01' }, 'checkIn'],
      [{ checkIn: '2026-10-12', checkOut: '2026-10-12' }, 'dates'],
      [{ checkOut: '2026-12-31' }, 'dates'],
      [{ checkIn: '2026-02-30' }, 'checkIn'],
      [{ checkIn: '9/10/2026' }, 'checkIn'],
      [{ adults: 0 }, 'adults'],
      [{ children: -1 }, 'children'],
    ]
    for (const [patch, field] of cases) {
      const err = await be.availability({ ...search, ...patch } as typeof search).catch((e) => e)
      expect(err, JSON.stringify(patch)).toBeInstanceOf(BookingSearchError)
      expect((err as BookingSearchError).field, JSON.stringify(patch)).toBe(field)
    }
    expect(MAX_NIGHTS).toBe(30)
  })

  it('carries a freshness stamp and says it is a mock', async () => {
    const r = await be.availability(search)
    expect(r.freshAt).toBe('2026-09-23T10:00:00.000Z')
    expect(r.mock).toBe(true)
    expect(r.engine).toBe('clockpms-be-mock')
  })

  it('builds a same-domain booking URL', () => {
    const url = be.bookingUrl('/s/hotel-herse-dor/book', search, { roomCode: 'SUP', ratePlan: { code: 'BAR', name: '', cancellable: true } })
    expect(url.startsWith('/s/hotel-herse-dor/book?')).toBe(true)
    const q = new URLSearchParams(url.split('?')[1])
    expect(Object.fromEntries(q)).toEqual({ checkIn: '2026-10-09', checkOut: '2026-10-12', adults: '2', children: '0', room: 'SUP', rate: 'BAR' })
  })
})

describe('adapter selection and helpers', () => {
  it('returns no adapter when the site has no engine or no property code', () => {
    expect(bookingAdapterFor(null)).toBeNull()
    expect(bookingAdapterFor({ engine: 'none' })).toBeNull()
    expect(bookingAdapterFor({ engine: 'clockpms-be-mock' })).toBeNull()
    expect(bookingAdapterFor({ engine: 'unknown-engine', propertyCode: 'X' })).toBeNull()
    expect(bookingAdapterFor({ engine: 'clockpms-be-mock', propertyCode: 'HHDOR' })?.engine).toBe('clockpms-be-mock')
  })

  it('reads a search from query parameters', () => {
    expect(searchFromParams(new URLSearchParams('checkIn=2026-10-09'))).toBeNull()
    expect(searchFromParams({ checkIn: '2026-10-09', checkOut: '2026-10-10', adults: '3', promo: 'X' })).toEqual({
      checkIn: '2026-10-09',
      checkOut: '2026-10-10',
      adults: 3,
      children: 0,
      promoCode: 'X',
    })
  })

  it('formats minor units as money', () => {
    expect(formatMoney(15900, 'EUR', 'en-GB')).toBe('€159.00')
    expect(MOCK_ROOMS.length).toBe(3)
  })
})
