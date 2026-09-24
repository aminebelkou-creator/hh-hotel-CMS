import { Rooms } from './collections/Rooms'
import { Offers } from './collections/Offers'
import { hotelBlocks } from './blocks'
import { hotelSnapshot } from './snapshot'

export { Rooms } from './collections/Rooms'
export { Offers } from './collections/Offers'
export { hotelBlocks, roomsBlock, offersBlock, policiesBlock } from './blocks'
export { hotelSnapshot } from './snapshot'
export { hotelJsonLd, postalAddress } from './jsonld'
export * from './types'

/** What the platform needs to load this pack. */
export const hotelPack = {
  name: 'hotel' as const,
  collections: [Rooms, Offers],
  /** Collections the platform must scope by tenant (multi-tenant plugin, RLS, checksums). */
  tenantCollections: ['rooms', 'offers'] as const,
  blocks: hotelBlocks,
  snapshot: hotelSnapshot,
}
