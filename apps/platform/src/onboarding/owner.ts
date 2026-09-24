/**
 * Creates (or resets) a hotel's owner account: a tenant user with the `owner` role on that
 * hotel only. The password comes from the HH_OWNER_PASSWORD environment variable, never
 * from the command line or the repo.
 *
 *   HH_OWNER_PASSWORD=... pnpm exec tsx src/onboarding/owner.ts <tenant-slug> <email>
 *
 * Engineer-run system operation; never reachable from a request.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

const isMain = process.argv[1] && /onboarding[\\/]owner\.ts$/.test(process.argv[1])
if (isMain) {
  const [tenantSlug, email] = process.argv.slice(2)
  const password = process.env.HH_OWNER_PASSWORD ?? ''
  const run = async () => {
    if (!tenantSlug || !email) throw new Error('Usage: owner.ts <tenant-slug> <email>')
    if (password.length < 16) throw new Error('Set HH_OWNER_PASSWORD (16+ characters)')
    const payload = await getPayload({ config })
    const tenant = (await payload.find({ collection: 'tenants', where: { slug: { equals: tenantSlug } }, limit: 1, overrideAccess: true })).docs[0]
    if (!tenant) throw new Error(`Tenant ${tenantSlug} not found`)
    const existing = (await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true })).docs[0] as
      | { id: number; roles?: string[]; tenants?: { tenant: number | { id: number } }[] }
      | undefined
    if (existing?.roles?.includes('super-admin')) throw new Error('Refusing to turn a super-admin into a hotel owner')
    const data = { email, password, roles: ['owner'], tenants: [{ tenant: tenant.id }] }
    if (existing) {
      const others = (existing.tenants ?? []).map((t) => (typeof t.tenant === 'object' ? t.tenant.id : t.tenant))
      if (others.some((id) => Number(id) !== Number(tenant.id))) throw new Error('This user belongs to another hotel; use a different email')
      await payload.update({ collection: 'users', id: existing.id, data: data as never, overrideAccess: true })
      console.log(`owner: updated ${email} for ${tenantSlug}`)
    } else {
      await payload.create({ collection: 'users', data: data as never, overrideAccess: true })
      console.log(`owner: created ${email} for ${tenantSlug}`)
    }
    process.exit(0)
  }
  run().catch((e) => {
    console.error(e instanceof Error ? e.message : e)
    process.exit(1)
  })
}
