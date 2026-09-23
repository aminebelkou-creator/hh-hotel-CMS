import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { loadLiveRelease } from './resolve'
import { formatPhone } from '../ingest/normalise'
import type { SiteSnapshot } from './snapshot'

/** One lookup per request, shared by generateMetadata and the page. */
export const liveReleaseFor = cache(async (siteSlug: string) => {
  const payload = await getPayload({ config })
  return loadLiveRelease(payload, siteSlug)
})

export const localeFor = (snapshot: SiteSnapshot, requested?: string | string[]) => {
  const want = Array.isArray(requested) ? requested[0] : requested
  return want && snapshot.site.enabledLocales.includes(want) ? want : snapshot.site.defaultLocale
}

const LABELS = {
  fr: {
    practical: 'Informations pratiques',
    checkIn: 'Arrivée à partir de',
    checkOut: 'Départ avant',
    phone: 'Téléphone',
    email: 'E-mail',
    address: 'Adresse',
    book: 'Réserver',
    search: 'Voir les disponibilités',
    arrival: 'Arrivée',
    departure: 'Départ',
    adults: 'Adultes',
    children: 'Enfants',
    promo: 'Code promo',
    nights: 'nuits',
    total: 'Total du séjour',
    soldOut: 'Complet',
    left: 'restantes',
    select: 'Choisir',
    back: 'Retour au site',
    mock: 'Moteur de réservation de démonstration (clockPMS BE, simulé) : aucun tarif réel, aucune réservation enregistrée.',
    chosen: 'Étape suivante chez le moteur de réservation : coordonnées et paiement. Ceci est une démonstration, aucune réservation n’est créée.',
    release: 'Version',
  },
  en: {
    practical: 'Practical information',
    checkIn: 'Check-in from',
    checkOut: 'Check-out by',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    book: 'Book',
    search: 'Check availability',
    arrival: 'Arrival',
    departure: 'Departure',
    adults: 'Adults',
    children: 'Children',
    promo: 'Promo code',
    nights: 'nights',
    total: 'Total for the stay',
    soldOut: 'Sold out',
    left: 'left',
    select: 'Select',
    back: 'Back to the site',
    mock: 'Demonstration booking engine (clockPMS BE, simulated): no real rates, no reservation is recorded.',
    chosen: 'Next step at the booking engine: guest details and payment. This is a demonstration; no reservation is created.',
    release: 'Release',
  },
} as const
export type Labels = Record<keyof (typeof LABELS)['en'], string>
export const labelsFor = (locale: string): Labels => (locale === 'fr' ? LABELS.fr : LABELS.en)

/** Practical information comes only from confirmed facts in the release. */
export function practicalInfo(snapshot: SiteSnapshot) {
  const all = (key: string) => snapshot.facts.filter((f) => f.key === key).map((f) => f.value)
  return {
    checkIn: all('policy.checkin')[0],
    checkOut: all('policy.checkout')[0],
    phones: all('contact.phone').map(formatPhone),
    email: all('contact.email')[0],
    address: all('address')[0],
  }
}
