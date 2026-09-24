import type { CollectionConfig } from 'payload'
import { authenticated, superAdminFieldOnly } from '../access'
import { publishEndpoint, rollbackEndpoint } from '../releases/endpoints'
import { isHex } from '../design/color'
import { resolveTheme, type Brand } from '../design/theme'
import { CORNERS, DEFAULT_TEMPLATE, FONT_IDS, FONT_LABELS, TEMPLATE_IDS, TEMPLATES } from '../design/templates'

const hexField = (v: unknown) => (v === null || v === undefined || v === '' || isHex(v) ? true : 'Use a colour like #1a2b3c')

/** Background and text colours must stay readable together; everything else is derived. */
const readableField = (v: unknown, { data, siblingData }: { data?: unknown; siblingData?: unknown }) => {
  const hex = hexField(v)
  if (hex !== true) return hex
  const th = resolveTheme((data as { template?: string } | undefined)?.template, siblingData as Brand)
  const bad = th.issues.filter((i) => /^(text|secondary text) on/.test(i))
  return bad.length ? `Text and background are too close to read: ${bad.join('; ')}` : true
}

/** Site: the publishing boundary. Its look (template + brand) is separable from content by design. */
export const Sites: CollectionConfig = {
  slug: 'sites',
  admin: { useAsTitle: 'name' },
  access: { read: authenticated, create: authenticated, update: authenticated, delete: authenticated },
  endpoints: [publishEndpoint, rollbackEndpoint],
  fields: [
    {
      name: 'publishPanel',
      type: 'ui',
      admin: { position: 'sidebar', components: { Field: '/admin/PublishPanel#PublishPanel' } },
    },
    { name: 'name', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Platform-wide unique; the public preview lives at /s/<slug>' },
    },
    {
      name: 'brandName',
      type: 'text',
      admin: { description: 'Public name shown on the site. Backfilled from the tenant name by migration.' },
    },
    {
      name: 'timezone',
      type: 'text',
      defaultValue: 'Europe/Paris',
      admin: { description: 'IANA time zone for offers, events and opening hours.' },
    },
    {
      name: 'enabledLocales',
      type: 'select',
      hasMany: true,
      defaultValue: ['en'],
      options: ['en', 'fr', 'de', 'es', 'it'],
    },
    { name: 'defaultLocale', type: 'select', defaultValue: 'en', options: ['en', 'fr', 'de', 'es', 'it'] },
    {
      name: 'theme',
      type: 'json',
      // Superseded by template + brand (design contract, docs/11). Kept for old rows; not used by the renderer.
      admin: { hidden: true },
    },
    {
      name: 'template',
      type: 'select',
      defaultValue: DEFAULT_TEMPLATE,
      options: TEMPLATE_IDS.map((id) => ({ label: TEMPLATES[id].name, value: id })),
      admin: {
        description: TEMPLATE_IDS.map((id) => `${TEMPLATES[id].name}: ${TEMPLATES[id].description.en}`).join(' · '),
      },
    },
    {
      name: 'brand',
      type: 'group',
      label: 'Brand',
      admin: {
        description:
          'Optional: leave empty to use the template as designed. Colours as #rrggbb. Button text, links and secondary text are adjusted automatically to stay readable (WCAG AA).',
      },
      fields: [
        { type: 'row', fields: [
          { name: 'accent', type: 'text', label: 'Accent colour', validate: hexField, admin: { placeholder: 'template default', width: '33%' } },
          { name: 'background', type: 'text', label: 'Background colour', validate: readableField, admin: { placeholder: 'template default', width: '33%' } },
          { name: 'text', type: 'text', label: 'Text colour', validate: readableField, admin: { placeholder: 'template default', width: '33%' } },
        ] },
        { type: 'row', fields: [
          { name: 'headingFont', type: 'select', options: FONT_IDS.map((f) => ({ label: FONT_LABELS[f], value: f })), admin: { width: '33%', description: 'Empty: the template font' } },
          { name: 'bodyFont', type: 'select', options: FONT_IDS.map((f) => ({ label: FONT_LABELS[f], value: f })), admin: { width: '33%', description: 'Empty: the template font' } },
          { name: 'corners', type: 'select', options: CORNERS.map((c) => ({ label: c, value: c })), admin: { width: '33%', description: 'Empty: the template corners' } },
        ] },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: ['draft', 'live', 'suspended'],
    },
    {
      name: 'tagline',
      type: 'text',
      localized: true,
      admin: { description: 'Short line under the name, used in the header and search results' },
    },
    { name: 'logoUrl', type: 'text', admin: { description: 'Logo image URL (https). Remote until the media pipeline exists' } },
    {
      name: 'cta',
      type: 'group',
      label: 'Header call to action',
      admin: { description: 'The "Book" button in the header. A page slug (e.g. contact), a URL, tel: or mailto:. No booking logic runs on the platform' },
      fields: [
        { name: 'label', type: 'text', localized: true },
        { name: 'href', type: 'text' },
      ],
    },
    {
      name: 'currentRelease',
      type: 'relationship',
      relationTo: 'releases',
      admin: { readOnly: true, position: 'sidebar', description: 'Set by the release pipeline. Rollback moves this pointer.' },
      // A tenant user must never point a site at a release, least of all another tenant's.
      access: { create: superAdminFieldOnly, update: superAdminFieldOnly },
    },
    {
      name: 'publish',
      type: 'group',
      admin: { readOnly: true, description: 'Release pipeline state. Written only by the publish job.' },
      access: { create: superAdminFieldOnly, update: superAdminFieldOnly },
      fields: [
        { name: 'requestSeq', type: 'number', defaultValue: 0, admin: { description: 'Incremented on every publish request; older requests are superseded' } },
        { name: 'lockedUntil', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'lockedBy', type: 'text' },
      ],
    },
  ],
}
