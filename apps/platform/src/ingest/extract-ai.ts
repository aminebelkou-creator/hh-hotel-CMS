/**
 * AI pass over crawled page texts: proposes facts the deterministic extractor cannot see
 * (room types with size and occupancy, services, policies, the hotel's own description).
 * Everything it returns is UNCONFIRMED with method `agent`; the hotel confirms on the review
 * screen. Without a model (mock provider) it proposes nothing, and ingest still works.
 */
import { getAi } from '../ai/provider'
import type { CrawledPage } from './crawl'
import type { RawFact } from './normalise'

/** The vocabulary the model may use. Anything else is dropped. */
export const AI_FACT_KEYS = [
  'business.name',
  'business.description',
  'rating.stars',
  'contact.phone',
  'contact.email',
  'address',
  'policy.checkin',
  'policy.checkout',
  'policy.pets',
  'policy.children',
  'policy.cancellation',
  'policy.payment',
  'policy.smoking',
  'breakfast.hours',
  'breakfast.price',
  'room.name',
  'room.description',
  'room.size',
  'room.occupancy',
  'room.bed',
  'room.price-from',
  'service',
  'amenity',
  'nearby',
  'access.transport',
  'parking',
] as const

export const EXTRACT_SYSTEM = `You extract facts about a hotel from the text of its own website.
Return only what the text states; never guess or complete. One fact per line item, short values, in the language of the text.
Allowed keys: ${AI_FACT_KEYS.join(', ')}. For rooms, use "room.<field>" with the room name in "room" so the fields group.
Answer as JSON: {"facts":[{"key":"policy.checkout","value":"11:00","room":null,"quote":"the sentence you took it from"}]}`

export type AiFact = { key: string; value: string; room?: string | null; quote?: string }

export async function proposeFactsWithAi(pages: CrawledPage[], opts: { maxPages?: number } = {}): Promise<{ facts: RawFact[]; used: boolean; model: string; pagesSent: number }> {
  const ai = getAi()
  if (!ai.available) return { facts: [], used: false, model: ai.model, pagesSent: 0 }
  const useful = pages.filter((p) => p.status === 200 && p.words >= 60).slice(0, opts.maxPages ?? 12)
  const facts: RawFact[] = []
  for (const p of useful) {
    let out: unknown
    try {
      out = await ai.complete({ system: EXTRACT_SYSTEM, prompt: `URL: ${p.url}\nTitle: ${p.title}\nHeadings: ${p.headings.join(' | ')}\n\nText:\n${p.text.slice(0, 6000)}`, json: true, maxTokens: 1500 })
    } catch {
      continue
    }
    const list = ((out as { facts?: AiFact[] })?.facts ?? []).filter((f) => f && typeof f.key === 'string' && typeof f.value === 'string')
    for (const f of list) {
      const key = f.key.trim()
      if (!(AI_FACT_KEYS as readonly string[]).includes(key)) continue
      const value = f.room && key.startsWith('room.') && key !== 'room.name' ? `${f.room}: ${f.value}` : f.value
      facts.push({ key, value: value.trim().slice(0, 500), source: p.url, method: 'agent', confidence: 0.6, status: 'unconfirmed' })
    }
  }
  return { facts, used: true, model: ai.model, pagesSent: useful.length }
}
