/**
 * Polite crawler and deterministic extractor, as a library: the in-product ingest job
 * (src/jobs/ingestSite.ts) runs it in chunks, the CLI (spike.ts) runs it to the end.
 *
 * Honours robots.txt, reads sitemaps first, stays on the start host, one request per
 * second, identifies itself. No model here: every fact carries the exact URL and method it
 * came from, so the hotel can check it. The AI pass (src/ingest/extract-ai.ts) runs on the
 * page texts afterwards and only proposes; it never confirms.
 */
import dns from 'node:dns'
import * as cheerio from 'cheerio'
import type { RawFact } from './normalise'

export type CrawledPage = {
  url: string
  status: number
  title: string
  lang: string
  h1: string
  words: number
  jsonld: number
  images: number
  /** Headings in order, for the AI pass and for generation. */
  headings: string[]
  /** Visible text, whitespace-collapsed, capped (about a page of content). */
  text: string
}

export type CrawlState = {
  start: string
  host: string
  protocol: string
  disallow: string[]
  queue: string[]
  done: string[]
  pages: CrawledPage[]
  facts: RawFact[]
  /** Set once robots.txt and the sitemaps have been read. */
  seeded: boolean
}

const UA = 'hh-ingest/1.0 (+https://github.com/aminebelkou-creator/hh-hotel-CMS)'
export const TEXT_CAP = 8000
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
// Many small hotel hosts publish an AAAA record that does not answer; prefer IPv4.
dns.setDefaultResultOrder('ipv4first')

export type Fetched = { status: number; type: string; text: string; url: string }
export type Fetcher = (u: string) => Promise<Fetched>

export const httpFetch: Fetcher = (u) => fetchWithRetry(u, 2)
/** The fetcher the in-product ingest uses; tests swap it for an in-memory site. */
let defaultFetcher: Fetcher = httpFetch
export const currentFetcher = (): Fetcher => defaultFetcher
export const setFetcherForTests = (f: Fetcher | undefined) => {
  defaultFetcher = f ?? httpFetch
}
async function fetchWithRetry(u: string, tries: number): Promise<Fetched> {
  try {
    const r = await fetch(u, {
      headers: { 'user-agent': UA, accept: 'text/html,application/xml;q=0.9,*/*;q=0.5' },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    })
    return { status: r.status, type: r.headers.get('content-type') || '', text: r.ok ? await r.text() : '', url: r.url }
  } catch (e) {
    if (tries > 1) return fetchWithRetry(u, tries - 1)
    return { status: 0, type: '', text: '', url: `${u} (${(e as Error).message})` }
  }
}

const norm = (u: string, protocol: string) => {
  const x = new URL(u)
  x.hash = ''
  x.protocol = protocol
  return x.toString()
}

/** A public http(s) URL on a real host: no private networks, no credentials, no odd ports. */
export function isCrawlableUrl(raw: string): boolean {
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    return false
  }
  if (!/^https?:$/.test(u.protocol) || u.username || u.password) return false
  if (u.port && !['80', '443'].includes(u.port)) return false
  const h = u.hostname.toLowerCase()
  if (!h.includes('.') || h.endsWith('.local') || h.endsWith('.internal')) return false
  if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[?::1|fc|fd)/.test(h)) return false
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false
  return true
}

/** Read robots.txt and the sitemaps; the queue starts with the start page. */
export async function initCrawl(startUrl: string, get: Fetcher = currentFetcher()): Promise<CrawlState> {
  const start = new URL(startUrl)
  const state: CrawlState = {
    start: start.toString(),
    host: start.host,
    protocol: start.protocol,
    disallow: [],
    queue: [],
    done: [],
    pages: [],
    facts: [],
    seeded: false,
  }
  const robots = await get(new URL('/robots.txt', start).toString())
  state.disallow = [...robots.text.matchAll(/^Disallow:\s*(\S+)/gim)].map((m) => m[1]).filter((d) => d && d !== '/')
  const sitemaps = [...robots.text.matchAll(/^Sitemap:\s*(\S+)/gim)].map((m) => m[1])
  if (!sitemaps.length) sitemaps.push(new URL('/sitemap.xml', start).toString())
  const seen = new Set<string>()
  const readSitemap = async (u: string, depth = 0): Promise<void> => {
    if (depth > 2 || seen.has(u) || seen.size > 10) return
    seen.add(u)
    const s = await get(u)
    await sleep(300)
    const locs = [...s.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1])
    for (const loc of locs) {
      if (/\.xml($|\?)/.test(loc)) await readSitemap(loc.replace(/^http:/, start.protocol), depth + 1)
      else {
        try {
          if (new URL(loc).host === start.host) state.queue.push(norm(loc, start.protocol))
        } catch {
          /* skip malformed */
        }
      }
    }
  }
  for (const s of sitemaps) await readSitemap(s.replace(/^http:/, start.protocol))
  state.queue = [norm(start.toString(), start.protocol), ...state.queue.filter((q) => q !== norm(start.toString(), start.protocol))]
  state.seeded = true
  return state
}

const BOOKING = /(d-edge|availpro|reservit|synxis|mews\.(com|li)|cloudbeds|siteminder|thebookingbutton|secure-hotel-booking|hotel-booking|booking-engine|webhotelier|guestcentric|simplebooking|bookassist|fastbooking|ihotelier|travelclick|staah|hotelrunner|beds24)/i
const AMENITIES: [string, RegExp][] = [
  ['wifi', /wi-?fi/i], ['air-conditioning', /climatis|air[- ]condition/i], ['breakfast', /petit[- ]d[ée]jeuner|breakfast/i],
  ['elevator', /ascenseur|elevator|lift\b/i], ['parking', /parking/i], ['pets', /animaux|pets?\b|chiens?/i],
  ['24h-reception', /r[ée]ception 24|24\s?h\s?\/\s?24|24[- ]hour/i], ['bar', /\bbar\b/i], ['safe', /coffre[- ]fort|safe\b/i],
  ['non-smoking', /non[- ]fumeur|non[- ]smoking/i], ['accessible', /pmr|accessib|wheelchair/i], ['family-rooms', /familiale|family room/i],
]

/** Deterministic extraction from one HTML page. Pure: no network, no state. */
export function extractPage(html: string, u: string, opts: { first: boolean; host: string }): { page: CrawledPage; facts: RawFact[] } {
  const facts: RawFact[] = []
  const add = (key: string, value: unknown, method: string, confidence: number) => {
    const v = String(value ?? '').replace(/\s+/g, ' ').trim()
    if (!v || v.length > 500) return
    if (facts.some((f) => f.key === key && f.value.toLowerCase() === v.toLowerCase())) return
    facts.push({ key, value: v, source: u, method, confidence, status: 'unconfirmed' })
  }
  const $ = cheerio.load(html)
  $('script, style, noscript, svg, nav, footer, header').remove()
  const headings = $('h1, h2, h3').toArray().map((e) => $(e).text().replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 60)
  const body = $('main').length ? $('main') : $('body')
  const text = body.text().replace(/\s+/g, ' ').trim()
  const $$ = cheerio.load(html) // untouched copy for structured data and links
  const jsonld = $$('script[type="application/ld+json"]').toArray().map((e) => $$(e).text())
  const page: CrawledPage = {
    url: u,
    status: 200,
    title: $$('title').text().trim(),
    lang: $$('html').attr('lang') || '',
    h1: $$('h1').first().text().replace(/\s+/g, ' ').trim(),
    words: text ? text.split(' ').length : 0,
    jsonld: jsonld.length,
    images: $$('img').length,
    headings,
    text: text.slice(0, TEXT_CAP),
  }

  // 1. structured data (highest confidence: the site states it in machine-readable form)
  for (const raw of jsonld) {
    let data: unknown
    try {
      data = JSON.parse(raw)
    } catch {
      continue
    }
    const nodes = ([] as Record<string, unknown>[]).concat(
      ...[data].flat().map((d) => ((d as { '@graph'?: unknown[] })['@graph'] as Record<string, unknown>[]) || [d as Record<string, unknown>]),
    )
    for (const n of nodes) {
      if (!n || typeof n !== 'object') continue
      const types = [n['@type']].flat().map(String)
      if (!types.some((t) => /Hotel|Lodging|LocalBusiness|Organization|Restaurant/i.test(t))) continue
      const m = `json-ld:${types.join('|')}`
      add('business.name', n.name, m, 0.9)
      add('business.type', types.join(', '), m, 0.9)
      add('contact.phone', n.telephone, m, 0.9)
      add('contact.email', n.email, m, 0.9)
      const a = n.address as Record<string, string> | undefined
      if (a && typeof a === 'object') add('address', [a.streetAddress, a.postalCode, a.addressLocality, a.addressCountry].filter(Boolean).join(', '), m, 0.9)
      const g = n.geo as Record<string, string> | undefined
      if (g?.latitude && g?.longitude) {
        add('geo.lat', g.latitude, m, 0.9)
        add('geo.lon', g.longitude, m, 0.9)
      }
      add('rating.stars', (n.starRating as Record<string, string>)?.ratingValue, m, 0.9)
      add('policy.checkin', n.checkinTime, m, 0.9)
      add('policy.checkout', n.checkoutTime, m, 0.9)
      add('price.range', n.priceRange, m, 0.8)
      for (const s of [n.sameAs].flat().filter(Boolean)) add('profile.link', s, m, 0.9)
      const ar = n.aggregateRating as Record<string, string> | undefined
      if (ar?.ratingValue) add('reviews.aggregate', `${ar.ratingValue}/${ar.bestRating || 5} (${ar.reviewCount || ar.ratingCount || '?'} reviews)`, m, 0.7)
    }
  }
  // 2. meta and links
  if (opts.first) {
    add('site.name', $$('meta[property="og:site_name"]').attr('content'), 'meta:og:site_name', 0.7)
    add('site.description', $$('meta[name="description"]').attr('content'), 'meta:description', 0.6)
    add('site.language', $$('html').attr('lang'), 'html@lang', 0.9)
    add('site.generator', $$('meta[name="generator"]').first().attr('content'), 'meta:generator', 0.9)
    const logo = $$('link[rel*="icon"]').first().attr('href') || $$('img[src*="logo" i], img[alt*="logo" i]').first().attr('src')
    if (logo) {
      try {
        add('site.logo', new URL(logo, u).toString(), 'link:logo', 0.5)
      } catch {
        /* ignore */
      }
    }
  }
  $$('link[rel="alternate"][hreflang]').each((_, e) => add('site.language', $$(e).attr('hreflang'), 'link@hreflang', 0.8))
  $$('a[href]').each((_, e) => {
    const href = $$(e).attr('href') || ''
    try {
      if (href.startsWith('tel:')) add('contact.phone', decodeURIComponent(href.slice(4)), 'link:tel', 0.8)
      else if (href.startsWith('mailto:')) add('contact.email', href.slice(7).split('?')[0], 'link:mailto', 0.8)
      else if (BOOKING.test(href) && new URL(href, u).host !== opts.host) add('booking.engine', new URL(href, u).host, 'link:booking-engine', 0.8)
      else if (/facebook\.com|instagram\.com|tripadvisor\.|linkedin\.com|x\.com|twitter\.com|youtube\.com/i.test(href)) add('profile.link', href.split('?')[0], 'link:social', 0.7)
      else if (/google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps/i.test(href)) add('profile.google-maps', href, 'link:maps', 0.7)
    } catch {
      /* malformed href */
    }
  })
  $$('iframe[src]').each((_, e) => {
    const src = $$(e).attr('src') || ''
    try {
      if (BOOKING.test(src)) add('booking.engine', new URL(src, u).host, 'iframe:booking-engine', 0.8)
    } catch {
      /* ignore */
    }
  })
  // 3. patterns in visible text (lowest confidence: needs the hotel's confirmation)
  const ci = text.match(/(arriv[ée]e|check[- ]?in)[^.]{0,40}?(\d{1,2})\s?[h:]\s?(\d{2})?/i)
  if (ci) add('policy.checkin', `${ci[2]}:${ci[3] || '00'}`, 'text:pattern', 0.5)
  const co = text.match(/(d[ée]part|check[- ]?out)[^.]{0,40}?(\d{1,2})\s?[h:]\s?(\d{2})?/i)
  if (co) add('policy.checkout', `${co[2]}:${co[3] || '00'}`, 'text:pattern', 0.5)
  for (const m of text.matchAll(/(?:\+33\s?\(0\)\s?|\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}/g)) add('contact.phone', m[0], 'text:pattern', 0.5)
  for (const m of text.matchAll(/[\w.+-]+@[\w-]+\.[\w.-]+/g)) if (!/\.(png|jpe?g|webp|svg)$/i.test(m[0])) add('contact.email', m[0], 'text:pattern', 0.5)
  $$('script').each((_, e) => {
    const s = $$(e).attr('src') || $$(e).text().slice(0, 2000)
    const hit = s.match(BOOKING)
    if (hit) add('booking.engine', hit[0], 'script:booking-engine', 0.6)
  })
  const addr = text.match(/\d{1,4}(bis|ter)?,?\s(rue|avenue|boulevard|bd|place|quai|impasse)\s[^,.\d]{2,60},?\s?\d{5}\s?[A-ZÉ][a-zé-]+/i)
  if (addr) add('address', addr[0], 'text:pattern', 0.6)
  for (const h of headings) if (/\b(chambre|room|suite)s?\b/i.test(h) && h.length < 80) add('room.name', h, 'heading:room', 0.4)
  for (const [key, re] of AMENITIES) if (re.test(text)) add('amenity', key, 'text:keyword', 0.4)
  return { page, facts }
}

/** Crawl until `maxPages` more pages are done or `budgetMs` is spent; returns what was added. */
export async function crawlChunk(
  state: CrawlState,
  opts: { maxPages: number; budgetMs: number; delayMs?: number; maxTotal?: number },
  get: Fetcher = currentFetcher(),
): Promise<{ pages: CrawledPage[]; facts: RawFact[] }> {
  const t0 = Date.now()
  const added = { pages: [] as CrawledPage[], facts: [] as RawFact[] }
  const allowed = (u: string) => !state.disallow.some((d) => new URL(u).pathname.startsWith(d))
  const doneSet = new Set(state.done)
  const maxTotal = opts.maxTotal ?? Infinity
  while (state.queue.length && added.pages.length < opts.maxPages && state.pages.length < maxTotal && Date.now() - t0 < opts.budgetMs) {
    const u = state.queue.shift()!
    if (doneSet.has(u) || !allowed(u)) continue
    doneSet.add(u)
    state.done.push(u)
    const r = await get(u)
    await sleep(opts.delayMs ?? 1000)
    if (!r.type.includes('html') || !r.text) {
      const page: CrawledPage = { url: u, status: r.status, title: '', lang: '', h1: '', words: 0, jsonld: 0, images: 0, headings: [], text: '' }
      state.pages.push(page)
      added.pages.push(page)
      continue
    }
    const { page, facts } = extractPage(r.text, u, { first: state.pages.length === 0, host: state.host })
    page.status = r.status
    state.pages.push(page)
    added.pages.push(page)
    for (const f of facts) {
      if (state.facts.some((x) => x.key === f.key && x.value.toLowerCase() === f.value.toLowerCase())) continue
      state.facts.push(f)
      added.facts.push(f)
    }
    // Follow same-host links found on the page (sitemaps may be missing or stale).
    const $ = cheerio.load(r.text)
    $('a[href]').each((_, e) => {
      const href = $(e).attr('href') || ''
      if (/^(mailto:|tel:|javascript:|#)/i.test(href)) return
      try {
        const x = new URL(href, u)
        if (x.host !== state.host || !/^https?:$/.test(x.protocol)) return
        if (/\.(pdf|jpe?g|png|gif|webp|svg|zip|mp4|css|js)($|\?)/i.test(x.pathname)) return
        const n = norm(x.toString(), state.protocol)
        if (!doneSet.has(n) && !state.queue.includes(n) && state.queue.length < 500) state.queue.push(n)
      } catch {
        /* skip */
      }
    })
  }
  return added
}

/** A site audit from the crawl, for the report and the review screen. */
export function auditOf(state: CrawlState) {
  const byKey = state.facts.reduce<Record<string, number>>((m, f) => ((m[f.key] = (m[f.key] ?? 0) + 1), m), {})
  const ok = state.pages.filter((p) => p.status === 200)
  return {
    host: state.host,
    pagesCrawled: state.pages.length,
    pagesLeft: state.queue.length,
    non200: state.pages.filter((p) => p.status !== 200).map((p) => `${p.status} ${p.url}`).slice(0, 20),
    missingTitle: ok.filter((p) => !p.title).length,
    missingH1: ok.filter((p) => !p.h1).length,
    pagesWithJsonLd: ok.filter((p) => p.jsonld > 0).length,
    thinPages: ok.filter((p) => p.words < 150).length,
    facts: state.facts.length,
    factsByKey: byKey,
  }
}
