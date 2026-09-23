/**
 * Audit: every `overrideAccess: true` in src/ must be justified in the allowlist.
 * A platform-level bypass that is not enumerated is a potential cross-tenant path.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import allowlist from '@/access/override-access.allowlist.json'

const ROOT = join(process.cwd(), 'src')

const walk = (dir: string, out: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(ts|tsx)$/.test(name)) out.push(p)
  }
  return out
}

describe('overrideAccess audit', () => {
  it('every overrideAccess: true in src/ is allowlisted with a reason', () => {
    const allowed = new Set(allowlist.allowed.map((a) => a.file.replace(/\\/g, '/')))
    const offenders: string[] = []
    for (const file of walk(ROOT)) {
      const text = readFileSync(file, 'utf8')
      if (/overrideAccess:\s*true/.test(text)) {
        const rel = relative(process.cwd(), file).replace(/\\/g, '/')
        if (!allowed.has(rel)) offenders.push(rel)
      }
    }
    expect(offenders).toEqual([])
  })

  it('allowlist entries all carry a reason', () => {
    for (const a of allowlist.allowed) expect(a.reason.length).toBeGreaterThan(10)
  })
})
