import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { authenticated } from '../access'
import { provenance } from './provenance'
import { RESERVED_SLUGS } from './Pages'

/**
 * A post changed by a signed-in person becomes `human` (rule 7): example or suggested posts
 * start `generated`, and nothing the platform writes later may overwrite a person's edit.
 */
const markHumanEdits: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  if (!req.user || req.context?.generation) return data
  const prov = (data.provenance ?? originalDoc?.provenance) as { origin?: string } | undefined
  if (prov?.origin === 'generated' && originalDoc) data.provenance = { ...prov, origin: 'human' }
  return data
}

/**
 * Post: a dated article of the site's blog (news, the neighbourhood, events). Industry-neutral.
 * Shown by the `news` block: the latest few on any page, and every post on the page whose news
 * block lists them all (that page's slug is the blog's address: /<blog>/<post>). Only
 * `published` posts enter a release; changes go live with the next publish.
 */
export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Post', plural: 'Blog posts' },
  admin: {
    useAsTitle: 'title',
    group: 'Website',
    defaultColumns: ['title', 'status', 'publishedAt', 'site'],
    description: 'Blog articles. A post shows on the site once it is Published and the site is published again.',
  },
  defaultSort: '-publishedAt',
  access: { read: authenticated, create: authenticated, update: authenticated, delete: authenticated },
  hooks: { beforeChange: [markHumanEdits] },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'Web address of the post, e.g. place-des-vosges' },
      validate: (v: unknown) =>
        typeof v === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(v) && !RESERVED_SLUGS.includes(v) ? true : 'Lower-case letters, digits and hyphens',
    },
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'publishedAt', type: 'date', required: true, defaultValue: () => new Date().toISOString(), admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly' } } },
    { name: 'excerpt', type: 'textarea', required: true, localized: true, admin: { description: 'One or two sentences shown on the cards and in search results' } },
    {
      name: 'body',
      type: 'textarea',
      required: true,
      localized: true,
      admin: { description: 'Blank lines separate paragraphs; "## " starts a subheading; lines starting with "- " make a list' },
    },
    { name: 'image', type: 'upload', relationTo: 'media', admin: { description: 'Cover photo' } },
    { name: 'imageUrl', type: 'text', admin: { description: 'Or a photo address (used when no cover photo is chosen)' } },
    { name: 'imageAlt', type: 'text', localized: true, admin: { description: 'Alternative text for screen readers' } },
    { ...provenance, admin: { ...(provenance.admin ?? {}), position: 'sidebar' } } as typeof provenance,
  ],
}
