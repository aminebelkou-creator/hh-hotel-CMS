// Local default only. Any shared or deployed environment sets SEED_PASSWORD to a random value
// (see src/seed/rotate-passwords.ts); the default must never work on a public deployment.
const isLocalDb = /@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL || '')
if (!process.env.SEED_PASSWORD && !isLocalDb) {
  // Shared databases have rotated passwords; guessing the default only locks the accounts.
  throw new Error('SEED_PASSWORD must be set when DATABASE_URL is not a local database')
}
export const SEED_PASSWORD = process.env.SEED_PASSWORD || 'Passw0rd!seed'
export const TENANT_COUNT = Number(process.env.SEED_TENANTS || 50)
export const tenantSlug = (n: number) => `tenant-${String(n).padStart(2, '0')}`
export const tenantEmail = (n: number) => `user-${String(n).padStart(2, '0')}@example.test`
export const SUPER_ADMIN_EMAIL = 'super@example.test'