import type { TaskConfig } from 'payload'

/**
 * Reference pattern for every background job on this platform.
 *
 * Jobs run without a user, so Payload access control cannot scope them. The tenant boundary is
 * therefore carried IN the job input and enforced in the query itself: every read or write
 * filters on `tenant = input.tenantId`. A job queued for tenant A that names a tenant B document
 * matches nothing. This file is on the overrideAccess allowlist for that reason; the
 * isolation suite (tests/int/isolation-extended.int.spec.ts) proves the pattern holds.
 */
export const touchPageSeo: TaskConfig<'touchPageSeo'> = {
  slug: 'touchPageSeo',
  inputSchema: [
    { name: 'tenantId', type: 'number', required: true },
    { name: 'pageId', type: 'number', required: true },
    { name: 'description', type: 'text', required: true },
  ],
  outputSchema: [{ name: 'updated', type: 'number' }],
  handler: async ({ input, req }) => {
    const res = await req.payload.update({
      collection: 'pages',
      where: { and: [{ id: { equals: input.pageId } }, { tenant: { equals: input.tenantId } }] },
      data: { seo: { description: input.description } },
      overrideAccess: true,
      req,
    })
    return { output: { updated: res.docs.length } }
  },
}
