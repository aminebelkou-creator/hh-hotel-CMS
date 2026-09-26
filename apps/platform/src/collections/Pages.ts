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
  { name: `${prefix}Href`, type: 'text', admin: { description: '"book" (the site’s booking engine), a page slug (e.g. contact), a full URL, tel: or mailto:' } },
]

/** Generic, industry-neutral blocks. Vertical packs add their own (see src/packs.ts). */
export const coreBlocks: Block[] = [
  {
    slug: 'hero',
    labels: { singular: 'Big photo at the top (hero)', plural: 'Big photos at the top' },
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
      {
        type: 'row',
        fields: [
          { name: 'videoUrl', type: 'text', admin: { description: 'Optional silent background video (MP4, landscape) over the photo. The photo stays the first image, and the only one with reduced motion or data saver.' } },
          { name: 'videoMobileUrl', type: 'text', admin: { description: 'Optional portrait cut for phones (MP4, 9:16)' } },
        ],
      },
      provenance,
    ],
  },
  { slug: 'richText', labels: { singular: 'Formatted text', plural: 'Formatted text' }, fields: [{ name: 'content', type: 'richText', localized: true }, provenance] },
  {
    slug: 'textImage',
    labels: { singular: 'Text and photo', plural: 'Text and photo' },
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
    labels: { singular: 'List of features (icons)', plural: 'Lists of features' },
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
    labels: { singular: 'Photo banners with titles', plural: 'Photo banners' },
    interfaceName: 'BannersBlock',
    graphQL: { singularName: 'BannersBlock' },
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
    labels: { singular: 'Wide photo', plural: 'Wide photos' },
    interfaceName: 'MediaBandBlock',
    graphQL: { singularName: 'MediaBandBlock' },
    // One full-width photo between sections.
    fields: [
      { name: 'imageUrl', type: 'text', required: true, admin: { description: 'Image URL (https or /media/…)' } },
      { name: 'imageAlt', type: 'text', required: true, localized: true, admin: { description: 'What the photo shows' } },
      provenance,
    ],
  },
  {
    slug: 'gallery',
    labels: { singular: 'Photo gallery', plural: 'Photo galleries' },
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
    labels: { singular: 'Quote', plural: 'Quotes' },
    fields: [
      { name: 'text', type: 'textarea', required: true, localized: true },
      { name: 'author', type: 'text', localized: true },
    ],
  },
  {
    slug: 'cta',
    labels: { singular: 'Book band (call to action)', plural: 'Book bands' },
    fields: [
      {
        name: 'variant',
        type: 'select',
        defaultValue: 'band',
        options: [
          { label: 'Band (large, optional photo)', value: 'band' },
          { label: 'Strip (slim line of reasons to book direct, under the hero)', value: 'strip' },
        ],
      },
      { name: 'heading', type: 'text', localized: true },
      { name: 'text', type: 'textarea', localized: true },
      {
        name: 'points',
        type: 'array',
        admin: { description: 'Short reasons to book direct, each one true for this hotel (no rate or perk the hotel does not give)' },
        fields: [{ name: 'text', type: 'text', required: true, localized: true }],
      },
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
    // Blog posts (collection `posts`): the latest few as cards, or every post on the blog page.
    slug: 'news',
    labels: { singular: 'Latest blog posts', plural: 'Blog posts' },
    interfaceName: 'NewsBlock',
    graphQL: { singularName: 'NewsBlock' },
    fields: [
      { name: 'heading', type: 'text', localized: true },
      { name: 'intro', type: 'textarea', localized: true },
      {
        name: 'layout',
        type: 'select',
        defaultValue: 'latest',
        options: [
          { label: 'The latest posts (cards)', value: 'latest' },
          { label: 'Every post: this page is the blog, posts live under its address', value: 'list' },
        ],
      },
      { name: 'limit', type: 'number', defaultValue: 3, min: 1, max: 12, admin: { condition: (_, s) => s?.layout !== 'list' } },
      ...link('link'),
      provenance,
    ],
  },
  {
    // Guest reviews (collection `reviews`): real words typed in by the hotel, never written by us.
    slug: 'reviews',
    labels: { singular: 'Guest reviews', plural: 'Guest reviews' },
    interfaceName: 'ReviewsBlock',
    graphQL: { singularName: 'ReviewsBlock' },
    fields: [
      { name: 'heading', type: 'text', localized: true },
      { name: 'intro', type: 'textarea', localized: true },
      { name: 'limit', type: 'number', defaultValue: 6, min: 1, max: 24 },
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
    labels: { singular: 'Contact form', plural: 'Contact forms' },
    // The GraphQL type would otherwise collide with the forms collection's `Form`.
    interfaceName: 'FormBlock',
    graphQL: { singularName: 'FormBlock' },
    fields: [
      { name: 'heading', type: 'text', localized: true },
      { name: 'intro', type: 'textarea', localized: true },
      { name: 'form', type: 'relationship', relationTo: 'forms', required: true, admin: { description: 'Built under Website → Forms' } },
    ],
  },
  {
    slug: 'contact',
    labels: { singular: 'Contact details (phone, email, address)', plural: 'Contact details' },
    admin: { disableBlockName: true },
    fields: [
      { name: 'heading', type: 'text', localized: true },
      { name: 'intro', type: 'textarea', localized: true, admin: { description: 'Phones, email, address and times come from confirmed facts' } },
      provenance,
    ],
  },
  {
    slug: 'map',
    labels: { singular: 'Map', plural: 'Maps' },
    fields: [
      { name: 'heading', type: 'text', localized: true },
      { name: 'text', type: 'textarea', localized: true },
      { name: 'zoom', type: 'number', defaultValue: 16, min: 3, max: 19, admin: { description: 'Position comes from the confirmed facts geo.lat and geo.lon' } },
      provenance,
    ],
  },
]

/** Path segments the public site uses itself, plus locale codes (a page cannot be called "en"). */
export const RESERVED_SLUGS = ['sitemap.xml', 'robots.txt', 'preview', 'api', 'admin', 'book', 'en', 'fr', 'de', 'es', 'it']

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
    { name: 'pageHelp', type: 'ui', admin: { components: { Field: '/admin/Help#PageHelp' } } },
    { name: 'title', type: 'text', required: true, localized: true, admin: { description: 'The page’s name in the browser tab and search results (unless a search title is set below).' } },
    {
      name: 'slug',
      type: 'text',
      required: true,
      index: true,
      label: 'Short name (address)',
      admin: { description: 'The end of the page’s address, e.g. “chambres” for /chambres. “home” is the start page. Lower-case, no spaces.' },
      validate: (v: unknown) =>
        typeof v === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(v) && !RESERVED_SLUGS.includes(v)
          ? true
          : `Lower-case letters, digits and hyphens; not one of: ${RESERVED_SLUGS.join(', ')}`,
    },
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true, admin: { description: 'The website this page belongs to' } },
    {
      type: 'row',
      fields: [
        { name: 'navLabel', type: 'text', localized: true, label: 'Menu label', admin: { description: 'Short word in the menu (defaults to the title)' } },
        { name: 'navOrder', type: 'number', defaultValue: 0, label: 'Position in the menu', admin: { description: 'Smaller numbers come first' } },
        { name: 'showInNav', type: 'checkbox', defaultValue: true, label: 'Show in the menu' },
        { name: 'showInFooter', type: 'checkbox', defaultValue: false, label: 'Show in the footer', admin: { description: 'For legal and practical pages' } },
      ],
    },
    {
      name: 'navCondition',
      type: 'select',
      defaultValue: 'always',
      options: [
        { label: 'Always', value: 'always' },
        { label: 'Only while at least one offer is running', value: 'offers' },
      ],
      admin: { description: 'When the page shows in the menu and footer (e.g. an Offers page)', condition: (_, s) => Boolean(s?.showInNav || s?.showInFooter) },
    },
    { name: 'blocks', type: 'blocks', blocks: [...coreBlocks, ...extraBlocks] },
    // Page metadata (title, description, image) is the SEO plugin's `meta` group (payload.config.ts).
  ],
})

export const Pages = makePages()
