import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { loadLiveRelease, loadLiveReleaseByHost } from '@/releases/resolve'
import { formatPhone } from '@/ingest/normalise'
import type { SiteSnapshot } from '@/releases/snapshot'

/** One lookup per request, shared by generateMetadata and the page (platform host, /s/<site>). */
export const liveReleaseFor = cache(async (siteSlug: string) => {
  const payload = await getPayload({ config })
  return loadLiveRelease(payload, siteSlug)
})

/** Same, for a hotel's own domain: links are rooted at / and the release remembers it. */
export const liveReleaseForHost = cache(async (host: string) => {
  const payload = await getPayload({ config })
  const r = await loadLiveReleaseByHost(payload, host)
  if (r.live) r.live.release.snapshot.site.basePath = '' // the snapshot is a per-request copy
  return r
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
