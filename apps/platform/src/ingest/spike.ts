/**
 * Ingest spike: turn a hotel's existing public website into an UNCONFIRMED fact base.
 *   tsx src/ingest/spike.ts https://www.example-hotel.com [--max 60]
 * Polite crawler: honours robots.txt, sitemap first, same host only, 1 request/second,
 * identifies itself. No LLM: deterministic extraction only (JSON-LD, meta, links, patterns),
 * so every fact carries the exact URL and method it came from. Output in .ingest/<host>/.
 */
import dns from 'node:dns'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import * as cheerio from 'cheerio'

const start = new URL(process.argv[2] || '')
const MAX = Number(process.argv[process.argv.indexOf('--max') + 1]) || 60
const UA = 'hh-ingest-spike/0.1 (+https://github.com/aminebelkou-creator/hh-hotel-CMS)'
const OUT = path.resolve('.ingest', start.host)
mkdirSync(OUT, { recursive: true })

type Fact = { key: string; value: string; source: string; method: string; confidence: number; status: 'unconfirmed' }
const facts: Fact[] = []
const add = (key: string, value: unknown, source: string, method: string, confidence: number) => {
  const v = String(value ?? '').replace(/\s+/g, ' ').trim()
  if (!v || v.length > 500) return
  if (facts.some((f) => f.key === key && f.value.toLowerCase() === v.toLowerCase())) return
  facts.push({ key, value: v, source, method, confidence, status: 'unconfirmed' })
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
// Many small hotel hosts publish an AAAA record that does not answer; prefer IPv4.
dns.setDefaultResultOrder('ipv4first')
const get = async (u: string, tries = 2): Promise<{ status: number; type: string; text: string; url: string }> => {
  try {
    const r = await fetch(u, {
      headers: { 'user-agent': UA, accept: 'text/html,application/xml;q=0.9,*/*;q=0.5' },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    })
    return { status: r.status, type: r.headers.get('content-type') || '', text: r.ok ? await r.text() : '', url: r.url }
  } catch (e) {
    if (tries > 1) return get(u, tries - 1)
    return { status: 0, type: '', text: '', url: `${u} (${(e as Error).message})` }
  }
}
const norm = (u: string) => {
  const x = new URL(u)
  x.hash = ''
  x.protocol = start.protocol
  return x.toString()
}

// 1. robots.txt and sitemaps
const robots = await get(new URL('/robots.txt', start).toString())
const disallow = [...robots.text.matchAll(/^Disallow:\s*(\S+)/gim)].map((m) => m[1]).filter(Boolean)
const allowed = (u: string) => !disallow.some((d) => new URL(u).pathname.startsWith(d))
const sitemaps = [...robots.text.matchAll(/^Sitemap:\s*(\S+)/gim)].map((m) => m[1])
if (!sitemaps.length) sitemaps.push(new URL('/sitemap.xml', start).toString())
const queue: string[] = []
const seenSitemaps = new Set<string>()
const readSitemap = async (u: string, depth = 0): Promise<void> => {
  if (depth > 2 || seenSitemaps.has(u)) return
  seenSitemaps.add(u)
  const s = await get(u)
  await sleep(1000)
  const locs = [...s.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1])
  for (const loc of locs) {
    if (/\.xml($|\?)/.test(loc)) await readSitemap(loc.replace(/^http:/, start.protocol), depth + 1)
    else if (new URL(loc).host === start.host) queue.push(norm(loc))
  }
}
for (const s of sitemaps) await readSitemap(s.replace(/^http:/, start.protocol))
queue.unshift(norm(start.toString()))

// 2. crawl
const BOOKING = /(d-edge|availpro|reservit|synxis|mews\.(com|li)|cloudbeds|siteminder|thebookingbutton|secure-hotel-booking|hotel-booking|booking-engine|webhotelier|guestcentric|simplebooking|bookassist|fastbooking|ihotelier|travelclick|staah|hotelrunner|beds24)/i
const AMENITIES: [string, RegExp][] = [
  ['wifi', /wi-?fi/i], ['air-conditioning', /climatis|air[- ]condition/i], ['breakfast', /petit[- ]d[ée]jeuner|breakfast/i],
  ['elevator', /ascenseur|elevator|lift\b/i], ['parking', /parking/i], ['pets', /animaux|pets?\b|chiens?/i],
  ['24h-reception', /r[ée]ception 24|24\s?h\s?\/\s?24|24[- ]hour/i], ['bar', /\bbar\b/i], ['safe', /coffre[- ]fort|safe\b/i],
  ['non-smoking', /non[- ]fumeur|non[- ]smoking/i], ['accessible', /pmr|accessib|wheelchair/i], ['family-rooms', /familiale|family room/i],
]
const pages: { url: string; status: number; title: string; lang: string; h1: string; words: number; jsonld: number; images: number }[] = []
const done = new Set<string>()
while (queue.length && pages.length < MAX) {
  const u = queue.shift()!
  if (done.has(u) || !allowed(u)) continue
  done.add(u)
  const r = await get(u)
  await sleep(1000)
  if (!r.type.includes('html') || !r.text) {
    pages.push({ url: u, status: r.status, title: '', lang: '', h1: '', words: 0, jsonld: 0, images: 0 })
    continue
  }
  const $ = cheerio.load(r.text)
  const text = $('body').text().replace(/\s+/g, ' ')
  const jsonld = $('script[type="application/ld+json"]').toArray().map((e) => $(e).text())
  pages.push({
    url: u, status: r.status, title: $('title').text().trim(), lang: $('html').attr('lang') || '',
    h1: $('h1').first().text().trim(), words: text.split(' ').length, jsonld: jsonld.length, images: $('img').length,
  })

  // 2a. structured data (highest confidence: the site states it in machine-readable form)
  for (const raw of jsonld) {
    let data: unknown
    try { data = JSON.parse(raw) } catch { continue }
    const nodes = ([] as Record<string, unknown>[]).concat(
      ...[data].flat().map((d) => ((d as { '@graph'?: unknown[] })['@graph'] as Record<string, unknown>[]) || [d as Record<string, unknown>]),
    )
    for (const n of nodes) {
      const types = [n['@type']].flat().map(String)
      if (!types.some((t) => /Hotel|Lodging|LocalBusiness|Organization|Restaurant/i.test(t))) continue
      const m = `json-ld:${types.join('|')}`
      add('business.name', n.name, u, m, 0.9)
      add('business.type', types.join(', '), u, m, 0.9)
      add('contact.phone', n.telephone, u, m, 0.9)
      add('contact.email', n.email, u, m, 0.9)
      const a = n.address as Record<string, string> | undefined
      if (a && typeof a === 'object') add('address', [a.streetAddress, a.postalCode, a.addressLocality, a.addressCountry].filter(Boolean).join(', '), u, m, 0.9)
      const g = n.geo as Record<string, string> | undefined
      if (g?.latitude) add('geo', `${g.latitude},${g.longitude}`, u, m, 0.9)
      add('rating.stars', (n.starRating as Record<string, string>)?.ratingValue, u, m, 0.9)
      add('policy.checkin', n.checkinTime, u, m, 0.9)
      add('policy.checkout', n.checkoutTime, u, m, 0.9)
      add('price.range', n.priceRange, u, m, 0.8)
      for (const s of [n.sameAs].flat().filter(Boolean)) add('profile.link', s, u, m, 0.9)
      const ar = n.aggregateRating as Record<string, string> | undefined
      if (ar?.ratingValue) add('reviews.aggregate', `${ar.ratingValue}/${ar.bestRating || 5} (${ar.reviewCount || ar.ratingCount || '?'} reviews)`, u, m, 0.7)
    }
  }
  // 2b. meta and links
  if (pages.length === 1) {
    add('site.name', $('meta[property="og:site_name"]').attr('content'), u, 'meta:og:site_name', 0.7)
    add('site.description', $('meta[name="description"]').attr('content'), u, 'meta:description', 0.6)
    add('site.language', $('html').attr('lang'), u, 'html@lang', 0.9)
    add('site.generator', $('meta[name="generator"]').first().attr('content'), u, 'meta:generator', 0.9)
  }
  $('link[rel="alternate"][hreflang]').each((_, e) => add('site.language', $(e).attr('hreflang'), u, 'link@hreflang', 0.8))
  $('a[href]').each((_, e) => {
    const href = $(e).attr('href') || ''
    if (href.startsWith('tel:')) add('contact.phone', decodeURIComponent(href.slice(4)), u, 'link:tel', 0.8)
    else if (href.startsWith('mailto:')) add('contact.email', href.slice(7).split('?')[0], u, 'link:mailto', 0.8)
    else if (BOOKING.test(href) && new URL(href, u).host !== start.host) add('booking.engine', new URL(href, u).host, u, 'link:booking-engine', 0.8)
    else if (/facebook\.com|instagram\.com|tripadvisor\.|linkedin\.com|x\.com|twitter\.com|youtube\.com/i.test(href)) add('profile.link', href.split('?')[0], u, 'link:social', 0.7)
    else if (/google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps/i.test(href)) add('profile.google-maps', href, u, 'link:maps', 0.7)
  })
  $('iframe[src]').each((_, e) => {
    const src = $(e).attr('src') || ''
    if (BOOKING.test(src)) add('booking.engine', new URL(src, u).host, u, 'iframe:booking-engine', 0.8)
  })
  // 2c. patterns in visible text (lowest confidence: needs the hotel's confirmation)
  const ci = text.match(/(arriv[ée]e|check[- ]?in)[^.]{0,40}?(\d{1,2})\s?[h:]\s?(\d{2})?/i)
  if (ci) add('policy.checkin', `${ci[2]}:${ci[3] || '00'}`, u, 'text:pattern', 0.5)
  const co = text.match(/(d[ée]part|check[- ]?out)[^.]{0,40}?(\d{1,2})\s?[h:]\s?(\d{2})?/i)
  if (co) add('policy.checkout', `${co[2]}:${co[3] || '00'}`, u, 'text:pattern', 0.5)
  for (const m of text.matchAll(/(?:\+33\s?\(0\)\s?|\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}/g)) add('contact.phone', m[0], u, 'text:pattern', 0.5)
  for (const m of text.matchAll(/[\w.+-]+@[\w-]+\.[\w.-]+/g)) if (!/\.(png|jpe?g|webp|svg)$/i.test(m[0])) add('contact.email', m[0], u, 'text:pattern', 0.5)
  $('script').each((_, e) => {
    const s = $(e).attr('src') || $(e).text().slice(0, 2000)
    const hit = s.match(BOOKING)
    if (hit) add('booking.engine', hit[0], u, 'script:booking-engine', 0.6)
  })
  const addr = text.match(/\d{1,4}(bis|ter)?,?\s(rue|avenue|boulevard|bd|place|quai|impasse)\s[^,.\d]{2,60},?\s?\d{5}\s?[A-ZÉ][a-zé-]+/i)
  if (addr) add('address', addr[0], u, 'text:pattern', 0.6)
  $('h1, h2, h3').each((_, e) => {
    const h = $(e).text().trim()
    if (/\b(chambre|room|suite)s?\b/i.test(h) && h.length < 80) add('room.name', h, u, 'heading:room', 0.4)
  })
  for (const [key, re] of AMENITIES) if (re.test(text)) add('amenity', key, u, 'text:keyword', 0.4)
}

// 3. write the fact base and a site audit
const byKey = facts.reduce<Record<string, Fact[]>>((m, f) => ((m[f.key] ??= []).push(f), m), {})
const conflicts = Object.entries(byKey).filter(
  ([k, v]) => ['business.name', 'contact.phone', 'address', 'policy.checkin', 'policy.checkout', 'rating.stars'].includes(k) && v.length > 1,
)
writeFileSync(path.join(OUT, 'facts.json'), JSON.stringify(facts, null, 2))
writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(pages, null, 2))
const audit = {
  host: start.host,
  crawledAt: new Date().toISOString(),
  pagesCrawled: pages.length,
  pagesQueuedFromSitemaps: done.size + queue.length,
  non200: pages.filter((p) => p.status !== 200).map((p) => `${p.status} ${p.url}`),
  missingTitle: pages.filter((p) => p.status === 200 && !p.title).length,
  missingH1: pages.filter((p) => p.status === 200 && !p.h1).length,
  pagesWithJsonLd: pages.filter((p) => p.jsonld > 0).length,
  thinPages: pages.filter((p) => p.status === 200 && p.words < 150).length,
  facts: facts.length,
  factsByKey: Object.fromEntries(Object.entries(byKey).map(([k, v]) => [k, v.length])),
  conflicts: conflicts.map(([k, v]) => ({ key: k, values: [...new Set(v.map((f) => f.value))] })),
}
writeFileSync(path.join(OUT, 'audit.json'), JSON.stringify(audit, null, 2))
console.log(JSON.stringify(audit, null, 2))
