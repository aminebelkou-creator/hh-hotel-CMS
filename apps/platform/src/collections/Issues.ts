import type { CollectionConfig } from 'payload'
import { authenticated, superAdminOnly } from '../access'
import { applyIssueEndpoint } from '../health/endpoints'
import { ISSUE_KINDS } from '../health/kinds'

/**
 * Issue: one thing the platform noticed about a hotel's website (Phase 4, "operated
 * service"). Written by the site checks (src/health) and the nightly accessibility run;
 * de-duplicated by fingerprint per site; a proposed fix, when there is one, is applied
 * with one tap (POST /api/issues/:id/apply) under the caller's own rights.
 */
export const Issues: CollectionConfig = {
  slug: 'issues',
  admin: {
    group: 'Website',
    useAsTitle: 'title',
    defaultColumns: ['title', 'site', 'kind', 'severity', 'status', 'detectedAt'],
    description: 'What the platform noticed about your website, with a fix to approve when there is one.',
    listSearchableFields: ['title', 'url'],
  },
  access: { read: authenticated, create: superAdminOnly, update: authenticated, delete: superAdminOnly },
  endpoints: [applyIssueEndpoint],
  fields: [
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true, index: true },
    { name: 'kind', type: 'select', required: true, index: true, options: [...ISSUE_KINDS] },
    { name: 'severity', type: 'select', required: true, defaultValue: 'warning', options: ['info', 'warning', 'error'] },
    { name: 'title', type: 'text', required: true },
    { name: 'detail', type: 'textarea' },
    { name: 'url', type: 'text', admin: { description: 'Where it was seen' } },
    { name: 'status', type: 'select', required: true, defaultValue: 'open', index: true, options: ['open', 'applied', 'resolved', 'dismissed'] },
    { name: 'fingerprint', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'fixLabel', type: 'text', admin: { readOnly: true, description: 'What "Apply" would do' } },
    // { collection, id, data } applied through the Local API under the approver's own access.
    { name: 'fix', type: 'json', admin: { hidden: true } },
    { name: 'source', type: 'text', admin: { readOnly: true } },
    { name: 'detectedAt', type: 'date', admin: { readOnly: true } },
    { name: 'resolvedAt', type: 'date', admin: { readOnly: true } },
    { name: 'appliedBy', type: 'text', admin: { readOnly: true } },
  ],
}
