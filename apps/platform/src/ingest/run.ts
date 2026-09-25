/**
 * In-product ingest: run one chunk of a crawl for (tenantId, crawlId), write the facts it
 * found into the tenant's fact base, and save the crawler state for the next chunk.
 *
 * Runs after an endpoint has checked the caller's access to the site (endpoints.ts), with the
 * tenant carried explicitly; every query filters on it (jobs pattern, CLAUDE.md gotcha 17).
 */
import type { Payload } from 'payload'
import { auditOf, crawlChunk, initCrawl, isCrawlableUrl, type CrawlState } from './crawl'
import { proposeFactsWithAi } from './extract-ai'
import { upsertFact } from './facts'
import { normaliseFacts } from './normalise'

/** Pages per request and the time budget: well under the host's 120 s function limit. */
export const CHUNK = { maxPages: 8, budgetMs: 30000, delayMs: 700 }

export type ChunkResult = {
  status: 'running' | 'done' | 'failed'
  pagesCrawled: number
  pagesLeft: number
  factsFound: number
  factsNew: number
  error?: string
}

export async function startCrawl(payload: Payload, args: { tenantId: number; siteId: number; url: string; maxPages?: number; by: string }) {
  if (!isCrawlableUrl(args.url)) throw new Error('Not a public http(s) website address')
  return payload.create({
    collection: 'crawls',
    data: {
      tenant: args.tenantId,
      site: args.siteId,
      startUrl: args.url,
      status: 'queued',
      maxPages: Math.min(200, Math.max(1, args.maxPages ?? 40)),
      startedBy: args.by,
      log: `${new Date().toISOString()} queued by ${args.by}\n`,
    },
    overrideAccess: true,
  })
}

export async function runCrawlChunk(payload: Payload, args: { tenantId: number; crawlId: number }, chunk = CHUNK): Promise<ChunkResult> {
  const crawl = (
    await payload.find({ collection: 'crawls', where: { and: [{ id: { equals: args.crawlId } }, { tenant: { equals: args.tenantId } }] }, limit: 1, overrideAccess: true })
  ).docs[0]
  if (!crawl) throw new Error(`Crawl ${args.crawlId} not found in tenant ${args.tenantId}`)
  if (crawl.status === 'done' || crawl.status === 'failed') {
    return { status: crawl.status, pagesCrawled: crawl.pagesCrawled ?? 0, pagesLeft: crawl.pagesLeft ?? 0, factsFound: crawl.factsFound ?? 0, factsNew: crawl.factsNew ?? 0 }
  }
  const siteId = Number(typeof crawl.site === 'object' && crawl.site ? crawl.site.id : crawl.site)
  let log = crawl.log ?? ''
  const line = (s: string) => (log += `${new Date().toISOString()} ${s}\n`)
  try {
    let state = (crawl.state as CrawlState | null) ?? null
    if (!state?.seeded) {
      state = await initCrawl(crawl.startUrl)
      line(`robots and sitemaps read: ${state.queue.length} urls queued, ${state.disallow.length} disallow rules`)
    }
    const added = await crawlChunk(state, { ...chunk, maxTotal: crawl.maxPages ?? 40 })
    // Write the new sightings as facts now, so the review screen fills while the crawl runs.
    let factsNew = crawl.factsNew ?? 0
    let factsFound = crawl.factsFound ?? 0
    for (const f of normaliseFacts(added.facts)) {
      const r = await upsertFact(payload, args.tenantId, siteId, f)
      factsFound += 1
      if (r === 'created') factsNew += 1
    }
    line(`chunk: ${added.pages.length} pages, ${added.facts.length} sightings; total ${state.pages.length} pages, ${state.queue.length} left`)
    const finished = state.queue.length === 0 || state.pages.length >= (crawl.maxPages ?? 40)
    let aiPass: unknown = crawl.aiPass ?? null
    if (finished) {
      const ai = await proposeFactsWithAi(state.pages)
      if (ai.used) {
        let n = 0
        for (const f of normaliseFacts(ai.facts)) {
          const r = await upsertFact(payload, args.tenantId, siteId, f)
          factsFound += 1
          if (r === 'created') {
            factsNew += 1
            n += 1
          }
        }
        aiPass = { used: true, model: ai.model, pagesSent: ai.pagesSent, proposed: ai.facts.length, new: n }
        line(`model ${ai.model} proposed ${ai.facts.length} facts from ${ai.pagesSent} pages (${n} new)`)
      } else {
        aiPass = { used: false, reason: 'no model configured (AI_PROVIDER)' }
        line('no model configured: deterministic extraction only')
      }
      line(`done: ${state.pages.length} pages, ${factsFound} facts (${factsNew} new)`)
    }
    // Keep the state small enough for a JSON column: page texts are needed by generation, keep them.
    const stored: CrawlState = { ...state, facts: state.facts.slice(-2000) }
    await payload.update({
      collection: 'crawls',
      id: crawl.id,
      data: {
        status: finished ? 'done' : 'running',
        pagesCrawled: state.pages.length,
        pagesLeft: state.queue.length,
        factsFound,
        factsNew,
        audit: auditOf(state),
        aiPass: aiPass as Record<string, unknown>,
        state: stored as unknown as Record<string, unknown>,
        log,
        finishedAt: finished ? new Date().toISOString() : undefined,
      },
      overrideAccess: true,
    })
    return { status: finished ? 'done' : 'running', pagesCrawled: state.pages.length, pagesLeft: state.queue.length, factsFound, factsNew }
  } catch (e) {
    const msg = (e as Error).message
    line(`failed: ${msg}`)
    await payload.update({ collection: 'crawls', id: crawl.id, data: { status: 'failed', log, finishedAt: new Date().toISOString() }, overrideAccess: true })
    return { status: 'failed', pagesCrawled: crawl.pagesCrawled ?? 0, pagesLeft: crawl.pagesLeft ?? 0, factsFound: crawl.factsFound ?? 0, factsNew: crawl.factsNew ?? 0, error: msg }
  }
}
