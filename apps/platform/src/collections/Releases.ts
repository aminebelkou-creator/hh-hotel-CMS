import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { authenticated, superAdminOnly } from '../access'

/** Fields fixed at creation. Changing any of them after the fact would break the audit trail. */
const IMMUTABLE = ['site', 'version', 'snapshot', 'checksum', 'requestSeq', 'publishedBy', 'templateVersion'] as const

const keepImmutable: CollectionBeforeChangeHook = ({ data, originalDoc, operation }) => {
  if (operation !== 'update' || !originalDoc) return data
  for (const f of IMMUTABLE) {
    if (f in data && JSON.stringify(data[f] ?? null) !== JSON.stringify(normalise(originalDoc[f]))) {
      throw new Error(`Release field "${f}" is immutable`)
    }
  }
  return data
}
const normalise = (v: unknown) => (v && typeof v === 'object' && 'id' in (v as object) ? (v as { id: unknown }).id : v ?? null)

/**
 * Release: an immutable, addressable snapshot of a site. Rollback is repointing the site's
 * currentRelease at an earlier release. Releases are created only by the release pipeline
 * (src/releases), never deleted, and after creation only their status and verification
 * results change.
 */
export const Releases: CollectionConfig = {
  slug: 'releases',
  admin: {
    useAsTitle: 'version',
    defaultColumns: ['version', 'site', 'status', 'pageCount', 'durationMs', 'createdAt'],
  },
  access: { read: authenticated, create: superAdminOnly, update: superAdminOnly, delete: () => false },
  hooks: { beforeChange: [keepImmutable] },
  fields: [
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true, index: true },
    { name: 'version', type: 'text', required: true },
    { name: 'artifactRef', type: 'text', admin: { description: 'Opaque reference from the release pipeline adapter' } },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'built',
      options: ['built', 'live', 'superseded', 'rolled-back', 'failed'],
    },
    { name: 'templateVersion', type: 'text' },
    { name: 'requestSeq', type: 'number', admin: { description: 'The publish request this release answers' } },
    { name: 'publishedBy', type: 'text', admin: { description: 'user:<id>, agent:<key> or job' } },
    { name: 'checksum', type: 'text', admin: { description: 'sha256 of the canonical snapshot' } },
    { name: 'pageCount', type: 'number' },
    { name: 'durationMs', type: 'number', admin: { description: 'Lock to verified, in milliseconds' } },
    { name: 'verifiedAt', type: 'date' },
    { name: 'error', type: 'textarea' },
    {
      name: 'snapshot',
      type: 'json',
      admin: { description: 'Everything the renderer needs: site settings, published pages, confirmed facts' },
    },
  ],
}
