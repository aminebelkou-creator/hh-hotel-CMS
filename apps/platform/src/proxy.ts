import { NextResponse, type NextRequest } from 'next/server'
import { HOSTNAME_RE, PLATFORM_ONLY, isPlatformHost, requestHost } from './site/hosts'

/**
 * Serves hotels on their own domains. A request whose host is not the platform's is
 * rewritten to the internal route /h/<host>/<path>, which resolves the domain to a site and
 * renders it at / (no /s/<site> prefix). The admin, the APIs, previews and /s/ exist only on
 * the platform host, so a hotel's domain can never expose them (design: docs/12 §2).
 */
export function proxy(req: NextRequest) {
  const res = route(req)
  // Security headers on every response we control (the admin sets its own where stricter).
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) if (!res.headers.has(k)) res.headers.set(k, v)
  return res
}

function route(req: NextRequest) {
  const host = requestHost((n) => req.headers.get(n))
  const { pathname, search } = req.nextUrl
  if (isPlatformHost(host)) {
    // The internal host route is reachable only through a rewrite, never by URL.
    if (/^\/h(\/|$)/.test(pathname)) return new NextResponse('Not found', { status: 404 })
    const res = NextResponse.next()
    if (/^\/s\//.test(pathname)) res.headers.set('cache-control', PUBLIC_CACHE)
    return res
  }
  // Contact forms post from the hotel's domain; everything else under /api stays on ours.
  const formPost = req.method === 'POST' && pathname === '/api/contact'
  if (formPost) return NextResponse.next()
  if (PLATFORM_ONLY.test(pathname)) return new NextResponse('Not found', { status: 404 })
  if (!HOSTNAME_RE.test(host.replace(/:\d+$/, ''))) return new NextResponse('Not found', { status: 404 })
  const url = req.nextUrl.clone()
  url.pathname = `/h/${host}${pathname === '/' ? '' : pathname}`
  url.search = search
  const res = NextResponse.rewrite(url)
  res.headers.set('cache-control', PUBLIC_CACHE)
  return res
}

/**
 * Published pages are public and change only on publish: the edge may keep them 10 s and
 * serve a stale copy for a minute while it refreshes. So a publish or rollback reaches
 * visitors within about 10 s (instantly at the origin), and repeat views never wait for the
 * origin. Browsers always revalidate (max-age=0).
 */
export const PUBLIC_CACHE = 'public, max-age=0, s-maxage=10, stale-while-revalidate=60'

export const config = {
  // Everything except Next's own assets, the public photo route and the platform's stock media
  // (public/stock, e.g. hero videos), which are host-neutral.
  matcher: ['/((?!_next/|media/|stock/|favicon\\.ico).*)'],
}

/**
 * Baseline headers (docs/12 §4). Public pages embed nothing from third parties, so framing
 * is refused everywhere except the admin's own live preview, which Payload handles itself.
 */
const SECURITY_HEADERS: Record<string, string> = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'SAMEORIGIN',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'cross-origin-opener-policy': 'same-origin-allow-popups',
}
