import type { CollectionConfig } from 'payload'

type AccessArgs = { req: { user?: unknown } }
const signedIn = ({ req }: AccessArgs) => Boolean(req.user)
const superAdminOnly = ({ req }: AccessArgs) => {
  const roles = (req.user as { roles?: string[] } | undefined)?.roles
  return Array.isArray(roles) && roles.includes('super-admin')
}

/**
 * Offer: a package or promotion shown on the hotel website (e.g. "3 nights for 2",
 * "Book direct: breakfast included"). Marketing content only: no prices are computed and
 * nothing is booked here. Shown only between its dates, and only when active.
 */
export const Offers: CollectionConfig = {
  slug: 'offers',
  labels: { singular: 'Offer', plural: 'Offers' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'active', 'validFrom', 'validTo', 'order'],
    group: 'Hotel',
    description: 'Packages and promotions shown on the website between their dates. Changes go live with the next publish.',
  },
  defaultSort: 'order',
  access: { read: signedIn, create: signedIn, update: signedIn, delete: superAdminOnly },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, index: true },
    {
      type: 'row',
      fields: [
        { name: 'active', type: 'checkbox', defaultValue: true },
        { name: 'order', type: 'number', defaultValue: 0 },
      ],
    },
    { name: 'highlight', type: 'text', localized: true, admin: { description: 'Short badge, e.g. "-10 %" or "Breakfast included"' } },
    { name: 'summary', type: 'textarea', required: true, localized: true },
    { name: 'conditions', type: 'textarea', localized: true, admin: { description: 'Small print shown under the offer' } },
    {
      type: 'row',
      fields: [
        { name: 'validFrom', type: 'date' },
        { name: 'validTo', type: 'date' },
      ],
    },
    { name: 'imageUrl', type: 'text' },
    { name: 'imageAlt', type: 'text', localized: true },
    { name: 'ctaLabel', type: 'text', localized: true },
    { name: 'ctaHref', type: 'text', admin: { description: 'A page slug (e.g. contact), a URL, tel: or mailto:' } },
  ],
}
