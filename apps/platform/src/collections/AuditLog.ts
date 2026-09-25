import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig } from 'payload'
import { authenticated, superAdminOnly } from '../access'

/**
 * Action log (Phase 4): who changed what, when, in the admin or through the API. Written by
 * hooks on the content collections (never by a request), one row per change, with the
 * changed field names, never the values. Tenant-scoped like everything else: a hotel sees
 * its own log, our team sees all.
 */
export const AuditLog: CollectionConfig = {
  slug: 'audit-log',
  labels: { singular: 'Action', plural: 'Action log' },
  admin: {
    group: 'Website',
    useAsTitle: 'summary',
    defaultColumns: ['summary', 'collectionSlug', 'actor', 'createdAt'],
    description: 'Every change to your website content, with who made it.',
    listSearchableFields: ['summary', 'actor'],
  },
  access: { read: authenticated, create: superAdminOnly, update: () => false, delete: superAdminOnly },
  fields: [
    { name: 'collectionSlug', type: 'text', required: true, index: true },
    { name: 'docId', type: 'text', required: true, index: true },
    { name: 'operation', type: 'select', required: true, options: ['create', 'update', 'delete'] },
    { name: 'actor', type: 'text', required: true, admin: { description: 'user:<id> <email>, api-key:<id>, job, system' } },
    { name: 'summary', type: 'text', required: true },
    { name: 'changed', type: 'json', admin: { description: 'Field names that changed' } },
    { name: 'context', type: 'text', admin: { description: 'generation, translation, import, publish…' } },
  ],
}

export const AUDITED = ['sites', 'pages', 'facts', 'domains', 'media', 'redirects', 'forms', 'rooms', 'offers', 'crawls'] as const

const SKIP = new Set(['updatedAt', 'createdAt', '_status', 'id', 'sizes', 'state', 'log', 'audit', 'evidence', 'publish'])
// Relationships arrive as ids or as populated objects depending on depth: compare by id.
const flat = (v: unknown): unknown => (Array.isArray(v) ? v.map(flat) : v && typeof v === 'object' && 'id' in (v as object) && Object.keys(v as object).length > 1 ? (v as { id: unknown }).id : v)
const changedKeys = (before: Record<string, unknown> | undefined, after: Record<string, unknown>) =>
  Object.keys(after).filter((k) => !SKIP.has(k) && JSON.stringify(flat(before?.[k]) ?? null) !== JSON.stringify(flat(after[k]) ?? null)).slice(0, 30)

const actorOf = (req: { user?: { collection?: string; id?: unknown; email?: string } | null; context?: Record<string, unknown> }) => {
  if (req.user) return `${req.user.collection ?? 'user'}:${req.user.id}${req.user.email ? ` ${req.user.email}` : ''}`
  if (req.context?.generation) return 'system:generation'
  return 'system'
}
const tenantOf = (doc: Record<string, unknown>) => {
  const t = doc.tenant
  return typeof t === 'object' && t ? (t as { id: number }).id : (t as number | undefined)
}
const titleOf = (doc: Record<string, unknown>) => String(doc.title ?? doc.name ?? doc.key ?? doc.hostname ?? doc.slug ?? doc.filename ?? doc.startUrl ?? doc.id)

export const auditAfterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req, collection }) => {
  try {
    const changed = operation === 'update' ? changedKeys(previousDoc as Record<string, unknown>, doc as Record<string, unknown>) : []
    if (operation === 'update' && changed.length === 0) return doc
    const tenant = tenantOf(doc as Record<string, unknown>)
    await req.payload.create({
      collection: 'audit-log',
      data: {
        tenant: tenant ?? undefined,
        collectionSlug: collection.slug,
        docId: String(doc.id),
        operation,
        actor: actorOf(req),
        summary: `${operation === 'create' ? 'Created' : 'Changed'} ${collection.labels?.singular ? String(typeof collection.labels.singular === 'string' ? collection.labels.singular : collection.slug).toLowerCase() : collection.slug} “${titleOf(doc as Record<string, unknown>)}”${changed.length ? ` (${changed.join(', ')})` : ''}`,
        changed,
        context: req.context?.generation ? 'generation' : undefined,
      } as never,
      overrideAccess: true,
      req,
    })
  } catch (e) {
    req.payload.logger.warn(`audit log write failed: ${(e as Error).message}`)
  }
  return doc
}

export const auditAfterDelete: CollectionAfterDeleteHook = async ({ doc, req, collection }) => {
  try {
    await req.payload.create({
      collection: 'audit-log',
      data: { tenant: tenantOf(doc as Record<string, unknown>) ?? undefined, collectionSlug: collection.slug, docId: String(doc.id), operation: 'delete', actor: actorOf(req), summary: `Deleted ${collection.slug} “${titleOf(doc as Record<string, unknown>)}”`, changed: [] } as never,
      overrideAccess: true,
      req,
    })
  } catch (e) {
    req.payload.logger.warn(`audit log write failed: ${(e as Error).message}`)
  }
  return doc
}

/** Attach the audit hooks to a collection config (used by payload.config.ts for the audited slugs). */
export const withAudit = <T extends CollectionConfig>(c: T): T =>
  (AUDITED as readonly string[]).includes(c.slug)
    ? { ...c, hooks: { ...c.hooks, afterChange: [...(c.hooks?.afterChange ?? []), auditAfterChange], afterDelete: [...(c.hooks?.afterDelete ?? []), auditAfterDelete] } }
    : c
