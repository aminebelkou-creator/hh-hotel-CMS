import { Rooms } from './collections/Rooms'
import { hotelBlocks } from './blocks'
import { hotelSnapshot } from './snapshot'

export { Rooms } from './collections/Rooms'
export { hotelBlocks, roomsBlock } from './blocks'
export { hotelSnapshot } from './snapshot'
export { hotelJsonLd, postalAddress } from './jsonld'
export * from './types'

/** What the platform needs to load this pack. */
export const hotelPack = {
  name: 'hotel' as const,
  collections: [Rooms],
  /** Collections the platform must scope by tenant (multi-tenant plugin, RLS, checksums). */
  tenantCollections: ['rooms'] as const,
  blocks: hotelBlocks,
  snapshot: hotelSnapshot,
}
