import { bookingAdapterFor, BookingSearchError, searchFromParams } from '@/booking'
import { liveReleaseFor } from '@/releases/render-data'

export const dynamic = 'force-dynamic'

/**
 * GET /s/<site>/book/availability?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD&adults=2
 * JSON from the site's booking engine, on the hotel's own domain. Rates are never cached
 * by the edge (contract rule 3: freshness).
 */
export async function GET(req: Request, ctx: { params: Promise<{ site: string }> }) {
  const { site } = await ctx.params
  const live = await liveReleaseFor(site)
  const adapter = live ? bookingAdapterFor(live.release.snapshot.site.booking) : null
  if (!adapter) return Response.json({ error: 'No booking engine for this site' }, { status: 404 })
  const search = searchFromParams(new URL(req.url).searchParams)
  if (!search) return Response.json({ error: 'checkIn and checkOut are required', field: 'dates' }, { status: 400 })
  try {
    const result = await adapter.availability(search)
    return Response.json(result, { headers: { 'cache-control': 'no-store' } })
  } catch (e) {
    if (e instanceof BookingSearchError) return Response.json({ error: e.message, field: e.field }, { status: 400 })
    throw e
  }
}
