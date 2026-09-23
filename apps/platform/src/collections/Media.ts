import type { CollectionConfig } from 'payload'
import { authenticated } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  access: { read: authenticated, create: authenticated, update: authenticated, delete: authenticated },
  upload: {
    focalPoint: true,
    imageSizes: [
      { name: 'thumb', width: 400 },
      { name: 'card', width: 960 },
      { name: 'hero', width: 1920 },
    ],
  },
  fields: [
    { name: 'alt', type: 'text', required: true, localized: true },
    {
      name: 'rights',
      type: 'select',
      defaultValue: 'unknown',
      options: ['owned', 'licensed', 'unknown'],
      admin: { description: 'Photos imported from OTA listings may be licensed to the OTA or photographer.' },
    },
  ],
}
