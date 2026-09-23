import type { CollectionConfig } from 'payload'
import { authenticated, superAdminOnly } from '../access'

/**
 * Release: an immutable, addressable snapshot of a site. Rollback is repointing a domain
 * at an earlier release. Only status may change after creation, and only by the pipeline.
 */
export const Releases: CollectionConfig = {
  slug: 'releases',
  admin: { useAsTitle: 'version', defaultColumns: ['version', 'site', 'status', 'createdAt'] },
  access: { read: authenticated, create: authenticated, update: superAdminOnly, delete: () => false },
  fields: [
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true },
    { name: 'version', type: 'text', required: true },
    { name: 'artifactRef', type: 'text', admin: { description: 'Opaque reference from the release pipeline adapter' } },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'built',
      options: ['built', 'live', 'superseded', 'rolled-back'],
    },
    { name: 'templateVersion', type: 'text' },
  ],
}
