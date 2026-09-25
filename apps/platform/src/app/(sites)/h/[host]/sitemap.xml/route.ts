import { liveReleaseForHost } from '@/site/load'
import { originFrom, sitemapXml } from '@/site/render'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, ctx: { params: Promise<{ host: string }> }) {
  const { host } = await ctx.params
  const { live } = await liveReleaseForHost(decodeURIComponent(host))
  if (!live) return new Response('Not found', { status: 404 })
  return new Response(sitemapXml(live, originFrom((n) => req.headers.get(n))), { headers: { 'content-type': 'application/xml; charset=utf-8' } })
}
