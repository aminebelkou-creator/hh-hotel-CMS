import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Tenants } from './collections/Tenants'
import { Sites } from './collections/Sites'
import { Pages } from './collections/Pages'
import { Media } from './collections/Media'
import { Domains } from './collections/Domains'
import { Releases } from './collections/Releases'
import { isSuperAdmin, superAdminFieldOnly } from './access'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
  },
  collections: [Users, Tenants, Sites, Pages, Media, Domains, Releases],
  localization: {
    locales: ['en', 'fr'],
    defaultLocale: 'en',
    fallback: true,
  },
  editor: lexicalEditor(),
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
    // Tenant boundary enforced in the data-access layer, never by calling code.
    multiTenantPlugin({
      tenantsSlug: 'tenants',
      collections: {
        sites: {},
        pages: {},
        media: {},
        domains: {},
        releases: {},
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
      },
    }),
  ],
})
