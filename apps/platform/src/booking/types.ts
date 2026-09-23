/**
 * Booking-engine adapter boundary (contract: docs/contracts/booking-engine-embed.md).
 *
 * The booking engine owns availability, rates, booking and payment. The platform only
 * hands it the visitor's search and displays what it returns, never a rate it invented
 * (contract rule 3). Amounts are integers in minor units (cents) to avoid float drift.
 */

export type BookingSearch = {
  /** Arrival date, YYYY-MM-DD, in the property's time zone */
  checkIn: string
  /** Departure date, YYYY-MM-DD */
  checkOut: string
  adults: number
  children?: number
  promoCode?: string
}

export type NightlyRate = { date: string; amount: number }

export type RatePlan = { code: string; name: string; cancellable: boolean }

export type RoomOffer = {
  roomCode: string
  roomName: string
  capacity: number
  /** Rooms left at this rate for the whole stay (0 = sold out) */
  available: number
  ratePlan: RatePlan
  nights: NightlyRate[]
  total: number
  currency: string
}

export type AvailabilityResult = {
  engine: string
  propertyCode: string
  currency: string
  search: BookingSearch
  nights: number
  offers: RoomOffer[]
  /** When the engine produced these figures (contract rule 3: freshness stamp) */
  freshAt: string
  mock: boolean
}

export type BookingEngineConfig = {
  engine: string
  propertyCode: string
  currency?: string
}

export interface BookingEngineAdapter {
  readonly engine: string
  availability(search: BookingSearch): Promise<AvailabilityResult>
  /** Same-domain URL of the booking step for one offer (contract rule 1: no third-party redirect) */
  bookingUrl(basePath: string, search: BookingSearch, offer?: Pick<RoomOffer, 'roomCode' | 'ratePlan'>): string
}

export class BookingSearchError extends Error {
  constructor(
    message: string,
    readonly field: keyof BookingSearch | 'dates',
  ) {
    super(message)
    this.name = 'BookingSearchError'
  }
}
