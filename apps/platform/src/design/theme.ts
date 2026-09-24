import { bestOn, contrast, ensureContrast, isHex, luminance, mix, normalizeHex } from './color'
import { CORNERS, FONT_IDS, templateOf, type Corners, type FontId, type Palette, type TemplateDef } from './templates'

/**
 * Theme resolution (design contract, docs/11-design-contract.md).
 *
 *   template defaults  +  hotel brand (a few owner-friendly choices)  →  resolved tokens
 *
 * Derived colours (button text, accent used as text, secondary text) are computed so that a
 * hotel's brand palette cannot produce text below WCAG AA: the only choice that can fail is a
 * text colour too close to the background, and that is reported instead of published.
 */
export type Brand = {
  accent?: string | null
  background?: string | null
  text?: string | null
  headingFont?: string | null
  bodyFont?: string | null
  corners?: string | null
}

export type ResolvedTheme = {
  template: string
  templateVersion: string
  scheme: 'light' | 'dark'
  colors: Palette & { accentInk: string; accentText: string; focus: string }
  fonts: { heading: FontId; body: FontId }
  corners: Corners
  issues: string[]
}

/** Text pairs checked against WCAG AA (4.5:1 for text, 3:1 for the focus ring). */
export const CONTRAST_PAIRS: { fg: keyof ResolvedTheme['colors']; bg: keyof ResolvedTheme['colors']; min: number; label: string }[] = [
  { fg: 'ink', bg: 'paper', min: 4.5, label: 'text on background' },
  { fg: 'ink', bg: 'surface', min: 4.5, label: 'text on cards' },
  { fg: 'ink', bg: 'tint', min: 4.5, label: 'text on alternate sections' },
  { fg: 'muted', bg: 'paper', min: 4.5, label: 'secondary text on background' },
  { fg: 'muted', bg: 'surface', min: 4.5, label: 'secondary text on cards' },
  { fg: 'muted', bg: 'tint', min: 4.5, label: 'secondary text on alternate sections' },
  { fg: 'accentText', bg: 'paper', min: 4.5, label: 'accent text on background' },
  { fg: 'accentText', bg: 'tint', min: 4.5, label: 'accent text on alternate sections' },
  { fg: 'accentInk', bg: 'accent', min: 4.5, label: 'button text on accent' },
  { fg: 'inverseInk', bg: 'inverse', min: 4.5, label: 'footer text' },
  { fg: 'inverseMuted', bg: 'inverse', min: 4.5, label: 'footer secondary text' },
  { fg: 'focus', bg: 'paper', min: 3, label: 'keyboard focus ring' },
]

const pickFont = (v: unknown, fallback: FontId): FontId => ((FONT_IDS as readonly string[]).includes(String(v)) ? (v as FontId) : fallback)
const pickCorners = (v: unknown, fallback: Corners): Corners => ((CORNERS as readonly string[]).includes(String(v)) ? (v as Corners) : fallback)
const hexOr = (v: unknown, fallback: string) => (isHex(v) ? normalizeHex(v) : fallback)

export function resolveTheme(templateId: unknown, brand?: Brand | null): ResolvedTheme {
  const t: TemplateDef = templateOf(templateId)
  const b = brand ?? {}
  const base = t.palette
  const white = '#ffffff'

  const paper = hexOr(b.background, base.paper)
  const ink = hexOr(b.text, base.ink)
  const custom = paper !== base.paper || ink !== base.ink
  // A new background brings its own surfaces; otherwise keep the template's hand-tuned ones.
  // Cards follow the background's own lightness, not the template's scheme: a hotel may put a
  // dark background on a light template.
  const surface = custom ? (luminance(paper) < 0.2 ? mix(paper, white, 0.06) : mix(paper, white, 0.7)) : base.surface
  const tint = custom ? mix(paper, ink, 0.05) : base.tint
  const line = custom ? mix(paper, ink, 0.14) : base.line
  const muted = ensureContrast(custom ? mix(ink, paper, 0.38) : base.muted, [paper, surface, tint], 4.5, ink)

  const accent = hexOr(b.accent, base.accent)
  // Every colour reaches 4.5:1 against pure white or pure black, so buttons always pass.
  const accentInk = bestOn(accent, [white, '#000000'])
  const accentText = ensureContrast(accent, [paper, tint, surface], 4.5, ink)

  const inverseInk = ensureContrast(base.inverseInk, [base.inverse], 4.5, bestOn(base.inverse, [white, '#000000']))
  const inverseMuted = ensureContrast(base.inverseMuted, [base.inverse], 4.5, inverseInk)
  const focus = ensureContrast(t.scheme === 'dark' ? '#8ab4f8' : '#1a5fb4', [paper], 3, ink)

  const colors = { paper, surface, tint, ink, muted, line, accent, inverse: base.inverse, inverseInk, inverseMuted, accentInk, accentText, focus }
  const issues = CONTRAST_PAIRS.flatMap((pair) => {
    const r = contrast(colors[pair.fg], colors[pair.bg])
    return r + 1e-9 < pair.min ? [`${pair.label}: ${r.toFixed(2)}:1, needs ${pair.min}:1`] : []
  })
  for (const [k, v] of [['accent', b.accent], ['background', b.background], ['text', b.text]] as const) {
    if (v && !isHex(v)) issues.push(`${k}: "${v}" is not a colour like #1a2b3c`)
  }
  return {
    template: t.id,
    templateVersion: t.version,
    scheme: t.scheme,
    colors,
    fonts: { heading: pickFont(b.headingFont, t.fonts.heading), body: pickFont(b.bodyFont, t.fonts.body) },
    corners: pickCorners(b.corners, t.corners),
    issues,
  }
}

const RADII: Record<Corners, { card: string; media: string; button: string }> = {
  square: { card: '2px', media: '0px', button: '2px' },
  soft: { card: '14px', media: '10px', button: '999px' },
  round: { card: '24px', media: '18px', button: '999px' },
}

const FALLBACK: Record<FontId, string> = {
  inter: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  manrope: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  playfair: "Georgia, 'Times New Roman', serif",
  cormorant: "Georgia, 'Times New Roman', serif",
}
export const fontStack = (f: FontId) => `var(--hh-f-${f}), ${FALLBACK[f]}`

/** CSS custom properties for a resolved theme (set on the element carrying data-template). */
export function themeVars(th: ResolvedTheme): Record<string, string> {
  const c = th.colors
  const r = RADII[th.corners]
  return {
    '--hh-paper': c.paper,
    '--hh-card': c.surface,
    '--hh-tint': c.tint,
    '--hh-ink': c.ink,
    '--hh-muted': c.muted,
    '--hh-line': c.line,
    '--hh-accent': c.accent,
    '--hh-accent-ink': c.accentInk,
    '--hh-accent-text': c.accentText,
    '--hh-inverse': c.inverse,
    '--hh-inverse-ink': c.inverseInk,
    '--hh-inverse-muted': c.inverseMuted,
    '--hh-focus': c.focus,
    '--hh-radius': r.card,
    '--hh-radius-media': r.media,
    '--hh-radius-button': r.button,
    '--hh-serif': fontStack(th.fonts.heading),
    '--hh-sans': fontStack(th.fonts.body),
  }
}

/** The theme as W3C design tokens (DTCG), for designers and agents. */
export function toDTCG(th: ResolvedTheme) {
  const color = Object.fromEntries(Object.entries(th.colors).map(([k, v]) => [k, { $type: 'color', $value: v }]))
  return {
    $description: `Resolved theme, template ${th.template} ${th.templateVersion}`,
    color,
    font: {
      heading: { $type: 'fontFamily', $value: th.fonts.heading },
      body: { $type: 'fontFamily', $value: th.fonts.body },
    },
    radius: Object.fromEntries(Object.entries(RADII[th.corners]).map(([k, v]) => [k, { $type: 'dimension', $value: v }])),
  }
}
