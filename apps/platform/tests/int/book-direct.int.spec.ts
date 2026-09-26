/**
 * Booking links (pure): the hotel's own engine opened with the stay, never a booking step of ours.
 * The rendered pages are checked in site-http.int.spec.ts ("book direct").
 */
import { describe, it, expect } from 'vitest'
import { bookingOf, bookingUrl } from '@/site/booking'
import { hoursText } from '@/generate/post-drafts'

const CLOCK = { engine: 'clock-pms' as const, url: 'https://sky-eu1.clock-software.com/spa/pms-wbe/#/hotel/12223' }

describe('bookingUrl', () => {
  it('Clock PMS+: the query lives in the hash; with both dates it submits the search', () => {
    expect(bookingUrl(CLOCK, 'fr')).toBe('https://sky-eu1.clock-software.com/spa/pms-wbe/#/hotel/12223?site_language=fr')
    expect(bookingUrl(CLOCK, 'en', { arrival: '2026-11-12', departure: '2026-11-14', adults: 3 })).toBe(
      'https://sky-eu1.clock-software.com/spa/pms-wbe/#/hotel/12223?submit=true&arrival=2026-11-12&departure=2026-11-14&adults=3&children=0&site_language=en',
    )
  })

  it('ignores a stay that is not one: missing, reversed or malformed dates', () => {
    const plain = 'https://sky-eu1.clock-software.com/spa/pms-wbe/#/hotel/12223?site_language=en'
    expect(bookingUrl(CLOCK, 'en', { arrival: '2026-11-12' })).toBe(plain)
    expect(bookingUrl(CLOCK, 'en', { arrival: '2026-11-14', departure: '2026-11-12' })).toBe(plain)
    expect(bookingUrl(CLOCK, 'en', { arrival: '12/11/2026', departure: '14/11/2026' })).toBe(plain)
  })

  it('any other engine: dates and guests as query parameters, the rest of the URL kept', () => {
    const b = { engine: 'link' as const, url: 'https://book.example.test/hotel?id=7' }
    expect(bookingUrl(b, 'fr')).toBe('https://book.example.test/hotel?id=7')
    expect(bookingUrl(b, 'fr', { arrival: '2026-11-12', departure: '2026-11-13', adults: 2 })).toBe('https://book.example.test/hotel?id=7&arrival=2026-11-12&departure=2026-11-13&adults=2')
  })

  it('accepts only an https address', () => {
    expect(bookingOf({ engine: 'clock-pms', url: CLOCK.url })).toEqual(CLOCK)
    expect(bookingOf({ url: 'http://book.example.test' })).toBeNull()
    expect(bookingOf({ url: 'javascript:alert(1)' })).toBeNull()
    expect(bookingOf({ url: '' })).toBeNull()
    expect(bookingOf(null)).toBeNull()
  })
})

describe('breakfast hours in a blog draft', () => {
  it('reads "07:00-10:30" in each language, keeps anything else as written', () => {
    expect(hoursText('07:00-10:30', 'fr')).toBe('de 7h à 10h30')
    expect(hoursText('07:00-10:30', 'en')).toBe('from 7:00 to 10:30')
    expect(hoursText('7h-10h', 'fr')).toBe('de 7h à 10h')
    expect(hoursText('until noon', 'en')).toBe('until noon')
  })
})
