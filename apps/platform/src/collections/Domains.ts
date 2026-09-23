import type { CollectionConfig } from 'payload'
import { authenticated, superAdminOnly } from '../access'

/** Domain: a hostname pointing at a site's live release. Certificate state is tracked, not owned, here. */
export const Domains: CollectionConfig = {
  slug: 'domains',
  admin: { useAsTitle: 'hostname' },
  access: { read: authenticated, create: authenticated, update: authenticated, delete: superAdminOnly },
  fields: [
    { name: 'hostname', type: 'text', required: true, unique: true, index: true },
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true },
    { name: 'primary', type: 'checkbox', defaultValue: false },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: ['pending', 'verified', 'active', 'error'],
    },
    {
      name: 'certificate',
      type: 'select',
      defaultValue: 'none',
      options: ['none', 'requested', 'issued', 'expiring', 'error'],
    },
    { name: 'provider', type: 'text', admin: { description: 'Set by the release pipeline adapter, never by the app' } },
  ],
}
