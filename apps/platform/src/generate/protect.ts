import type { CollectionBeforeChangeHook } from 'payload'

type Prov = { origin?: string | null; sourceFact?: string | null } | null | undefined
type Blk = { id?: string | null; blockType: string; provenance?: Prov } & Record<string, unknown>

const contentOf = (b: Blk) => {
  const { id: _i, provenance: _p, blockName: _n, ...rest } = b as Blk & { blockName?: unknown }
  return JSON.stringify(rest)
}

/**
 * Pages beforeChange: when a signed-in person changes a block that generation wrote, the
 * block becomes `human` so the next generation leaves it alone. System writes (generation,
 * translation) set `req.context.generation` and are not people.
 */
export const protectHumanEdits: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  if (!req.user || req.context?.generation || !Array.isArray(data.blocks)) return data
  const before = new Map<string, Blk>()
  for (const b of ((originalDoc?.blocks as Blk[] | undefined) ?? [])) if (b?.id) before.set(String(b.id), b)
  for (const b of data.blocks as Blk[]) {
    if (!b || b.provenance?.origin !== 'generated') continue
    const prev = b.id ? before.get(String(b.id)) : undefined
    if (!prev || contentOf(prev) !== contentOf(b)) b.provenance = { ...b.provenance, origin: 'human' }
  }
  return data
}
