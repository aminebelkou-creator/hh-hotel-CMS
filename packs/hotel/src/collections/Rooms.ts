import type { CollectionConfig } from 'payload'

type AccessArgs = { req: { user?: unknown } }
const signedIn = ({ req }: AccessArgs) => Boolean(req.user)
const superAdminOnly = ({ req }: AccessArgs) => {
  const roles = (req.user as { roles?: string[] } | undefined)?.roles
  return Array.isArray(roles) && roles.includes('super-admin')
}

/**
 * Room type (not a physical room): what a guest chooses between on a hotel website.
 * Photos are remote URLs until the media pipeline exists (plan week 5).
 */
export const Rooms: CollectionConfig = {
  slug: 'rooms',
  labels: { singular: 'Room type', plural: 'Room types' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'maxOccupancy', 'order', 'updatedAt'],
    group: 'Hotel',
    description: 'Room types shown on the hotel website. Changes go live with the next publish.',
  },
  defaultSort: 'order',
  access: { read: signedIn, create: signedIn, update: signedIn, delete: superAdminOnly },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, index: true },
    { name: 'category', type: 'text', admin: { description: 'e.g. Superior, Comfort' } },
    { name: 'order', type: 'number', defaultValue: 0 },
    { name: 'summary', type: 'textarea', localized: true, admin: { description: 'One or two sentences for the room card' } },
    { name: 'description', type: 'textarea', localized: true },
    {
      type: 'row',
      fields: [
        { name: 'sizeSqm', type: 'number', label: 'Size (m²)', min: 0 },
        { name: 'maxOccupancy', type: 'number', min: 1 },
      ],
    },
    { name: 'bed', type: 'text', localized: true, admin: { description: 'e.g. Double bed or two singles' } },
    { name: 'view', type: 'text', localized: true },
    {
      name: 'features',
      type: 'array',
      fields: [{ name: 'label', type: 'text', required: true, localized: true }],
    },
    {
      name: 'images',
      type: 'array',
      fields: [
        { name: 'url', type: 'text', required: true },
        { name: 'alt', type: 'text', localized: true },
      ],
    },
  ],
}
