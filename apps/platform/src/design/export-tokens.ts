/**
 * Writes each template's resolved tokens as W3C design tokens (DTCG) for designers:
 *   pnpm exec tsx src/design/export-tokens.ts ../../docs/design-tokens
 * One file per template, plus _brand-fields.json describing what a hotel can change.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { resolveTheme, toDTCG, CONTRAST_PAIRS } from './theme'
import { CORNERS, FONT_IDS, FONT_LABELS, TEMPLATE_IDS, TEMPLATES } from './templates'

const out = process.argv[2] || '../../docs/design-tokens'
mkdirSync(out, { recursive: true })
for (const id of TEMPLATE_IDS) {
  const t = TEMPLATES[id]
  const th = resolveTheme(id)
  const doc = {
    ...toDTCG(th),
    $schema: 'https://design-tokens.github.io/community-group/format/',
    $description: `${t.name} ${t.version} (${t.scheme}): ${t.description.en}`,
    template: { $type: 'string', $value: id },
  }
  writeFileSync(join(out, `${id}.tokens.json`), JSON.stringify(doc, null, 2) + '\n')
}
writeFileSync(
  join(out, '_brand-fields.json'),
  JSON.stringify(
    {
      $description: 'What a hotel can change on top of a template (sites.brand). Everything else is derived and checked; see docs/11-design-contract.md.',
      accent: 'hex colour, optional',
      background: 'hex colour, optional',
      text: 'hex colour, optional (must stay readable on the background)',
      headingFont: FONT_IDS.map((f) => `${f}: ${FONT_LABELS[f]}`),
      bodyFont: FONT_IDS.map((f) => `${f}: ${FONT_LABELS[f]}`),
      corners: CORNERS,
      contrastGates: CONTRAST_PAIRS.map((p) => `${p.label}: ${p.fg} on ${p.bg} >= ${p.min}:1`),
    },
    null,
    2,
  ) + '\n',
)
console.log(`wrote ${TEMPLATE_IDS.length} templates to ${out}`)
