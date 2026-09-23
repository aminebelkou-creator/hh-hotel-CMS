/**
 * Normaliser for raw ingest facts: turns the crawler's sightings into one fact per distinct
 * value, with every sighting kept as evidence. Deterministic and offline; the AI pass comes
 * later and plugs in before this step.
 */

export type RawFact = {
  key: string
  value: string
  source?: string
  method?: string
  confidence?: number
  status?: string
}

export type Evidence = { source: string | null; method: string | null; raw: string }

export type NormalFact = {
  key: string
  value: string
  method: FactMethod
  confidence: number
  source: string | null
  occurrences: number
  evidence: Evidence[]
}

export type FactMethod = 'structured-data' | 'meta' | 'link' | 'text' | 'keyword' | 'heading' | 'pms' | 'manual' | 'agent'

export function methodOf(raw?: string): FactMethod {
  const m = (raw ?? '').toLowerCase()
  if (m.startsWith('json-ld')) return 'structured-data'
  if (m.startsWith('meta') || m.startsWith('html@')) return 'meta'
  if (m.startsWith('link')) return 'link'
  if (m.includes('keyword')) return 'keyword'
  if (m.startsWith('heading')) return 'heading'
  if (m === 'manual') return 'manual'
  return 'text'
}

/** Cut text glued onto a value by extraction: "ParisPolitique" -> "Paris". */
const unglue = (s: string) => s.replace(/([a-zà-ÿ])([A-ZÀ-Þ][a-zà-ÿ]).*$/u, '$1')

/** French numbers to E.164 (+33XXXXXXXXX). Other formats are kept as digits with their plus. */
export function normalisePhone(raw: string): string | null {
  let s = raw.replace(/\(0\)/g, '').replace(/[^\d+]/g, '')
  if (s.startsWith('0033')) s = `+${s.slice(2)}`
  if (/^0\d{9}$/.test(s)) s = `+33${s.slice(1)}`
  if (/^\+33\d{9}$/.test(s)) return s
  if (/^\+\d{8,15}$/.test(s)) return s
  return null
}

export function formatPhone(e164: string): string {
  const m = e164.match(/^\+33(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/)
  return m ? `+33 ${m[1]} ${m[2]} ${m[3]} ${m[4]} ${m[5]}` : e164
}

export function normaliseEmail(raw: string): string | null {
  const at = raw.indexOf('@')
  if (at < 1) return null
  const local = raw.slice(0, at).trim()
  // The domain ends where extraction glued the next word on: an uppercase letter.
  let domain = raw.slice(at + 1)
  const cut = domain.search(/[A-Z]/)
  if (cut >= 0) domain = domain.slice(0, cut)
  domain = domain.replace(/[.\s]+$/, '').toLowerCase()
  const email = `${local.toLowerCase()}@${domain}`
  return /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(email) ? email : null
}

export function normaliseAddress(raw: string): string {
  return unglue(raw)
    .replace(/([A-Za-zÀ-ÿ])(\d{5})/gu, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
}
const addressKey = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '')

const clean = (s: string) =>
  s
    .replace(/^\\?"|\\?"$/g, '')
    .replace(/[•·]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/** Returns [dedupe key, display value] or null when the sighting is unusable. */
export function normaliseValue(key: string, raw: string): [string, string] | null {
  const v = clean(raw)
  if (!v) return null
  if (key === 'contact.phone') {
    const p = normalisePhone(v)
    return p ? [p, p] : null
  }
  if (key === 'contact.email') {
    const e = normaliseEmail(v)
    return e ? [e, e] : null
  }
  if (key === 'address') {
    const a = normaliseAddress(v)
    return [addressKey(a), a]
  }
  if (key.startsWith('policy.') && /^\d{1,2}[:h]\d{2}$/.test(v)) {
    const [h, m] = v.split(/[:h]/)
    const t = `${h.padStart(2, '0')}:${m}`
    return [t, t]
  }
  if (key === 'profile.link') return [v.replace(/\/$/, '').toLowerCase(), v]
  return [v.toLowerCase(), v]
}

/** Prefer the most complete spelling: commas and hyphens usually mean the canonical form. */
const betterDisplay = (a: string, b: string) => {
  const score = (s: string) => (s.match(/,/g)?.length ?? 0) * 2 + (s.match(/-/g)?.length ?? 0) + (/[A-Z]/.test(s) ? 1 : 0)
  return score(b) > score(a) ? b : a
}

export function normaliseFacts(raw: RawFact[]): NormalFact[] {
  const out = new Map<string, NormalFact>()
  for (const r of raw) {
    if (!r?.key || typeof r.value !== 'string') continue
    const nv = normaliseValue(r.key, r.value)
    if (!nv) continue
    const [dedupe, display] = nv
    const id = `${r.key}\u0000${dedupe}`
    const ev: Evidence = { source: r.source ?? null, method: r.method ?? null, raw: r.value }
    const confidence = typeof r.confidence === 'number' ? r.confidence : 0.5
    const prev = out.get(id)
    if (!prev) {
      out.set(id, {
        key: r.key,
        value: display,
        method: methodOf(r.method),
        confidence,
        source: r.source ?? null,
        occurrences: 1,
        evidence: [ev],
      })
      continue
    }
    prev.value = r.key === 'address' ? betterDisplay(prev.value, display) : prev.value
    prev.occurrences += 1
    prev.evidence.push(ev)
    if (confidence > prev.confidence) {
      prev.confidence = confidence
      prev.method = methodOf(r.method)
    }
  }
  // More sightings raise confidence a little, never above 0.95: only a person makes it certain.
  return [...out.values()].map((f) => ({
    ...f,
    confidence: Math.min(0.95, Math.round((f.confidence + 0.05 * (f.occurrences - 1)) * 100) / 100),
  }))
}
