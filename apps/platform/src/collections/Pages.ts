import type { CollectionConfig } from 'payload'
import { authenticated } from '../access'

const provenance = {
  name: 'provenance',
  type: 'group' as const,
  admin: { description: 'Who last shaped this content. Regeneration never overwrites human edits.' },
  fields: [
    {
      name: 'origin',
      type: 'select' as const,
      defaultValue: 'human',
      options: ['generated', 'human', 'locked'],
    },
    { name: 'sourceFact', type: 'text' as const, admin: { description: 'Fact-base reference for generated content' } },
  ],
}

/** Page: a composition of typed blocks, never a canvas. Drafts and versions on. */
export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug', 'site', 'updatedAt'] },
  versions: { drafts: true, maxPerDoc: 25 },
  access: { read: authenticated, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, index: true },
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true },
    {
      name: 'blocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'hero',
          fields: [
            { name: 'heading', type: 'text', required: true, localized: true },
            { name: 'subheading', type: 'text', localized: true },
            { name: 'image', type: 'upload', relationTo: 'media' },
            provenance,
          ],
        },
        {
          slug: 'richText',
          fields: [{ name: 'content', type: 'richText', localized: true }, provenance],
        },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        { name: 'title', type: 'text', localized: true },
        { name: 'description', type: 'textarea', localized: true },
      ],
    },
  ],
}
