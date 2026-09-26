import type { CollectionConfig } from 'payload'
import { isSuperAdmin } from '../access'

/**
 * How each collection is named, grouped and explained in the admin, in the hotel's words.
 * One place, so the menu reads as a whole: Your website / Your hotel / Checks & history, and
 * the platform's own tools (our team only).
 */
type Copy = { singular: string; plural: string; group: string; description?: string; ownersSee?: boolean }

export const GROUPS = { website: 'Your website', hotel: 'Your hotel', history: 'Checks & history', platform: 'Platform (our team)' } as const

export const ADMIN_COPY: Record<string, Copy> = {
  sites: {
    singular: 'Website settings',
    plural: 'Website settings',
    group: GROUPS.website,
    description: 'Name, languages, look and booking engine of your website, and the Publish button (side panel).',
  },
  pages: {
    singular: 'Page',
    plural: 'Pages',
    group: GROUPS.website,
    description: 'Each page of your website. Open one to change its text, photos and sections; then publish the site to put the changes online.',
  },
  posts: {
    singular: 'Blog post',
    plural: 'Blog posts',
    group: GROUPS.website,
    description: 'News and tips for your guests. A post shows on the site once it is Published and the site is published again.',
  },
  reviews: {
    singular: 'Guest review',
    plural: 'Guest reviews',
    group: GROUPS.website,
    description: 'Real reviews only, copied word for word from the guest (Google, Booking, Tripadvisor, a letter…). Shown once Published and the site is published again.',
  },
  media: {
    singular: 'Photo',
    plural: 'Photos',
    group: GROUPS.website,
    description: 'Your photos. JPEG, PNG or WebP; large phone photos are made smaller automatically before upload. Describe each photo for guests who cannot see it.',
  },
  forms: { singular: 'Contact form', plural: 'Contact forms', group: GROUPS.website, description: 'The forms guests fill in on your website (fields, confirmation message, who receives them).' },
  'form-submissions': { singular: 'Message', plural: 'Messages', group: GROUPS.website, description: 'Messages guests sent through the contact form of your website.' },
  redirects: { singular: 'Old address', plural: 'Old addresses', group: GROUPS.website, description: 'Addresses of your previous website sent to the matching new page, so old links and search results keep working.' },
  rooms: {
    singular: 'Room type',
    plural: 'Room types',
    group: GROUPS.hotel,
    description: 'One entry per category of room (not per room number): description, photos, equipment. Prices and availability stay in your booking engine.',
  },
  offers: { singular: 'Offer', plural: 'Offers', group: GROUPS.hotel, description: 'Packages and promotions, shown on the website between their start and end dates.' },
  facts: {
    singular: 'Hotel fact',
    plural: 'Hotel facts',
    group: GROUPS.hotel,
    description: 'Everything the website states about your hotel (address, times, services…). Only confirmed facts are used. The quickest way to check them: Review facts, on the home screen.',
  },
  issues: { singular: 'Site check', plural: 'Site checks', group: GROUPS.history, description: 'What the nightly checks noticed on your live website, with a one-click fix when there is one.' },
  releases: { singular: 'Published version', plural: 'Published versions', group: GROUPS.history, description: 'Every publish of your website. Undo the last one from Website settings.' },
  'audit-log': { singular: 'Action', plural: 'Action log', group: GROUPS.history, description: 'Every change to your website content, with who made it and when.' },
  domains: { singular: 'Domain', plural: 'Domains', group: GROUPS.history, description: 'The web addresses of your website (e.g. www.your-hotel.com) and their certificate status.' },
  crawls: { singular: 'Import', plural: 'Imports', group: GROUPS.platform, description: 'Reads of your current website that proposed facts.', ownersSee: false },
  users: { singular: 'User', plural: 'Users', group: GROUPS.platform, ownersSee: false },
  tenants: { singular: 'Hotel account', plural: 'Hotel accounts', group: GROUPS.platform, ownersSee: false },
}

/** Applies the names, group, description and visibility above to a collection config. */
export function withAdminCopy<T extends Pick<CollectionConfig, 'slug' | 'admin' | 'labels'>>(c: T): T {
  const copy = ADMIN_COPY[c.slug]
  if (!copy) return c
  return {
    ...c,
    labels: { singular: copy.singular, plural: copy.plural },
    admin: {
      ...(c.admin ?? {}),
      group: copy.group,
      ...(copy.description ? { description: copy.description } : {}),
      ...(copy.ownersSee === false ? { hidden: ({ user }: { user: unknown }) => !isSuperAdmin(user as never) } : {}),
    },
  }
}
