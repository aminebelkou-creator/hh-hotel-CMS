/**
 * Deterministic copy for generated pages, in the site's default locale, built only from
 * confirmed facts (rule 9). When a model is configured, generate.ts asks it for better prose
 * with the same facts; this file is the fallback that always works and the shape it must fill.
 */
export type FactMap = Map<string, string[]>
export type Locale = 'en' | 'fr' | 'de' | 'es' | 'it'

export const first = (f: FactMap, key: string) => f.get(key)?.[0]
export const all = (f: FactMap, key: string) => f.get(key) ?? []

const AMENITY_LABEL: Record<string, Record<'en' | 'fr', string>> = {
  wifi: { en: 'Free Wi-Fi', fr: 'Wi-Fi gratuit' },
  'air-conditioning': { en: 'Air conditioning', fr: 'Climatisation' },
  breakfast: { en: 'Breakfast', fr: 'Petit-déjeuner' },
  elevator: { en: 'Lift', fr: 'Ascenseur' },
  parking: { en: 'Parking', fr: 'Parking' },
  pets: { en: 'Pets welcome', fr: 'Animaux acceptés' },
  '24h-reception': { en: '24-hour reception', fr: 'Réception 24h/24' },
  bar: { en: 'Bar', fr: 'Bar' },
  safe: { en: 'Safe', fr: 'Coffre-fort' },
  'non-smoking': { en: 'Non-smoking', fr: 'Non-fumeur' },
  accessible: { en: 'Accessible rooms', fr: 'Chambres accessibles' },
  'family-rooms': { en: 'Family rooms', fr: 'Chambres familiales' },
}
export const amenityLabel = (key: string, locale: Locale) => AMENITY_LABEL[key]?.[locale === 'fr' ? 'fr' : 'en'] ?? key

/** Everything a page needs, as plain strings; the model fills the same shape. */
export type SiteCopy = {
  home: { heading: string; subheading: string; aboutHeading: string; about: string; featuresHeading: string; cta: string }
  rooms: { heading: string; intro: string }
  services: { heading: string; intro: string; policiesHeading: string }
  contact: { heading: string; intro: string; accessHeading?: string; access?: string }
}

export function defaultCopy(f: FactMap, locale: Locale, hotelName: string): SiteCopy {
  const fr = locale === 'fr'
  const stars = first(f, 'rating.stars')
  const city = (first(f, 'address') ?? '').split(',').map((s) => s.trim()).filter((s) => /^\d{5}\s/.test(s))[0]?.replace(/^\d{5}\s/, '')
  const desc = first(f, 'business.description') ?? first(f, 'site.description')
  const checkin = first(f, 'policy.checkin')
  const checkout = first(f, 'policy.checkout')
  const amenities = all(f, 'amenity').map((a) => amenityLabel(a, locale))
  const transport = first(f, 'access.transport')
  const starsTxt = stars ? (fr ? `Hôtel ${stars} étoiles` : `${stars}-star hotel`) : fr ? 'Hôtel' : 'Hotel'
  return {
    home: {
      heading: hotelName,
      subheading: [starsTxt, city ? (fr ? `à ${city}` : `in ${city}`) : ''].filter(Boolean).join(' '),
      aboutHeading: fr ? 'Bienvenue' : 'Welcome',
      about: desc ?? (fr ? `${hotelName} vous accueille${city ? ` à ${city}` : ''}. Réservez en direct pour le meilleur tarif.` : `${hotelName} welcomes you${city ? ` in ${city}` : ''}. Book direct for the best rate.`),
      featuresHeading: fr ? 'Ce que vous trouverez' : 'What you will find',
      cta: fr ? 'Réserver' : 'Book now',
    },
    rooms: {
      heading: fr ? 'Nos chambres' : 'Our rooms',
      intro: fr ? 'Chaque chambre est décrite à partir des informations confirmées par l’hôtel.' : 'Every room type is described from information the hotel has confirmed.',
    },
    services: {
      heading: fr ? 'Services' : 'Services',
      intro: amenities.length ? (fr ? `À votre disposition : ${amenities.join(', ').toLowerCase()}.` : `At your disposal: ${amenities.join(', ').toLowerCase()}.`) : fr ? 'Les services de l’hôtel.' : 'The hotel’s services.',
      policiesHeading: fr ? 'Bon à savoir' : 'Good to know',
    },
    contact: {
      heading: fr ? 'Contact' : 'Contact',
      intro: fr ? 'Nous répondons à chaque message.' : 'We answer every message.',
      accessHeading: transport ? (fr ? 'Venir à l’hôtel' : 'Getting here') : undefined,
      access: transport,
    },
  }
  void checkin
  void checkout
}

export const PAGE_SLUGS: Record<'home' | 'rooms' | 'services' | 'contact', Record<Locale, string>> = {
  home: { en: 'home', fr: 'home', de: 'home', es: 'home', it: 'home' },
  rooms: { en: 'rooms', fr: 'chambres', de: 'zimmer', es: 'habitaciones', it: 'camere' },
  services: { en: 'services', fr: 'services', de: 'service', es: 'servicios', it: 'servizi' },
  contact: { en: 'contact', fr: 'contact', de: 'kontakt', es: 'contacto', it: 'contatto' },
}

export const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'room'
