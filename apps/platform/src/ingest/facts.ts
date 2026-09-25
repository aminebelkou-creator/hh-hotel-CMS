/**
 * Upsert normalised facts into one tenant's fact base. Shared by the engineer-run import
 * (import-facts.ts) and the in-product ingest (run.ts). Every query names the tenant;
 * decisions already taken by the business are never overwritten by a re-import.
 */
import type { Payload } from 'payload'
import type { NormalFact } from './normalise'

export async function upsertFact(payload: Payload, tenantId: number, siteId: number, f: NormalFact): Promise<'created' | 'updated'> {
  const existing = (
    await payload.find({
      collection: 'facts',
      where: { and: [{ tenant: { equals: tenantId } }, { key: { equals: f.key } }, { value: { equals: f.value } }] },
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0]
  const data = {
    key: f.key,
    value: f.value,
    site: siteId,
    confidence: f.confidence,
    method: f.method,
    source: f.source ?? undefined,
    occurrences: f.occurrences,
    evidence: f.evidence as unknown as Record<string, unknown>[],
  }
  if (existing) {
    // Merge sightings: one entry per (source, method, raw); occurrences follow the evidence, confidence never drops.
    const seen = new Set<string>()
    const evidence = [...(((existing.evidence as { source?: string | null; method?: string | null; raw?: string }[] | null) ?? [])), ...f.evidence].filter((e) => {
      const k = `${e.source ?? ''}\u0000${e.method ?? ''}\u0000${e.raw ?? ''}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    }).slice(0, 40)
    await payload.update({
      collection: 'facts',
      id: existing.id,
      data: {
        ...data,
        occurrences: Math.max(evidence.length, 1),
        confidence: Math.min(0.95, Math.max(existing.confidence ?? 0, f.confidence)),
        method: (existing.confidence ?? 0) >= f.confidence ? existing.method ?? f.method : f.method,
        source: existing.source ?? f.source ?? undefined,
        evidence: evidence as unknown as Record<string, unknown>[],
      },
      overrideAccess: true,
    })
    return 'updated'
  }
  await payload.create({ collection: 'facts', data: { ...data, tenant: tenantId, status: 'unconfirmed' }, overrideAccess: true })
  return 'created'
}
