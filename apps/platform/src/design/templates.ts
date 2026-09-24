/**
 * Site templates (design contract, docs/11-design-contract.md). A template is a set of
 * default tokens plus layout rules in site.css scoped by [data-template]. Templates never use
 * fixed colours or fonts in CSS: only the tokens resolved in theme.ts.
 *
 * Adding a template: add its definition here, its layout rules in site.css, and run the
 * design tests (every template must pass the contrast gates with its own defaults).
 */
export const FONT_IDS = ['inter', 'manrope', 'playfair', 'cormorant'] as const
export type FontId = (typeof FONT_IDS)[number]

export const FONT_LABELS: Record<FontId, string> = {
  inter: 'Inter (sans serif, neutral)',
  manrope: 'Manrope (sans serif, geometric)',
  playfair: 'Playfair Display (serif, high contrast)',
  cormorant: 'Cormorant Garamond (serif, classic)',
}

export const CORNERS = ['square', 'soft', 'round'] as const
export type Corners = (typeof CORNERS)[number]

export type Palette = {
  paper: string // page background
  surface: string // cards
  tint: string // alternate sections
  ink: string // body text
  muted: string // secondary text
  line: string // borders
  accent: string // brand colour: buttons, links, highlights
  inverse: string // footer and call-to-action band
  inverseInk: string
  inverseMuted: string
}

export type TemplateDef = {
  id: string
  version: string
  name: string
  description: { en: string; fr: string }
  scheme: 'light' | 'dark'
  palette: Palette
  fonts: { heading: FontId; body: FontId }
  corners: Corners
}

export const TEMPLATES = {
  maison: {
    id: 'maison',
    version: '1.0.0',
    name: 'Maison',
    description: {
      en: 'Classic and warm: serif headings, cream background, full-width photos. Suits heritage and boutique hotels.',
      fr: 'Classique et chaleureux : titres à empattements, fond crème, photos pleine largeur. Pour les hôtels de charme et de caractère.',
    },
    scheme: 'light',
    palette: {
      paper: '#fbf8f3',
      surface: '#ffffff',
      tint: '#f3ede4',
      ink: '#1f1b16',
      muted: '#6d655b',
      line: '#e5dccf',
      accent: '#8a5a2b',
      inverse: '#1b1814',
      inverseInk: '#f4efe7',
      inverseMuted: '#b8ad9f',
    },
    fonts: { heading: 'cormorant', body: 'inter' },
    corners: 'soft',
  },
  atelier: {
    id: 'atelier',
    version: '1.0.0',
    name: 'Atelier',
    description: {
      en: 'Modern and minimal: sans-serif type, white space, square corners, photo beside the headline. Suits design and city hotels.',
      fr: 'Moderne et épuré : typographie sans empattements, beaucoup de blanc, angles droits, photo à côté du titre. Pour les hôtels urbains et design.',
    },
    scheme: 'light',
    palette: {
      paper: '#ffffff',
      surface: '#ffffff',
      tint: '#f3f3f0',
      ink: '#141414',
      muted: '#5a5a57',
      line: '#e2e2de',
      accent: '#1f4d3a',
      inverse: '#f3f3f0',
      inverseInk: '#141414',
      inverseMuted: '#5a5a57',
    },
    fonts: { heading: 'manrope', body: 'inter' },
    corners: 'square',
  },
  soiree: {
    id: 'soiree',
    version: '1.0.0',
    name: 'Soirée',
    description: {
      en: 'Dark and elegant: night palette, gold accent, centred headlines. Suits luxury and evening-led hotels.',
      fr: 'Sombre et élégant : palette de nuit, accent doré, titres centrés. Pour les hôtels de luxe et les adresses du soir.',
    },
    scheme: 'dark',
    palette: {
      paper: '#15171d',
      surface: '#1d2028',
      tint: '#1a1c23',
      ink: '#f2ede4',
      muted: '#b3ab9e',
      line: '#30333d',
      accent: '#c9a45c',
      inverse: '#0d0e12',
      inverseInk: '#efe9de',
      inverseMuted: '#a49c8f',
    },
    fonts: { heading: 'playfair', body: 'inter' },
    corners: 'soft',
  },
} as const satisfies Record<string, TemplateDef>

export type TemplateId = keyof typeof TEMPLATES
export const TEMPLATE_IDS = Object.keys(TEMPLATES) as TemplateId[]
export const DEFAULT_TEMPLATE: TemplateId = 'maison'

export function templateOf(id: unknown): TemplateDef {
  return (TEMPLATES as Record<string, TemplateDef>)[String(id)] ?? TEMPLATES[DEFAULT_TEMPLATE]
}
