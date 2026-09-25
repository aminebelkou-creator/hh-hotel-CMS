import type { CollectionConfig } from 'payload'
import { selfOrSuperAdmin, superAdminFieldOnly, superAdminOnly } from '../access'

/**
 * Users. The multi-tenant plugin adds a `tenants` array field to this collection;
 * its field-level access is locked to super-admins in payload.config.ts so a user
 * can never add themselves to another tenant.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  // Brute-force protection at the application: 5 failed logins lock the account for 15 minutes
  // (Payload's own lockout; docs/12 §4). Edge rate limits come on top, per host.
  auth: { maxLoginAttempts: 5, lockTime: 15 * 60 * 1000 },
  admin: { useAsTitle: 'email' },
  access: {
    read: selfOrSuperAdmin,
    create: superAdminOnly,
    update: selfOrSuperAdmin,
    delete: superAdminOnly,
  },
  fields: [
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['editor'],
      options: [
        { label: 'Super admin', value: 'super-admin' },
        { label: 'Owner', value: 'owner' },
        { label: 'Editor', value: 'editor' },
      ],
      saveToJWT: true,
      // Only super-admins may change roles: prevents privilege escalation via self-update.
      access: { update: superAdminFieldOnly },
    },
  ],
}
