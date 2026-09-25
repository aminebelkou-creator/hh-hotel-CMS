// Quality gates: every template × the three seeded pages must pass axe (WCAG 2.2 AA), carry
// parseable structured data and stay under the page-weight budget (docs/11 §quality).
//   SEED_PASSWORD=... node tests/quality/gates.mjs <base-url> [site-slug]
// Signs in as the super-admin, switches the site's template, publishes, checks each page, and
// finally puts the original template back and republishes. Exit code 1 on any failure.
import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { gzipSync } from 'node:zlib'

const base = (process.argv[2] || process.env.PLATFORM_URL || 'http://localhost:3000').replace(/\/+$/, '')
const slug = process.argv[3] || 'site-10'
const templates = (process.env.GATE_TEMPLATES || 'maison,atelier,soiree').split(',')
// GATE_CHANNEL=canary runs the pages on the canary channel (the next template version, docs/11 §upgrades).
const channel = process.env.GATE_CHANNEL === 'canary' ? 'canary' : 'stable'
const pages = [
  ['home', ''],
  ['rooms', '/rooms'],
  ['contact', '/contact'],
]
// Budgets per page, in bytes as sent over the wire (text gzipped, fonts as-is), excluding photos,
// which come from the hotel's own uploads. Roughly what a 3G connection loads in three seconds.
const BUDGET = { html: 40_000, css: 20_000, js: 180_000, fonts: 200_000, total: 450_000, requests: 40 }

const login = await (await fetch(`${base}/api/users/login`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'super@example.test', password: process.env.SEED_PASSWORD }),
})).json()
if (!login.token) throw new Error('login failed')
const auth = { authorization: `JWT ${login.token}`, 'content-type': 'application/json' }
const site = (await (await fetch(`${base}/api/sites?where[slug][equals]=${slug}&depth=0&limit=1`, { headers: auth })).json()).docs[0]
if (!site) throw new Error(`site ${slug} not found`)
const original = site.template || 'maison'
const originalChannel = site.designChannel || 'stable'

const setTemplate = async (template, designChannel = channel) => {
  const r = await fetch(`${base}/api/sites/${site.id}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ template, designChannel }) })
  if (!r.ok) throw new Error(`template ${template}: ${r.status}`)
  const p = await (await fetch(`${base}/api/sites/${site.id}/publish`, { method: 'POST', headers: auth })).json()
  if (p.outcome !== 'live') throw new Error(`publish ${template}: ${JSON.stringify(p)}`)
  return p.version
}

const kind = (r) => {
  const t = (r.headers()['content-type'] || '').split(';')[0]
  const u = r.url()
  if (t.includes('text/html')) return 'html'
  if (t.includes('css')) return 'css'
  if (t.includes('javascript')) return 'js'
  if (t.includes('font') || /\.woff2?(\?|$)/.test(u)) return 'fonts'
  if (t.startsWith('image/')) return 'images'
  return 'other'
}

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined }) // PW_CHANNEL=chrome uses the installed Chrome
const failures = []
const rows = []
try {
  for (const template of templates) {
    const version = await setTemplate(template)
    for (const [name, path] of pages) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
      const page = await context.newPage()
      const weight = { html: 0, css: 0, js: 0, fonts: 0, images: 0, other: 0, total: 0, raw: 0, requests: 0 }
      const bad = []
      const pending = []
      page.on('response', (r) => {
        if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`)
        const k = kind(r)
        weight.requests += 1
        pending.push(r.body().then((b) => {
          const wire = ['html', 'css', 'js', 'other'].includes(k) ? gzipSync(b).length : b.length
          weight[k] += wire
          weight.total += wire
          weight.raw += b.length
        }).catch(() => {}))
      })
      const url = `${base}/s/${slug}${path}`
      await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 })
      await Promise.all(pending)
      const tpl = await page.evaluate(() => document.body.dataset.template)
      const canary = await page.evaluate(() => 'canary' in document.body.dataset)
      const label = `${template}/${name}${channel === 'canary' ? ' (canary)' : ''}`
      if (tpl !== template) failures.push(`${label}: body[data-template] is ${tpl}`)
      if (canary !== (channel === 'canary')) failures.push(`${label}: canary attribute ${canary ? 'present' : 'missing'}`)
      if (bad.length) failures.push(`${label}: failed requests ${bad.join(', ')}`)

      // 1. Accessibility: WCAG 2.0/2.1/2.2 A and AA, plus best practices that map to the contract.
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
      for (const v of axe.violations) {
        failures.push(`${label}: axe ${v.id} (${v.impact}) ${v.help} — ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)
      }

      // 2. Structured data: every JSON-LD script parses and declares a @type; home carries the Hotel, a FAQ its FAQPage.
      const ld = await page.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent))
      const types = []
      for (const raw of ld) {
        try {
          const j = JSON.parse(raw)
          for (const o of Array.isArray(j) ? j : [j]) {
            if (!o['@type']) failures.push(`${label}: JSON-LD without @type`)
            else types.push(o['@type'])
          }
        } catch (e) {
          failures.push(`${label}: JSON-LD does not parse (${e.message})`)
        }
      }
      if (name === 'home' && !types.includes('Hotel')) failures.push(`${label}: home without schema.org Hotel`)
      if (name === 'contact' && !types.includes('FAQPage')) failures.push(`${label}: FAQ block without FAQPage data`)

      // 3. Basics the contract promises: one h1, a lang attribute, a canonical link, a viewport meta.
      const basics = await page.evaluate(() => ({
        h1: document.querySelectorAll('h1').length,
        lang: document.documentElement.lang,
        canonical: document.querySelector('link[rel="canonical"]')?.href || '',
        viewport: document.querySelector('meta[name="viewport"]')?.content || '',
        skip: Boolean(document.querySelector('a[href="#main"], a.hh-skip')),
      }))
      if (basics.h1 !== 1) failures.push(`${label}: ${basics.h1} h1 elements`)
      if (!basics.lang) failures.push(`${label}: <html> has no lang`)
      if (!basics.canonical) failures.push(`${label}: no canonical link`)
      if (!basics.viewport) failures.push(`${label}: no viewport meta`)

      // 4. Page weight (photos excluded: they belong to the hotel, not the template).
      for (const k of ['html', 'css', 'js', 'fonts', 'requests']) {
        if (weight[k] > BUDGET[k]) failures.push(`${label}: ${k} ${weight[k]} over budget ${BUDGET[k]}`)
      }
      if (weight.total - weight.images > BUDGET.total) failures.push(`${label}: total (without images) ${weight.total - weight.images} over budget ${BUDGET.total}`)

      rows.push({ template, version, page: name, axe: axe.violations.length, ld: types.join('+'), h1: basics.h1, skip: basics.skip, ...weight })
      await context.close()
    }
  }
} finally {
  await setTemplate(original, originalChannel).catch((e) => console.error('restore failed', e))
  await browser.close()
}
console.table(rows)
if (failures.length) {
  console.error(`\n${failures.length} gate failure(s):`)
  for (const f of failures) console.error(' - ' + f)
  process.exit(1)
}
console.log(`\nAll gates passed for ${templates.length} templates × ${pages.length} pages (${channel}).`)
