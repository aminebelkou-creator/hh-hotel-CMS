import type { Payload } from 'payload'
import type { HotelSnapshot, SnapshotRoom } from './types'

/**
 * Adds the tenant's room types to a release snapshot. Called by the platform's release
 * pipeline with an explicit tenant (jobs pattern); every query filters on it.
 */
export async function hotelSnapshot(payload: Payload, tenantId: number): Promise<HotelSnapshot> {
  const res = await payload.find({
    collection: 'rooms' as never,
    where: { tenant: { equals: tenantId } },
    locale: 'all',
    depth: 0,
    pagination: false,
    sort: 'order',
    overrideAccess: true,
  })
  const rooms: SnapshotRoom[] = (res.docs as unknown as Record<string, unknown>[]).map((r) => ({
    id: Number(r.id),
    slug: String(r.slug),
    name: r.name as SnapshotRoom['name'],
    category: (r.category as string) ?? null,
    summary: (r.summary as SnapshotRoom['summary']) ?? null,
    description: (r.description as SnapshotRoom['description']) ?? null,
    sizeSqm: (r.sizeSqm as number) ?? null,
    maxOccupancy: (r.maxOccupancy as number) ?? null,
    bed: (r.bed as SnapshotRoom['bed']) ?? null,
    view: (r.view as SnapshotRoom['view']) ?? null,
    features: ((r.features as { label: SnapshotRoom['features'][number]['label'] }[]) ?? []).map((f) => ({ label: f.label })),
    images: ((r.images as { url: string; alt: SnapshotRoom['images'][number]['alt'] }[]) ?? []).map((i) => ({ url: i.url, alt: i.alt ?? null })),
  }))
  return { rooms }
}
