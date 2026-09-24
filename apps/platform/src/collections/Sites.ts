import type { CollectionConfig } from 'payload'
import { authenticated, superAdminFieldOnly } from '../access'
import { publishEndpoint, rollbackEndpoint } from '../releases/endpoints'

/** Site: the publishing boundary. Theme tokens are separable from content by design. */
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
      admin: { description: 'Design tokens (W3C DTCG). Contrast is validated at token level before publish.' },
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
