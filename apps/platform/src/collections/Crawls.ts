import type { CollectionConfig } from 'payload'
import { authenticated, superAdminOnly } from '../access'
import { continueEndpoint } from '../ingest/endpoints'

/**
 * Crawl: one import of a hotel's existing website into its fact base. Started from the
 * Website panel (POST /api/sites/:id/ingest), continued chunk by chunk from the browser
 * (POST /api/crawls/:id/continue) so each request stays well inside the function limit.
 * The state (queue, pages, sightings) is kept here so a crawl survives restarts; the facts
 * it finds land in `facts`, unconfirmed, with their source URL.
 */
export const Crawls: CollectionConfig = {
  slug: 'crawls',
  admin: {
    group: 'Website',
    useAsTitle: 'startUrl',
    defaultColumns: ['startUrl', 'site', 'status', 'pagesCrawled', 'factsFound', 'updatedAt'],
    description: 'Imports from the hotel’s current website. Start one from the site’s Website panel.',
  },
  // Users start crawls through the endpoint; only the pipeline changes them afterwards.
  access: { read: authenticated, create: superAdminOnly, update: superAdminOnly, delete: superAdminOnly },
  endpoints: [continueEndpoint],
  fields: [
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true, index: true },
    { name: 'startUrl', type: 'text', required: true },
    { name: 'status', type: 'select', required: true, defaultValue: 'queued', index: true, options: ['queued', 'running', 'done', 'failed'] },
    { name: 'maxPages', type: 'number', defaultValue: 40, min: 1, max: 200 },
    { name: 'pagesCrawled', type: 'number', defaultValue: 0 },
    { name: 'pagesLeft', type: 'number', defaultValue: 0 },
    { name: 'factsFound', type: 'number', defaultValue: 0, admin: { description: 'Distinct facts written to the fact base (new or refreshed)' } },
    { name: 'factsNew', type: 'number', defaultValue: 0 },
    { name: 'aiPass', type: 'json', admin: { description: 'Whether a model proposed extra facts, and how many' } },
    { name: 'audit', type: 'json', admin: { description: 'Site audit: pages, titles, structured data, thin pages' } },
    { name: 'log', type: 'textarea', admin: { readOnly: true } },
    { name: 'startedBy', type: 'text', admin: { readOnly: true } },
    { name: 'finishedAt', type: 'date', admin: { readOnly: true } },
    // Crawler state between chunks (queue, done, pages with their text). Large; hidden in the admin.
    { name: 'state', type: 'json', admin: { hidden: true } },
  ],
}
