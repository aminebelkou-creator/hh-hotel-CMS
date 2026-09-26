import type { CollectionConfig } from 'payload'
import { authenticated, superAdminFieldOnly } from '../access'
import { publishEndpoint, rollbackEndpoint } from '../releases/endpoints'
import { ingestEndpoint } from '../ingest/endpoints'
import { generateEndpoint, suggestPostEndpoint, translateEndpoint } from '../generate/endpoints'
import { applyBrandEndpoint, proposeBrandEndpoint } from '../design/brand-endpoints'
import { checkSiteEndpoint, reportEndpoint, sendReportEndpoint } from '../health/endpoints'
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
  endpoints: [publishEndpoint, rollbackEndpoint, ingestEndpoint, generateEndpoint, translateEndpoint, suggestPostEndpoint, proposeBrandEndpoint, applyBrandEndpoint, checkSiteEndpoint, reportEndpoint, sendReportEndpoint],
  fields: [
    {
      name: 'publishPanel',
      type: 'ui',
      admin: { position: 'sidebar', components: { Field: '/admin/PublishPanel#PublishPanel' } },
    },
    {
      name: 'ingestPanel',
      type: 'ui',
      admin: { position: 'sidebar', components: { Field: '/admin/IngestPanel#IngestPanel' } },
    },
    {
      name: 'brandPanel',
      type: 'ui',
      admin: { position: 'sidebar', components: { Field: '/admin/BrandPanel#BrandPanel' } },
    },
    {
      name: 'blogDraftPanel',
      type: 'ui',
      admin: { position: 'sidebar', components: { Field: '/admin/BlogDraftPanel#BlogDraftPanel' } },
    },
    // A suggested look (template + accent) waiting for approval; written by src/design/propose-brand.ts.
    { name: 'brandProposal', type: 'json', admin: { hidden: true } },
    {
      name: 'siteHelp',
      type: 'ui',
      admin: { components: { Field: '/admin/Help#SiteHelp' } },
    },
    {
      name: 'theme',
      type: 'json',
      // Superseded by template + brand (design contract, docs/11). Kept for old rows; not used by the renderer.
      admin: { hidden: true },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hotel',
          description: 'Your hotel’s name and the languages of the website.',
          fields: [
            { name: 'name', type: 'text', required: true, label: 'Hotel name', admin: { description: 'How your hotel appears in this admin and in reports.' } },
            {
              name: 'brandName',
              type: 'text',
              label: 'Name on the website',
              admin: { description: 'Shown in the header, the browser tab and search results. Leave empty to use the hotel name.' },
            },
            {
              name: 'tagline',
              type: 'text',
              localized: true,
              label: 'Tagline',
              admin: { description: 'A short line under the name, e.g. “3-star hotel · Le Marais, Paris”. One per language: switch the language at the top right.' },
            },
            { name: 'logoUrl', type: 'text', label: 'Logo address', admin: { description: 'Optional: the address (https://…) of your logo image. Without it, the name is written in the template’s font.' } },
            {
              type: 'row',
              fields: [
                {
                  name: 'enabledLocales',
                  type: 'select',
                  hasMany: true,
                  defaultValue: ['en'],
                  label: 'Languages of the website',
                  options: [
                    { label: 'English', value: 'en' },
                    { label: 'Français', value: 'fr' },
                    { label: 'Deutsch', value: 'de' },
                    { label: 'Español', value: 'es' },
                    { label: 'Italiano', value: 'it' },
                  ],
                  admin: { width: '50%', description: 'Guests switch language from the header. Each page is written once per language.' },
                },
                {
                  name: 'defaultLocale',
                  type: 'select',
                  defaultValue: 'en',
                  label: 'Main language',
                  options: [
                    { label: 'English', value: 'en' },
                    { label: 'Français', value: 'fr' },
                    { label: 'Deutsch', value: 'de' },
                    { label: 'Español', value: 'es' },
                    { label: 'Italiano', value: 'it' },
                  ],
                  admin: { width: '50%', description: 'The language of your main address; the others get /en, /de… in front.' },
                },
              ],
            },
            {
              name: 'timezone',
              type: 'text',
              defaultValue: 'Europe/Paris',
              label: 'Time zone',
              admin: { description: 'Used to start and end offers at the right time (e.g. Europe/Paris).' },
            },
          ],
        },
        {
          label: 'Look',
          description: 'The design of your website. Changing it never changes your texts or photos; publish to see it online.',
          fields: [
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
                  { name: 'headingFont', type: 'select', label: 'Heading font', options: FONT_IDS.map((f) => ({ label: FONT_LABELS[f], value: f })), admin: { width: '33%', description: 'Empty: the template font' } },
                  { name: 'bodyFont', type: 'select', label: 'Text font', options: FONT_IDS.map((f) => ({ label: FONT_LABELS[f], value: f })), admin: { width: '33%', description: 'Empty: the template font' } },
                  { name: 'corners', type: 'select', label: 'Corners', options: CORNERS.map((c) => ({ label: c, value: c })), admin: { width: '33%', description: 'Empty: the template corners' } },
                ] },
              ],
            },
          ],
        },
        {
          label: 'Booking',
          description: 'Where the Book buttons of your website go.',
          fields: [
            {
              name: 'booking',
              type: 'group',
              label: 'Booking engine',
              admin: {
                description:
                  'Where guests book online. Every Book button (header, the dates bar on the home page, each room, the Book bands) opens it, with the dates the guest chose when possible. Copy the address your booking engine gives you (or ask its support). Left empty, Book buttons go to your contact page.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'engine',
                      type: 'select',
                      label: 'Kind of booking engine',
                      defaultValue: 'link',
                      options: [
                        { label: 'Other engine or page (dates as query parameters)', value: 'link' },
                        { label: 'Clock PMS+ web booking engine', value: 'clock-pms' },
                      ],
                      admin: { width: '40%' },
                    },
                    {
                      name: 'url',
                      type: 'text',
                      label: 'Booking engine address',
                      admin: { width: '60%', placeholder: 'https://sky-eu1.clock-software.com/spa/pms-wbe/#/hotel/12345' },
                      validate: (v: unknown) => (v == null || v === '' || (typeof v === 'string' && /^https:\/\/\S+$/.test(v)) ? true : 'An https:// address'),
                    },
                  ],
                },
              ],
            },
            {
              name: 'cta',
              type: 'group',
              label: 'Book button in the header',
              admin: { description: 'The button at the top right of every page (and at the bottom of the screen on phones).' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', type: 'text', localized: true, label: 'Button text', admin: { width: '40%', placeholder: 'Book', description: 'One per language.' } },
                    {
                      name: 'href',
                      type: 'text',
                      label: 'Where it goes',
                      admin: { width: '60%', placeholder: 'book', description: '“book” opens your booking engine (above). You can also give a page (contact), a full address, tel:+33… or mailto:…' },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Advanced',
          description: 'Technical settings, mostly set up by your platform contact.',
          fields: [
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              index: true,
              label: 'Short name',
              admin: { description: 'Used in the preview address /s/<short name>. Changing it changes that address.' },
              access: { update: superAdminFieldOnly },
            },
            {
              name: 'sourceUrl',
              type: 'text',
              label: 'Your current website',
              admin: { description: 'The address the facts were read from (Import the current website, in the side panel).' },
            },
            {
              name: 'status',
              type: 'select',
              defaultValue: 'draft',
              options: [
                { label: 'Being prepared', value: 'draft' },
                { label: 'Live', value: 'live' },
                { label: 'Suspended', value: 'suspended' },
              ],
              access: { update: superAdminFieldOnly },
            },
            {
              name: 'designChannel',
              type: 'select',
              defaultValue: 'stable',
              options: [
                { label: 'Stable', value: 'stable' },
                { label: 'Canary (sees template changes first)', value: 'canary' },
              ],
              admin: { description: 'Template upgrades reach canary sites first (customer zero, our demo sites), then everyone. Render-time only: not part of releases.' },
              access: { create: superAdminFieldOnly, update: superAdminFieldOnly },
            },
          ],
        },
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
      admin: { readOnly: true, hidden: true, description: 'Release pipeline state. Written only by the publish job.' },
      access: { create: superAdminFieldOnly, update: superAdminFieldOnly },
      fields: [
        { name: 'requestSeq', type: 'number', defaultValue: 0, admin: { description: 'Incremented on every publish request; older requests are superseded' } },
        { name: 'lockedUntil', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'lockedBy', type: 'text' },
      ],
    },
  ],
}
