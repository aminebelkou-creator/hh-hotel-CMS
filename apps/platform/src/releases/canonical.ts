import { createHash } from 'node:crypto'

/**
 * Canonical JSON: object keys sorted at every depth, no whitespace. Postgres jsonb reorders
 * keys, so a checksum over plain JSON.stringify would not survive a round trip; this does.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value ?? null)
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(',')}}`
}

export const checksumOf = (value: unknown): string =>
  createHash('sha256').update(canonicalJson(value)).digest('hex')
