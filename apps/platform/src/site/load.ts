import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { loadLiveRelease } from '@/releases/resolve'
import { formatPhone } from '@/ingest/normalise'
import type { SiteSnapshot } from '@/releases/snapshot'

/** One lookup per request, shared by generateMetadata and the page. */
export const liveReleaseFor = cache(async (siteSlug: string) => {
  const payload = await getPayload({ config })
  return loadLiveRelease(payload, siteSlug)
})

/** Practical information comes only from confirmed facts in the release. */
export function practicalInfo(snapshot: SiteSnapshot) {
  const all = (key: string) => snapshot.facts.filter((f) => f.key === key).map((f) => f.value)
  return {
    checkIn: all('policy.checkin')[0],
    checkOut: all('policy.checkout')[0],
    phones: all('contact.phone').map(formatPhone),
    email: all('contact.email')[0],
    address: all('address')[0],
    profiles: all('profile.link'),
    lat: Number(all('geo.lat')[0]),
    lon: Number(all('geo.lon')[0]),
  }
}
