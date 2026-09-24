/**
 * The one place the application loads vertical packs. The core collections and the release
 * pipeline stay industry-neutral; they receive a pack's collections, blocks and snapshot
 * contribution from here.
 */
import { hotelPack } from '@hh/pack-hotel'

export const packs = [hotelPack] as const

export const packCollections = packs.flatMap((p) => p.collections)
export const packBlocks = packs.flatMap((p) => p.blocks)
export const packTenantCollections = packs.flatMap((p) => [...p.tenantCollections])
