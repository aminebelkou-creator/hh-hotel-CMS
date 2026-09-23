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
      name: 'booking',
      type: 'group',
      admin: { description: 'Booking engine mounted on the hotel domain at /book (contract: booking-engine-embed).' },
      fields: [
        {
          name: 'engine',
          type: 'select',
          defaultValue: 'none',
          options: [
            { label: 'None', value: 'none' },
            { label: 'clockPMS BE (mock)', value: 'clockpms-be-mock' },
          ],
        },
        { name: 'propertyCode', type: 'text', admin: { description: 'Property identifier in the booking engine' } },
        { name: 'currency', type: 'text', defaultValue: 'EUR' },
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
