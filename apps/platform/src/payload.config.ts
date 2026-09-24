import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { postgresStorage } from './media/postgres-storage'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Tenants } from './collections/Tenants'
import { Sites } from './collections/Sites'
import { makePages } from './collections/Pages'
import { Media } from './collections/Media'
import { Domains } from './collections/Domains'
import { Releases } from './collections/Releases'
import { Facts } from './collections/Facts'
import { isSuperAdmin, superAdminFieldOnly } from './access'
import { touchPageSeo } from './jobs/touchPageSeo'
import { publishSiteTask } from './jobs/publishSite'
import { packBlocks, packCollections, packTenantCollections } from './packs'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
  },
  collections: [Users, Tenants, Sites, makePages(packBlocks), Media, Domains, Releases, Facts, ...packCollections],
  localization: {
    locales: ['en', 'fr'],
    defaultLocale: 'en',
    fallback: true,
  },
  editor: lexicalEditor(),
  // Background jobs carry their tenant in the input and scope every query by it (see src/jobs).
  jobs: { tasks: [touchPageSeo, publishSiteTask] },
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    // Dev-mode schema push only against a local database. Push drops anything it does not
    // manage (it removed the RLS policies in the week-1 spike) and must never touch a shared
    // or production database; those change through migrations only.
    // PAYLOAD_DB_PUSH=false turns it off locally too (migration rehearsals on a local database).
    push:
      process.env.PAYLOAD_DB_PUSH !== 'false' &&
      /@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL || ''),
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  plugins: [
    // Photos stored in Postgres (media_blobs) and served publicly at /media/<file>.
    cloudStoragePlugin({
      collections: { media: { adapter: postgresStorage, disableLocalStorage: true, disablePayloadAccessControl: true } },
    }),
    // Tenant boundary enforced in the data-access layer, never by calling code.
    multiTenantPlugin({
      tenantsSlug: 'tenants',
      collections: {
        sites: {},
        pages: {},
        media: {},
        domains: {},
        releases: {},
        facts: {},
        ...Object.fromEntries(packTenantCollections.map((slug) => [slug, {}])),
      },
      userHasAccessToAllTenants: (user) => isSuperAdmin(user),
      tenantsArrayField: {
        includeDefaultField: true,
        // A user must never be able to add themselves to another tenant.
        arrayFieldAccess: {
          create: superAdminFieldOnly,
          update: superAdminFieldOnly,
        },
        rowFields: [],
      },
    }),
    // Outbound MCP: intent-shaped exposure, scoped per API key. Deletes never exposed.
    mcpPlugin({
      collections: {
        pages: {
          enabled: { find: true, create: true, update: true, delete: false },
          description: 'Site pages composed of typed blocks; drafts by default',
        },
        sites: {
          enabled: { find: true, create: false, update: true, delete: false },
          description: 'Sites owned by the tenant: locales, theme tokens, status',
        },
        media: {
          enabled: { find: true, create: false, update: false, delete: false },
          description: 'Media library with rights metadata',
        },
        rooms: {
          enabled: { find: true, create: true, update: true, delete: false },
          description: 'Hotel room types shown on the website (hotel pack): names, descriptions, occupancy, photos',
        },
        // Agents may read and propose facts; only a person confirms them (no update).
        facts: {
          enabled: { find: true, create: true, update: false, delete: false },
          description: 'Fact base: checkable statements about the business, with source and confirmation status. Only confirmed facts may be used in content',
        },
      },
    }),
  ],
})
