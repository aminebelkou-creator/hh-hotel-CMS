import { liveReleaseFor } from '@/site/load'
import { pageHref } from '@/site/routing'

export const dynamic = 'force-dynamic'

/** Sitemap of the live release: every page in every enabled locale, with hreflang alternates. */
export async function GET(req: Request, ctx: { params: Promise<{ site: string }> }) {
  const { site } = await ctx.params
  const live = await liveReleaseFor(site)
  if (!live) return new Response('Not found', { status: 404 })
  const s = live.release.snapshot
  const base = new URL(req.url)
  const host = req.headers.get('x-forwarded-host') || base.host
  const proto = req.headers.get('x-forwarded-proto') || base.protocol.replace(':', '')
  const abs = (path: string) => `${proto}://${host}${path}`
  const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const urls = s.pages.flatMap((p) =>
    s.site.enabledLocales.map((l) => {
      const alts = s.site.enabledLocales
        .map((a) => `<xhtml:link rel="alternate" hreflang="${a}" href="${esc(abs(pageHref(s, a, p.slug)))}"/>`)
        .join('')
      return `<url><loc>${esc(abs(pageHref(s, l, p.slug)))}</loc>${alts}</url>`
    }),
  )
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('')}</urlset>`
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
}
