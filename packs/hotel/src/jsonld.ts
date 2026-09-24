import { pick, type Fact, type HotelSnapshot } from './types'

type SiteInfo = { name: string; url: string; locale: string; defaultLocale: string; image?: string | null; description?: string | null }

/** schema.org wants absolute URLs; platform photos are site-relative (/media/...). */
const abs = (u: string | null | undefined, base: string) => (u ? new URL(u, base).toString() : undefined)

const first = (facts: Fact[], key: string) => facts.find((f) => f.key === key)?.value
const all = (facts: Fact[], key: string) => facts.filter((f) => f.key === key).map((f) => f.value)

/** Parses "20, rue Saint-Antoine, 75004 Paris" into schema.org PostalAddress parts (French format). */
export function postalAddress(address: string | undefined) {
  if (!address) return undefined
  const m = address.match(/^(.*?),?\s*(\d{5})\s+(.+)$/)
  if (!m) return { '@type': 'PostalAddress', streetAddress: address }
  return { '@type': 'PostalAddress', streetAddress: m[1].replace(/,\s*$/, ''), postalCode: m[2], addressLocality: m[3], addressCountry: 'FR' }
}

/** schema.org Hotel from confirmed facts and the room types in the release. */
export function hotelJsonLd(site: SiteInfo, facts: Fact[], hotel: HotelSnapshot | undefined) {
  const l = site.locale
  const d = site.defaultLocale
  const lat = Number(first(facts, 'geo.lat'))
  const lon = Number(first(facts, 'geo.lon'))
  const stars = Number(first(facts, 'hotel.stars'))
  const rooms = Number(first(facts, 'hotel.rooms'))
  const amenities = all(facts, 'amenity')
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: site.name,
    url: site.url,
    description: site.description || undefined,
    image: abs(site.image, site.url),
    telephone: all(facts, 'contact.phone')[0],
    email: first(facts, 'contact.email'),
    address: postalAddress(first(facts, 'address')),
    geo: Number.isFinite(lat) && Number.isFinite(lon) && lat && lon ? { '@type': 'GeoCoordinates', latitude: lat, longitude: lon } : undefined,
    checkinTime: first(facts, 'policy.checkin'),
    checkoutTime: first(facts, 'policy.checkout'),
    numberOfRooms: Number.isFinite(rooms) && rooms > 0 ? rooms : undefined,
    starRating: Number.isFinite(stars) && stars > 0 ? { '@type': 'Rating', ratingValue: stars } : undefined,
    petsAllowed: amenities.includes('pets') ? true : undefined,
    amenityFeature: amenities.length
      ? amenities.map((a) => ({ '@type': 'LocationFeatureSpecification', name: a, value: true }))
      : undefined,
    sameAs: all(facts, 'profile.link').length ? all(facts, 'profile.link') : undefined,
    containsPlace: hotel?.rooms.length
      ? hotel.rooms.map((r) => ({
          '@type': 'HotelRoom',
          name: pick(r.name, l, d),
          description: pick(r.summary, l, d) || undefined,
          occupancy: r.maxOccupancy ? { '@type': 'QuantitativeValue', maxValue: r.maxOccupancy } : undefined,
          floorSize: r.sizeSqm ? { '@type': 'QuantitativeValue', value: r.sizeSqm, unitCode: 'MTK' } : undefined,
          image: abs(r.images[0]?.url, site.url),
        }))
      : undefined,
  }
  return JSON.parse(JSON.stringify(data)) as Record<string, unknown>
}
