import type { TaskConfig } from 'payload'
import { publishSite as publish } from '../releases/publish'

/**
 * Publish one site as an immutable release. Follows the jobs pattern: the tenant travels in
 * the input and every statement in src/releases filters on it. A request superseded by a
 * newer one ends without building anything; a site that is busy publishing makes the task
 * throw so the queue retries it later.
 */
export const publishSiteTask: TaskConfig<'publishSite'> = {
  slug: 'publishSite',
  retries: { attempts: 5, backoff: { type: 'exponential', delay: 2000 } },
  inputSchema: [
    { name: 'tenantId', type: 'number', required: true },
    { name: 'siteId', type: 'number', required: true },
    { name: 'seq', type: 'number', required: true },
    { name: 'by', type: 'text' },
  ],
  outputSchema: [
    { name: 'outcome', type: 'text' },
    { name: 'version', type: 'text' },
    { name: 'durationMs', type: 'number' },
  ],
  handler: async ({ input, req }) => {
    const res = await publish(req.payload, {
      tenantId: input.tenantId,
      siteId: input.siteId,
      seq: input.seq,
      by: input.by ?? 'job',
    })
    if (res.outcome === 'busy') throw new Error(`Site ${input.siteId} is publishing; retry`)
    return { output: { outcome: res.outcome, version: res.version ?? null, durationMs: res.durationMs } }
  },
}
