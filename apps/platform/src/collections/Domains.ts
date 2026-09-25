import type { CollectionConfig } from 'payload'
import { HOSTNAME_RE } from '../site/hosts'
import { authenticated, superAdminFieldOnly, superAdminOnly } from '../access'

/**
 * Domain: a hostname pointing at a site's live release. A tenant adds its hostname; only a
 * super-admin marks it verified (after checking the DNS and the host binding), and only
 * verified/active domains are served (src/releases/resolve.ts). Certificate state is
 * tracked, not owned, here.
 */
export const Domains: CollectionConfig = {
  slug: 'domains',
  admin: { useAsTitle: 'hostname' },
  access: { read: authenticated, create: authenticated, update: authenticated, delete: superAdminOnly },
  fields: [
    {
      name: 'hostname',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      validate: (v: unknown) => (typeof v === 'string' && HOSTNAME_RE.test(v.trim().toLowerCase()) ? true : 'A hostname like www.example.com'),
      hooks: { beforeValidate: [({ value }) => (typeof value === 'string' ? value.trim().toLowerCase().replace(/\.$/, '') : value)] },
      admin: { description: 'The hotel adds a CNAME for this name at its DNS provider, pointing at the platform' },
    },
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true },
    { name: 'primary', type: 'checkbox', defaultValue: false },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: ['pending', 'verified', 'active', 'error'],
      access: { create: superAdminFieldOnly, update: superAdminFieldOnly },
      admin: { description: 'Set by the platform team once the DNS points here. Only verified or active domains are served' },
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
