import type { CollectionConfig } from 'payload'
import { readOwnTenants, superAdminOnly } from '../access'

/**
 * Tenant = the Organisation primitive in the solution definition: the billing and
 * isolation boundary. Workspaces are deferred; a tenant owns its sites directly for now.
 */
export const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: { useAsTitle: 'name' },
  access: {
    read: readOwnTenants,
    create: superAdminOnly,
    update: superAdminOnly,
    delete: superAdminOnly,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    {
      name: 'plan',
      type: 'select',
      defaultValue: 'concierge',
      options: ['concierge', 'starter', 'managed', 'dedicated'],
    },
  ],
}
