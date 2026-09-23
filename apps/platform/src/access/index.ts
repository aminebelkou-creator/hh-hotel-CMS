import type { Access, FieldAccess, PayloadRequest } from 'payload'

/**
 * Access helpers for the platform.
 *
 * Tenant scoping of content collections is enforced by @payloadcms/plugin-multi-tenant,
 * which wraps collection access with a tenant constraint derived from the requesting
 * user's `tenants` array. The helpers here cover everything the plugin does not:
 * who is a super-admin, who may change roles or tenant membership, and the baseline
 * "must be authenticated" rule.
 */

type UserLike = { id?: number | string; roles?: string[] | null; tenants?: unknown } | null | undefined

export const isSuperAdmin = (user: UserLike): boolean =>
  Boolean(user && Array.isArray(user.roles) && user.roles.includes('super-admin'))

export const tenantIdsOf = (user: UserLike): (number | string)[] => {
  const arr = (user as { tenants?: { tenant: number | string | { id: number | string } }[] } | null)?.tenants
  if (!Array.isArray(arr)) return []
  return arr
    .map((t) => (t && typeof t.tenant === 'object' ? t.tenant.id : t?.tenant))
    .filter((v): v is number | string => v !== undefined && v !== null)
}

export const authenticated: Access = ({ req }) => Boolean(req.user)

export const superAdminOnly: Access = ({ req }) => isSuperAdmin(req.user)

export const selfOrSuperAdmin: Access = ({ req }) => {
  if (!req.user) return false
  if (isSuperAdmin(req.user)) return true
  return { id: { equals: req.user.id } }
}

export const superAdminFieldOnly: FieldAccess = ({ req }: { req: PayloadRequest }) =>
  isSuperAdmin(req.user)

/** Read access to the tenants collection: super-admins see all, others see their own. */
export const readOwnTenants: Access = ({ req }) => {
  if (!req.user) return false
  if (isSuperAdmin(req.user)) return true
  const ids = tenantIdsOf(req.user)
  if (ids.length === 0) return false
  return { id: { in: ids } }
}
