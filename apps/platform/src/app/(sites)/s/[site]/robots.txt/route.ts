import { liveReleaseFor } from '@/site/load'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, ctx: { params: Promise<{ site: string }> }) {
  const { site } = await ctx.params
  const live = await liveReleaseFor(site)
  if (!live) return new Response('Not found', { status: 404 })
  const u = new URL(req.url)
  const host = req.headers.get('x-forwarded-host') || u.host
  const proto = req.headers.get('x-forwarded-proto') || u.protocol.replace(':', '')
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${proto}://${host}/s/${site}/sitemap.xml\n`, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
