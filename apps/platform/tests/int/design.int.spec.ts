/**
 * Design contract (docs/11-design-contract.md): every template passes the contrast gates with
 * its own tokens, and no brand accent a hotel can pick produces unreadable text.
 * Pure functions: no database or server needed.
 */
import { describe, it, expect } from 'vitest'
import { contrast, mix, toHex } from '@/design/color'
import { CONTRAST_PAIRS, resolveTheme, themeVars, toDTCG } from '@/design/theme'
import { TEMPLATE_IDS, TEMPLATES } from '@/design/templates'
import { upgradeSnapshot } from '@/releases/resolve'

// Deterministic pseudo-random colours (mulberry32), so a failure is reproducible.
function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const randomHex = (r: () => number) => toHex([r() * 255, r() * 255, r() * 255])

describe('design contract', () => {
  it('contrast maths matches WCAG reference values', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 2)
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080')
  })

  it('every template passes all contrast gates with its own tokens', () => {
    for (const id of TEMPLATE_IDS) {
      const th = resolveTheme(id)
      expect(th.template).toBe(id)
      expect(th.issues, id).toEqual([])
      for (const p of CONTRAST_PAIRS) expect(contrast(th.colors[p.fg], th.colors[p.bg]), `${id} ${p.label}`).toBeGreaterThanOrEqual(p.min)
    }
  })

  it('no accent colour a hotel can pick makes text unreadable (600 random accents per template)', () => {
    const r = rng(20260924)
    for (const id of TEMPLATE_IDS) {
      for (let i = 0; i < 600; i++) {
        const accent = randomHex(r)
        const th = resolveTheme(id, { accent })
        expect(th.issues, `${id} accent ${accent}`).toEqual([])
      }
    }
  })

  it('a readable custom background and text colour are accepted, with derived colours still passing', () => {
    const r = rng(7)
    let accepted = 0
    for (let i = 0; i < 400; i++) {
      const background = randomHex(r)
      const text = contrast(background, '#000000') > contrast(background, '#ffffff') ? '#111111' : '#f5f5f5'
      const th = resolveTheme('maison', { background, text, accent: randomHex(r) })
      if (contrast(text, th.colors.paper) >= 4.5 && contrast(text, th.colors.tint) >= 4.5 && contrast(text, th.colors.surface) >= 4.5) {
        expect(th.issues, `bg ${background}`).toEqual([])
        accepted++
      }
    }
    expect(accepted).toBeGreaterThan(300)
  })

  it('an unreadable text/background pair is reported, not silently published', () => {
    const th = resolveTheme('maison', { background: '#777777', text: '#888888' })
    expect(th.issues.some((i) => i.startsWith('text on background'))).toBe(true)
    expect(resolveTheme('atelier', { accent: 'blue' }).issues.some((i) => i.includes('not a colour'))).toBe(true)
  })

  it('unknown templates, fonts and corners fall back to the template defaults', () => {
    const th = resolveTheme('nope', { headingFont: 'comic-sans', corners: 'wobbly' })
    expect(th.template).toBe('maison')
    expect(th.fonts).toEqual(TEMPLATES.maison.fonts)
    expect(th.corners).toBe('soft')
    expect(resolveTheme('atelier', { headingFont: 'playfair' }).fonts.heading).toBe('playfair')
  })

  it('exposes CSS variables and W3C design tokens', () => {
    const th = resolveTheme('soiree')
    const vars = themeVars(th)
    expect(vars['--hh-paper']).toBe(TEMPLATES.soiree.palette.paper)
    expect(vars['--hh-serif']).toContain('--hh-f-playfair')
    const dtcg = toDTCG(th) as { color: Record<string, { $type: string; $value: string }> }
    expect(dtcg.color.accent).toEqual({ $type: 'color', $value: TEMPLATES.soiree.palette.accent })
  })

  it('releases written before templates existed render with the default template', () => {
    const s = upgradeSnapshot({ schema: 2, site: { id: 1, slug: 'x', name: 'X' }, pages: [], facts: [], packs: {} })
    expect(s.site.template).toBe('maison')
    expect(s.site.brand).toBeNull()
  })
})
