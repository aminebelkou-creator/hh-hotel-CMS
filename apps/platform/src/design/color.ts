/**
 * Colour maths for the design contract: WCAG 2.x contrast, mixing, and nudging a colour
 * until it reaches a contrast target. Pure functions, no dependencies.
 */
export type RGB = [number, number, number]

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i

export function isHex(v: unknown): v is string {
  return typeof v === 'string' && HEX.test(v.trim())
}

export function parseHex(hex: string): RGB {
  const m = hex.trim().match(HEX)
  if (!m) throw new Error(`Not a hex colour: ${hex}`)
  let h = m[1].toLowerCase()
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB
}

export function toHex([r, g, b]: RGB): string {
  return '#' + [r, g, b].map((x) => Math.round(Math.min(255, Math.max(0, x))).toString(16).padStart(2, '0')).join('')
}

export function normalizeHex(hex: string): string {
  return toHex(parseHex(hex))
}

/** WCAG relative luminance. */
export function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio, 1 to 21. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Mix two colours: weight 0 returns a, 1 returns b. */
export function mix(a: string, b: string, weight: number): string {
  const x = parseHex(a)
  const y = parseHex(b)
  return toHex([0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * weight) as RGB)
}

/** The candidate with the best contrast against the background. */
export function bestOn(background: string, candidates: string[]): string {
  return [...candidates].sort((p, q) => contrast(q, background) - contrast(p, background))[0]
}

/**
 * Move `color` towards `toward` in small steps until it reaches `ratio` against every
 * background (or `toward` itself). Keeps the hue family of brand colours while fixing contrast.
 */
export function ensureContrast(color: string, backgrounds: string[], ratio: number, toward: string): string {
  for (let w = 0; w <= 1.0001; w += 0.04) {
    const c = mix(color, toward, Math.min(1, w))
    if (backgrounds.every((bg) => contrast(c, bg) >= ratio)) return c
  }
  return toward
}
