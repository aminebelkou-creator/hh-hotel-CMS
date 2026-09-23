/**
 * Ingest normaliser, on the real glitches seen on customer zero (docs/08-ingest-spike.md).
 */
import { describe, it, expect } from 'vitest'
import { formatPhone, methodOf, normaliseAddress, normaliseEmail, normaliseFacts, normalisePhone } from '@/ingest/normalise'

describe('ingest normaliser', () => {
  it('normalises French phone numbers to E.164 and back to display form', () => {
    for (const raw of ['+33148878409', '+33 1 48 87 84 09', '+33 (0) 1 48 87 84 09', '01 48 87 84 09', '0033148878409']) {
      expect(normalisePhone(raw), raw).toBe('+33148878409')
    }
    expect(normalisePhone('01 87 44 77 90')).toBe('+33187447790')
    expect(normalisePhone('12')).toBeNull()
    expect(formatPhone('+33187447790')).toBe('+33 1 87 44 77 90')
  })

  it('strips words glued onto email addresses by extraction', () => {
    for (const raw of ['info@hotel-herse-dor.com', 'info@hotel-herse-dor.com.', 'info@hotel-herse-dor.comEmail', 'info@hotel-herse-dor.com.Si', 'info@hotel-herse-dor.comII', 'info@hotel-herse-dor.com.Propri']) {
      expect(normaliseEmail(raw), raw).toBe('info@hotel-herse-dor.com')
    }
    expect(normaliseEmail('not an email')).toBeNull()
  })

  it('unglues addresses', () => {
    expect(normaliseAddress('20 rue saint antoine 75004 ParisPolitique')).toBe('20 rue saint antoine 75004 Paris')
    expect(normaliseAddress('20, rue Saint-Antoine75004 Paris')).toBe('20, rue Saint-Antoine 75004 Paris')
  })

  it('maps crawler methods', () => {
    expect(methodOf('json-ld:Organization')).toBe('structured-data')
    expect(methodOf('meta:og:site_name')).toBe('meta')
    expect(methodOf('html@lang')).toBe('meta')
    expect(methodOf('text:keyword')).toBe('keyword')
    expect(methodOf('heading:room')).toBe('heading')
    expect(methodOf('text:pattern')).toBe('text')
  })

  it('merges sightings of the same value and keeps every one as evidence', () => {
    const facts = normaliseFacts([
      { key: 'contact.phone', value: '+33148878409', source: 'a', method: 'text:pattern', confidence: 0.5 },
      { key: 'contact.phone', value: '+33 (0) 1 48 87 84 09', source: 'b', method: 'text:pattern', confidence: 0.5 },
      { key: 'contact.phone', value: '01 87 44 77 90', source: 'c', method: 'text:pattern', confidence: 0.5 },
      { key: 'address', value: '20 rue Saint Antoine 75004 Paris', source: 'd', confidence: 0.6 },
      { key: 'address', value: '20, rue Saint-Antoine, 75004 Paris', source: 'e', confidence: 0.6 },
      { key: 'policy.checkout', value: '11:00', source: 'f' },
      { key: 'policy.checkout', value: '10:30', source: 'g' },
      { key: 'contact.email', value: 'garbage', source: 'h' },
    ])
    const phones = facts.filter((f) => f.key === 'contact.phone')
    expect(phones.map((p) => p.value).sort()).toEqual(['+33148878409', '+33187447790'])
    const main = phones.find((p) => p.value === '+33148878409')!
    expect(main.occurrences).toBe(2)
    expect(main.evidence.map((e) => e.source)).toEqual(['a', 'b'])
    expect(main.confidence).toBe(0.55)
    const addr = facts.filter((f) => f.key === 'address')
    expect(addr).toHaveLength(1)
    expect(addr[0].value).toBe('20, rue Saint-Antoine, 75004 Paris')
    // Conflicts are kept, not resolved: that is the business's decision.
    expect(facts.filter((f) => f.key === 'policy.checkout')).toHaveLength(2)
    expect(facts.some((f) => f.key === 'contact.email')).toBe(false)
  })
})
