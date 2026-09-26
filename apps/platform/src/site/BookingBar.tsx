'use client'
import React, { useEffect, useState } from 'react'
import { bookingUrl, type Booking } from './booking'

type Props = {
  id: string
  /** The engine; null sends the dates to `action` (e.g. the contact page) as query parameters. */
  booking: Booking | null
  /** Where the form goes without JavaScript: the engine's start page, or the fallback page. */
  action: string
  locale: string
  labels: { checkAvailability: string; arrival: string; departure: string; guests: string; guestsN: string; book: string }
}

const day = (d: Date) => d.toISOString().slice(0, 10)
const plusDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return day(d)
}

/**
 * The hero's arrival / departure / guests fields. They open the hotel's own booking engine with
 * those dates (the platform shows no availability or prices). Works without JavaScript: the form
 * then opens the engine's start page.
 */
export function BookingBar({ id, booking, action, locale, labels }: Props) {
  const [today, setToday] = useState<string | undefined>(undefined)
  const [arrival, setArrival] = useState('')
  const [departure, setDeparture] = useState('')
  // The visitor's own "today", known only in the browser.
  useEffect(() => setToday(day(new Date())), [])

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!booking) return // plain GET to the fallback page with the dates
    e.preventDefault()
    const adults = Number(new FormData(e.currentTarget).get('guests')) || 2
    window.location.assign(bookingUrl(booking, locale, { arrival, departure, adults }))
  }

  return (
    <form className="hh-booking-bar" action={action} method="get" aria-label={labels.checkAvailability} onSubmit={onSubmit}>
      <p className="hh-booking-field">
        <label htmlFor={`${id}-in`}>{labels.arrival}</label>
        <input
          id={`${id}-in`}
          name="arrival"
          type="date"
          min={today}
          value={arrival}
          onChange={(e) => {
            const v = e.target.value
            setArrival(v)
            if (v && (!departure || departure <= v)) setDeparture(plusDays(v, 1))
          }}
        />
      </p>
      <p className="hh-booking-field">
        <label htmlFor={`${id}-out`}>{labels.departure}</label>
        <input id={`${id}-out`} name="departure" type="date" min={arrival ? plusDays(arrival, 1) : today} value={departure} onChange={(e) => setDeparture(e.target.value)} />
      </p>
      <p className="hh-booking-field">
        <label htmlFor={`${id}-n`}>{labels.guests}</label>
        <select id={`${id}-n`} name="guests" defaultValue="2">
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {labels.guestsN.replace('{n}', String(n)).replace('(s)', n > 1 ? 's' : '')}
            </option>
          ))}
        </select>
      </p>
      <button type="submit">{labels.book}</button>
    </form>
  )
}
