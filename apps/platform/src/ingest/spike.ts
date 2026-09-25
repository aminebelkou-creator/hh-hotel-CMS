/**
 * Ingest CLI: turn a hotel's existing public website into an UNCONFIRMED fact base on disk.
 *   tsx src/ingest/spike.ts https://www.example-hotel.com [--max 60]
 * Same crawler and extractor as the in-product import (src/ingest/crawl.ts); output in
 * .ingest/<host>/ for src/ingest/import-facts.ts.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { auditOf, crawlChunk, initCrawl } from './crawl'

const start = process.argv[2] || ''
if (!start) throw new Error('Usage: spike.ts <url> [--max N]')
const MAX = Number(process.argv[process.argv.indexOf('--max') + 1]) || 60
const state = await initCrawl(start)
const OUT = path.resolve('.ingest', state.host)
mkdirSync(OUT, { recursive: true })
while (state.queue.length && state.pages.length < MAX) {
  await crawlChunk(state, { maxPages: 10, budgetMs: 10 * 60 * 1000, maxTotal: MAX })
  console.error(`${state.pages.length} pages, ${state.facts.length} sightings, ${state.queue.length} queued`)
}
writeFileSync(path.join(OUT, 'facts.json'), JSON.stringify(state.facts, null, 2))
writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(state.pages.map(({ text: _t, ...p }) => p), null, 2))
const audit = { ...auditOf(state), crawledAt: new Date().toISOString() }
writeFileSync(path.join(OUT, 'audit.json'), JSON.stringify(audit, null, 2))
console.log(JSON.stringify(audit, null, 2))
