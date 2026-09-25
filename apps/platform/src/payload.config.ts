import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { contactEndpoint } from './forms/contactEndpoint'
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
import { Crawls } from './collections/Crawls'
import { Issues } from './collections/Issues'
import { Posts } from './collections/Posts'
import { AuditLog, withAudit } from './collections/AuditLog'
import { healthReportEndpoint, healthRunEndpoint } from './health/endpoints'
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
    // Phone photos are shrunk in the browser before upload (functions accept 6 MB bodies).
    components: {
      providers: ['/admin/UploadShrinker#UploadShrinker'],
      // Fact review screen (Phase 3): /admin/review/<siteId>.
      views: {
        // Admin home: the hotel's website state, or the fleet for our team (Phase 4).
        dashboard: { Component: '/admin/Dashboard#Dashboard' },
        review: { Component: '/admin/ReviewView#ReviewView', path: '/review/:siteId', exact: true },
      },
    },
  },
  // A clear error instead of the edge's 413 for anything that still exceeds the body limit.
  upload: { limits: { fileSize: 5 * 1024 * 1024 } },
  // Content collections carry the action log hooks (src/collections/AuditLog.ts).
  collections: [Users, Tenants, ...[Sites, makePages(packBlocks), Posts, Media, Domains, Releases, Facts, Crawls, Issues, AuditLog, ...packCollections].map(withAudit)],
  // Outgoing email (contact forms) through SMTP when configured (EU provider, docs/12 §7);
  // otherwise Payload logs the message. Credentials live in environment variables only.
  email: process.env.SMTP_HOST
    ? nodemailerAdapter({
        defaultFromAddress: process.env.SMTP_FROM || 'no-reply@example.invalid',
        defaultFromName: process.env.SMTP_FROM_NAME || 'Hotel website',
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_SECURE === 'true',
          auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
        },
      })
    : undefined,
  localization: {
    locales: ['en', 'fr'],
    defaultLocale: 'en',
    fallback: true,
  },
  editor: lexicalEditor(),
  // Public contact-form submissions (src/forms/contactEndpoint.ts).
  // Public contact form, and the nightly health run/report behind a service token (src/health).
  endpoints: [contactEndpoint, healthRunEndpoint, healthReportEndpoint],
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
    // Page metadata with a search preview and an image per page (docs/12 §3). Tenant-scoped
    // through the pages collection; read by the release snapshot, never by the renderer.
    seoPlugin({
      collections: ['pages'],
      uploadsCollection: 'media',
      tabbedUI: false,
      generateTitle: ({ doc }) => String((doc as { title?: string })?.title ?? ''),
      generateURL: ({ doc }) => `/${String((doc as { slug?: string })?.slug ?? '')}`.replace('/home', '/'),
    }),
    // Old-site URLs redirected to the new pages; part of the release snapshot per site.
    redirectsPlugin({
      collections: ['pages'],
      overrides: {
        admin: { group: 'Website' },
        fields: ({ defaultFields }) => [
          { name: 'site', type: 'relationship', relationTo: 'sites', required: true, index: true },
          ...defaultFields,
        ],
      },
    }),
    // Contact forms: definitions and submissions per tenant; email through the adapter above.
    formBuilderPlugin({
      fields: { payment: false, state: false, country: false },
      formOverrides: { admin: { group: 'Website' } },
      formSubmissionOverrides: {
        admin: { group: 'Website' },
        // Visitors submit through POST /api/contact (src/forms), never through this collection's REST.
        access: { create: ({ req }) => Boolean(req.user) },
      },
    }),
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
        posts: {},
        media: {},
        domains: {},
        releases: {},
        facts: {},
        crawls: {},
        issues: {},
        'audit-log': {},
        redirects: {},
        forms: {},
        'form-submissions': {},
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
