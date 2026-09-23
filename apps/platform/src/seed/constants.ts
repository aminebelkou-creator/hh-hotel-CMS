export const SEED_PASSWORD = 'Passw0rd!seed'
export const TENANT_COUNT = Number(process.env.SEED_TENANTS || 50)
export const tenantSlug = (n: number) => `tenant-${String(n).padStart(2, '0')}`
export const tenantEmail = (n: number) => `user-${String(n).padStart(2, '0')}@example.test`
export const SUPER_ADMIN_EMAIL = 'super@example.test'
