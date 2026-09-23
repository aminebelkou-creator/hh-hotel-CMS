import type { CollectionConfig } from 'payload'
import { authenticated } from '../access'

/** Site: the publishing boundary. Theme tokens are separable from content by design. */
export const Sites: CollectionConfig = {
  slug: 'sites',
  admin: { useAsTitle: 'name' },
  access: { read: authenticated, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, index: true },
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
  ],
}
