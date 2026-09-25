import type { Block, CollectionConfig, Field } from 'payload'
import { authenticated } from '../access'

import { provenance } from './provenance'
import { protectHumanEdits } from '../generate/protect'
import { ICON_IDS } from '../site/icons'

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
      {
        name: 'rating',
        type: 'select',
        defaultValue: 'none',
        options: [
          { label: 'None', value: 'none' },
          { label: 'Official classification (from the confirmed facts)', value: 'classification' },
        ],
        admin: { description: 'Stars above the headline. Read from the fact base, never typed here.' },
      },
      {
        name: 'bookingBar',
        type: 'checkbox',
        defaultValue: false,
        admin: { description: 'Arrival, departure and guests fields that open the site’s Book link with those dates. No availability or prices: the platform runs no booking logic.' },
      },
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
      {
        name: 'points',
        type: 'array',
        admin: { description: 'Optional checklist under the text' },
        fields: [{ name: 'text', type: 'text', required: true, localized: true }],
      },
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
          { name: 'icon', type: 'select', options: ICON_IDS.map((i) => ({ label: i, value: i })), admin: { description: 'Optional line icon (built-in set)' } },
          { name: 'title', type: 'text', required: true, localized: true },
          { name: 'text', type: 'textarea', localized: true },
        ],
      },
      provenance,
    ],
  },
  {
    slug: 'banners',
    interfaceName: 'BannersBlock',
    graphQL: { singularName: 'BannersBlock' },
    labels: { singular: 'Banners', plural: 'Banners' },
    // Full-width photo strips with a title (spaces, rooms, moments); the title shows on hover and always on phones.
    fields: [
      { name: 'eyebrow', type: 'text', localized: true },
      { name: 'heading', type: 'text', localized: true },
      {
        name: 'items',
        type: 'array',
        fields: [
          { name: 'imageUrl', type: 'text', required: true, admin: { description: 'Image URL (https or /media/…)' } },
          { name: 'imageAlt', type: 'text', localized: true },
          { name: 'title', type: 'text', required: true, localized: true },
          { name: 'href', type: 'text', admin: { description: 'A page slug, a URL, tel: or mailto: (optional)' } },
        ],
      },
      provenance,
    ],
  },
  {
    slug: 'mediaBand',
    interfaceName: 'MediaBandBlock',
    graphQL: { singularName: 'MediaBandBlock' },
    labels: { singular: 'Photo band', plural: 'Photo bands' },
    // One full-width photo between sections.
    fields: [
      { name: 'imageUrl', type: 'text', required: true, admin: { description: 'Image URL (https or /media/…)' } },
      { name: 'imageAlt', type: 'text', required: true, localized: true, admin: { description: 'What the photo shows' } },
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
      provenance,
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
    slug: 'form',
    // The GraphQL type would otherwise collide with the forms collection's `Form`.
    interfaceName: 'FormBlock',
    graphQL: { singularName: 'FormBlock' },
    labels: { singular: 'Form', plural: 'Forms' },
    fields: [
      { name: 'heading', type: 'text', localized: true },
      { name: 'intro', type: 'textarea', localized: true },
      { name: 'form', type: 'relationship', relationTo: 'forms', required: true, admin: { description: 'Built under Website → Forms' } },
    ],
  },
  {
    slug: 'contact',
    labels: { singular: 'Contact details', plural: 'Contact details' },
    admin: { disableBlockName: true },
    fields: [
      { name: 'heading', type: 'text', localized: true },
      { name: 'intro', type: 'textarea', localized: true, admin: { description: 'Phones, email, address and times come from confirmed facts' } },
      provenance,
    ],
  },
  {
    slug: 'map',
    fields: [
      { name: 'heading', type: 'text', localized: true },
      { name: 'text', type: 'textarea', localized: true },
      { name: 'zoom', type: 'number', defaultValue: 16, min: 3, max: 19, admin: { description: 'Position comes from the confirmed facts geo.lat and geo.lon' } },
      provenance,
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
  // Rule 7: a person's edit to a generated block marks it human; regeneration then leaves it alone.
  hooks: { beforeChange: [protectHumanEdits] },
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
    // Page metadata (title, description, image) is the SEO plugin's `meta` group (payload.config.ts).
  ],
})

export const Pages = makePages()
