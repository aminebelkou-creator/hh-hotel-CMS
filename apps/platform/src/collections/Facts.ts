import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { authenticated, superAdminFieldOnly, superAdminOnly } from '../access'

/**
 * Fact: one checkable statement about a tenant's business (a phone number, a check-out time,
 * an amenity), with where it came from and whether the business has confirmed it.
 *
 * Spec rule: nothing is generated or published from an unconfirmed fact. Ingest and agents
 * create facts as `unconfirmed`; a person confirms or rejects them. Confirmation metadata is
 * stamped by the server, never taken from the request.
 */
const stampDecision: CollectionBeforeChangeHook = ({ data, originalDoc, req, operation }) => {
  const before = operation === 'update' ? originalDoc?.status : undefined
  const after = data.status ?? before ?? 'unconfirmed'
  data.status = after
  if (after === before) {
    // Status unchanged: decision metadata cannot be rewritten.
    data.decidedBy = originalDoc?.decidedBy ?? null
    data.decidedAt = originalDoc?.decidedAt ?? null
    return data
  }
  if (after === 'unconfirmed') {
    data.decidedBy = null
    data.decidedAt = null
  } else {
    data.decidedBy = req.user?.id ?? null
    data.decidedAt = new Date().toISOString()
  }
  return data
}

export const FACT_METHODS = [
  'structured-data',
  'meta',
  'link',
  'text',
  'keyword',
  'heading',
  'pms',
  'manual',
  'agent',
] as const

export const Facts: CollectionConfig = {
  slug: 'facts',
  admin: {
    useAsTitle: 'key',
    defaultColumns: ['key', 'value', 'status', 'confidence', 'occurrences', 'updatedAt'],
    description: 'The fact base. Confirm or reject each fact; only confirmed facts feed generation and releases.',
    listSearchableFields: ['key', 'value'],
  },
  access: { read: authenticated, create: authenticated, update: authenticated, delete: superAdminOnly },
  hooks: { beforeChange: [stampDecision] },
  fields: [
    { name: 'key', type: 'text', required: true, index: true, admin: { description: 'Dotted key, e.g. policy.checkout, contact.phone' } },
    { name: 'value', type: 'text', required: true, admin: { description: 'Normalised value' } },
    { name: 'site', type: 'relationship', relationTo: 'sites' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'unconfirmed',
      index: true,
      options: ['unconfirmed', 'confirmed', 'rejected'],
      // Facts are born unconfirmed: users and agents cannot create a pre-confirmed fact.
      // Confirming is a separate, stamped update by a person.
      access: { create: superAdminFieldOnly },
    },
    { name: 'confidence', type: 'number', min: 0, max: 1, admin: { description: 'Extraction confidence, 0 to 1' } },
    { name: 'method', type: 'select', options: [...FACT_METHODS] },
    { name: 'source', type: 'text', admin: { description: 'First URL or system the fact was found in' } },
    { name: 'occurrences', type: 'number', defaultValue: 1, min: 1 },
    {
      name: 'evidence',
      type: 'json',
      admin: { description: 'Every raw sighting: [{ source, method, raw }]' },
    },
    {
      name: 'decisionNote',
      type: 'textarea',
      admin: { description: 'Why it was confirmed or rejected, and by whom if not a platform user' },
    },
    {
      name: 'decidedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true, position: 'sidebar' },
    },
    { name: 'decidedAt', type: 'date', admin: { readOnly: true, position: 'sidebar' } },
  ],
}
