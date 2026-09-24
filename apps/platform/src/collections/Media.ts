import { randomBytes } from 'node:crypto'
import type { CollectionConfig } from 'payload'
import { authenticated } from '../access'

/**
 * Media: photos for hotel sites. Stored in Postgres by the media storage adapter
 * (src/media/postgres-storage.ts) and served publicly at /media/<file>. Each upload gets
 * WebP variants for cards and full-width use.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  admin: { useAsTitle: 'filename', defaultColumns: ['filename', 'alt', 'rights', 'updatedAt'] },
  access: { read: authenticated, create: authenticated, update: authenticated, delete: authenticated },
  hooks: {
    // Blob keys are global, but Payload's duplicate-filename check only sees the uploader's own
    // tenant (RLS). A random prefix keeps two hotels' "room.jpg" from ever sharing a key.
    beforeOperation: [
      ({ operation, req }) => {
        if ((operation === 'create' || operation === 'update') && req.file?.name) {
          req.file.name = `${randomBytes(4).toString('hex')}-${req.file.name}`
        }
      },
    ],
  },
  upload: {
    focalPoint: true,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    formatOptions: { format: 'webp', options: { quality: 80 } },
    resizeOptions: { width: 2400, withoutEnlargement: true },
    imageSizes: [
      { name: 'thumb', width: 400, formatOptions: { format: 'webp', options: { quality: 75 } } },
      { name: 'card', width: 960, formatOptions: { format: 'webp', options: { quality: 78 } } },
      { name: 'hero', width: 1920, formatOptions: { format: 'webp', options: { quality: 80 } } },
    ],
  },
  fields: [
    { name: 'alt', type: 'text', required: true, localized: true, admin: { description: 'What the photo shows, for screen readers and search engines' } },
    {
      name: 'rights',
      type: 'select',
      defaultValue: 'unknown',
      options: ['owned', 'licensed', 'unknown'],
      admin: { description: 'Photos imported from OTA listings may be licensed to the OTA or photographer.' },
    },
    { name: 'sourceUrl', type: 'text', index: true, admin: { readOnly: true, description: 'Where an imported photo came from' } },
  ],
}
