import type { Block, CollectionConfig, Field } from 'payload'
import { authenticated } from '../access'

const provenance: Field = {
  name: 'provenance',
  type: 'group',
  admin: { description: 'Who last shaped this content. Regeneration never overwrites human edits.' },
  fields: [
    { name: 'origin', type: 'select', defaultValue: 'human', options: ['generated', 'human', 'locked'] },
    { name: 'sourceFact', type: 'text', admin: { description: 'Fact-base reference for generated content' } },
  ],
}

/** Remote image until the media pipeline exists (plan week 5): a URL plus localized alt text. */
const remoteImage = (name = 'image'): Field[] => [
  { name: `${name}Url`, type: 'text', admin: { description: 'Image URL (https)' } },
  { name: `${name}Alt`, type: 'text', localized: true, admin: { description: 'Alternative text for screen readers' } },
]

const link = (prefix: string): Field[] => [
  { name: `${prefix}Label`, type: 'text', localized: true },
  { name: `${prefix}Href`, type: 'text', admin: { description: 'A page slug (e.g. contact), a full URL, tel: or mailto:' } },
]

/** Generic, industry-neutral blocks. Vertical packs add their own (see src/packs.ts). */
export const coreBlocks: Block[] = [
  {
    slug: 'hero',
    fields: [
      { name: 'heading', type: 'text', required: true, localized: true },
      { name: 'subheading', type: 'text', localized: true },
      { name: 'image', type: 'upload', relationTo: 'media' },
      ...remoteImage(),
      ...link('cta'),
      provenance,
    ],
  },
  { slug: 'richText', fields: [{ name: 'content', type: 'richText', localized: true }, provenance] },
  {
    slug: 'textImage',
    labels: { singular: 'Text and image', plural: 'Text and image' },
    fields: [
      { name: 'eyebrow', type: 'text', localized: true },
      { name: 'heading', type: 'text', localized: true },
      { name: 'body', type: 'textarea', localized: true, admin: { description: 'Blank lines separate paragraphs' } },
      ...remoteImage(),
      { name: 'imagePosition', type: 'select', defaultValue: 'right', options: ['left', 'right'] },
      ...link('link'),
      provenance,
    ],
  },
  {
    slug: 'features',
    labels: { singular: 'Features', plural: 'Features' },
    fields: [
      { name: 'heading', type: 'text', localized: true },
      { name: 'intro', type: 'textarea', localized: true },
      {
        name: 'items',
        type: 'array',
        fields: [
          { name: 'title', type: 'text', required: true, localized: true },
          { name: 'text', type: 'textarea', localized: true },
        ],
      },
      provenance,
    ],
  },
  {
    slug: 'gallery',
    fields: [
      { name: 'heading', type: 'text', localized: true },
      {
        name: 'images',
        type: 'array',
        fields: [
          { name: 'url', type: 'text', required: true },
          { name: 'alt', type: 'text', localized: true },
        ],
      },
    ],
  },
  {
    slug: 'quote',
    fields: [
      { name: 'text', type: 'textarea', required: true, localized: true },
      { name: 'author', type: 'text', localized: true },
    ],
  },
  {
    slug: 'cta',
    labels: { singular: 'Call to action', plural: 'Calls to action' },
    fields: [
      { name: 'heading', type: 'text', localized: true },
      { name: 'text', type: 'textarea', localized: true },
      ...link('button'),
      ...remoteImage(),
    ],
  },
  {
    slug: 'text',
    labels: { singular: 'Text', plural: 'Text' },
    fields: [
      { name: 'heading', type: 'text', localized: true },
      { name: 'body', type: 'textarea', required: true, localized: true, admin: { description: 'Blank lines separate paragraphs; a line starting with "## " is a subheading' } },
      provenance,
    ],
  },
  {
    slug: 'faq',
    labels: { singular: 'Questions and answers', plural: 'Questions and answers' },
    fields: [
      { name: 'heading', type: 'text', localized: true },
      {
        name: 'items',
        type: 'array',
        fields: [
          { name: 'question', type: 'text', required: true, localized: true },
          { name: 'answer', type: 'textarea', required: true, localized: true },
        ],
      },
      provenance,
    ],
  },
  {
    slug: 'contact',
    labels: { singular: 'Contact details', plural: 'Contact details' },
    admin: { disableBlockName: true },
    fields: [
      { name: 'heading', type: 'text', localized: true },
      { name: 'intro', type: 'textarea', localized: true, admin: { description: 'Phones, email, address and times come from confirmed facts' } },
    ],
  },
  {
    slug: 'map',
    fields: [
      { name: 'heading', type: 'text', localized: true },
      { name: 'text', type: 'textarea', localized: true },
      { name: 'zoom', type: 'number', defaultValue: 16, min: 3, max: 19, admin: { description: 'Position comes from the confirmed facts geo.lat and geo.lon' } },
    ],
  },
]

/** Path segments the public site uses itself, plus locale codes (a page cannot be called "en"). */
export const RESERVED_SLUGS = ['sitemap.xml', 'robots.txt', 'preview', 'api', 'admin', 'en', 'fr', 'de', 'es', 'it']

/** Page: a composition of typed blocks, never a canvas. Drafts and versions on. */
export const makePages = (extraBlocks: Block[] = []): CollectionConfig => ({
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'site', 'navOrder', 'updatedAt'],
    // Opens the draft rendered with the site's design (auth checked by the preview route).
    preview: (doc, { locale }) => `/preview/pages/${doc?.id}?locale=${locale ?? ''}`,
  },
  versions: { drafts: true, maxPerDoc: 25 },
  access: { read: authenticated, create: authenticated, update: authenticated, delete: authenticated },
  defaultSort: 'navOrder',
  fields: [
    {
      name: 'publishPanel',
      type: 'ui',
      admin: { position: 'sidebar', components: { Field: '/admin/PublishPanel#PublishPanel' } },
    },
    { name: 'title', type: 'text', required: true, localized: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      index: true,
      admin: { description: '"home" is the start page' },
      validate: (v: unknown) =>
        typeof v === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(v) && !RESERVED_SLUGS.includes(v)
          ? true
          : `Lower-case letters, digits and hyphens; not one of: ${RESERVED_SLUGS.join(', ')}`,
    },
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true },
    {
      type: 'row',
      fields: [
        { name: 'navLabel', type: 'text', localized: true, admin: { description: 'Menu label (defaults to the title)' } },
        { name: 'navOrder', type: 'number', defaultValue: 0 },
        { name: 'showInNav', type: 'checkbox', defaultValue: true },
        { name: 'showInFooter', type: 'checkbox', defaultValue: false, admin: { description: 'Legal and practical pages' } },
      ],
    },
    { name: 'blocks', type: 'blocks', blocks: [...coreBlocks, ...extraBlocks] },
    {
      name: 'seo',
      type: 'group',
      fields: [
        { name: 'title', type: 'text', localized: true },
        { name: 'description', type: 'textarea', localized: true },
      ],
    },
  ],
})

export const Pages = makePages()
