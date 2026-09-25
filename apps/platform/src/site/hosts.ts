/**
 * Which hostnames are ours (the platform: admin, API, previews, /s/<site>) and which are
 * hotels' own domains. Runs in the proxy and in server components: no database, no Payload.
 *
 * PLATFORM_HOSTS: comma-separated hostnames (with port for local) that are the platform.
 * Unset: localhost, 127.0.0.1 and *.edgeone.dev / *.edgeone.cool (Makers preset URLs).
 */
const DEFAULT_PLATFORM = /^(localhost|127\.0\.0\.1)(:\d+)?$|\.edgeone\.(dev|cool)$/i

export function normalizeHost(raw: string | null | undefined) {
  return (raw ?? '').trim().toLowerCase().replace(/\.$/, '')
}

export function isPlatformHost(host: string) {
  const h = normalizeHost(host)
  if (!h) return true
  const list = (process.env.PLATFORM_HOSTS ?? '')
    .split(',')
    .map((x) => normalizeHost(x))
    .filter(Boolean)
  if (list.length) return list.includes(h) || list.includes(h.replace(/:\d+$/, ''))
  return DEFAULT_PLATFORM.test(h)
}

/** Only well-formed hostnames reach the database lookup. */
export const HOSTNAME_RE = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/

/** Host of the request as the visitor typed it (behind the edge, x-forwarded-host when trusted). */
export function requestHost(get: (name: string) => string | null) {
  const fwd = process.env.TRUST_FORWARDED_HOST === 'true' ? get('x-forwarded-host') : null
  return normalizeHost(fwd || get('host'))
}

/** Paths that exist only on the platform host; on a hotel's domain they answer 404. */
export const PLATFORM_ONLY = /^\/(admin|api|preview|s|my-route)(\/|$)/
