/**
 * Seed: 50 tenants, one user each, one site, three pages, one domain, plus one super-admin.
 * Run with: pnpm seed   (payload run src/seed/index.ts)
 *
 * This is a system operation and uses overrideAccess: true on purpose. It is listed in
 * src/access/override-access.allowlist.json and audited by tests/int/override-access.int.spec.ts.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

import { SEED_PASSWORD, SUPER_ADMIN_EMAIL, TENANT_COUNT, tenantEmail, tenantSlug } from './constants'

const run = async () => {
  const payload = await getPayload({ config })
  const t0 = Date.now()

  // Idempotent: wipe seeded data first (by slug/email prefix).
  for (const collection of ['releases', 'domains', 'pages', 'sites'] as const) {
    await payload.delete({ collection, where: { id: { exists: true } }, overrideAccess: true })
  }
  await payload.delete({ collection: 'users', where: { email: { like: '@example.test' } }, overrideAccess: true })
  await payload.delete({ collection: 'tenants', where: { slug: { like: 'tenant-' } }, overrideAccess: true })

  await payload.create({
    collection: 'users',
    data: { email: SUPER_ADMIN_EMAIL, password: SEED_PASSWORD, roles: ['super-admin'] },
    overrideAccess: true,
  })

  for (let n = 1; n <= TENANT_COUNT; n++) {
    const tenant = await payload.create({
      collection: 'tenants',
      data: { name: `Tenant ${n}`, slug: tenantSlug(n), plan: 'concierge' },
      overrideAccess: true,
    })
    await payload.create({
      collection: 'users',
      data: {
        email: tenantEmail(n),
        password: SEED_PASSWORD,
        roles: ['owner'],
        tenants: [{ tenant: tenant.id }],
      },
      overrideAccess: true,
    })
    const site = await payload.create({
      collection: 'sites',
      data: { name: `Site ${n}`, slug: `site-${n}`, enabledLocales: ['en', 'fr'], defaultLocale: 'en', status: 'draft', tenant: tenant.id },
      overrideAccess: true,
    })
    for (const slug of ['home', 'rooms', 'contact']) {
      await payload.create({
        collection: 'pages',
        data: {
          title: `${slug} of tenant ${n}`,
          slug,
          site: site.id,
          tenant: tenant.id,
          _status: 'published',
          blocks: [{ blockType: 'hero', heading: `Welcome to tenant ${n}`, provenance: { origin: 'generated', sourceFact: 'seed' } }],
        },
        overrideAccess: true,
      })
    }
    await payload.create({
      collection: 'domains',
      data: { hostname: `${tenantSlug(n)}.example.test`, site: site.id, primary: true, status: 'pending', tenant: tenant.id },
      overrideAccess: true,
    })
  }

  payload.logger.info(`Seeded ${TENANT_COUNT} tenants in ${((Date.now() - t0) / 1000).toFixed(1)}s`)
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
