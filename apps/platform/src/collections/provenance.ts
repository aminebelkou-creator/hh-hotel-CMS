import type { Field } from 'payload'

/**
 * Every generated block carries who last shaped it (rule 7). `generated` blocks may be
 * rewritten by the next generation; `human` and `locked` blocks never are. `sourceFact`
 * names the generation slot (gen:<page>:<block>) or the fact a block was written from.
 */
export const provenance: Field = {
  name: 'provenance',
  type: 'group',
  admin: { description: 'Who last shaped this content. Regeneration never overwrites human edits.' },
  fields: [
    { name: 'origin', type: 'select', defaultValue: 'human', options: ['generated', 'human', 'locked'] },
    { name: 'sourceFact', type: 'text', admin: { description: 'Fact-base reference for generated content' } },
  ],
}
