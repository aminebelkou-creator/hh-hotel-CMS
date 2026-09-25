// Nightly operated-service run (Phase 4): the platform's own checks for every live site, then
// axe (WCAG 2.2 AA) on each live home page in a real browser, recorded as issues per hotel.
//   HEALTH_TOKEN=... node tests/quality/nightly.mjs https://hh-platform.edgeone.dev
// Never publishes, never changes content: it only writes issues (source "nightly-axe").
import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const base = (process.argv[2] || process.env.LIVE_BASE || 'https://hh-platform.edgeone.dev').replace(/\/+$/, '')
const token = process.env.HEALTH_TOKEN
if (!token) throw new Error('HEALTH_TOKEN missing')
const headers = { 'content-type': 'application/json', 'x-health-token': token }

// 1. Platform checks, five sites per request (each request stays short on the host).
const slugs = []
let offset = 0
for (;;) {
  const r = await fetch(`${base}/api/health/run`, { method: 'POST', headers, body: JSON.stringify({ limit: 5, offset }) })
  if (!r.ok) throw new Error(`health/run ${r.status}: ${await r.text()}`)
  const j = await r.json()
  for (const s of j.results) {
    slugs.push(s.slug)
    console.log(`${s.slug}: ${s.error ?? `${s.findings} findings, ${s.opened} new, ${s.reopened} reopened, ${s.resolved} resolved${s.skipped ? ` (${s.skipped})` : ''}`}`)
  }
  offset += j.limit
  if (offset >= j.total) break
}

// 2. Accessibility on each live home page (no template switching on customer sites).
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined })
let failures = 0
try {
  for (const slug of slugs) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    const url = `${base}/s/${slug}`
    const findings = []
    try {
      const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
      if (!res || res.status() >= 400) findings.push({ kind: 'uptime', severity: 'error', title: `The home page answered ${res?.status() ?? 'nothing'}`, url, fingerprint: 'axe:uptime' })
      else {
        const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
        for (const v of axe.violations) {
          findings.push({ kind: 'accessibility', severity: v.impact === 'critical' || v.impact === 'serious' ? 'error' : 'warning', title: `Accessibility: ${v.help}`, detail: `${v.description}\n${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join('\n')}\n${v.helpUrl}`, url, fingerprint: `axe:${v.id}` })
        }
      }
    } catch (e) {
      findings.push({ kind: 'uptime', severity: 'error', title: `The home page could not be loaded (${e.message.slice(0, 80)})`, url, fingerprint: 'axe:uptime' })
    }
    await page.close()
    const r = await fetch(`${base}/api/health/report`, { method: 'POST', headers, body: JSON.stringify({ site: slug, source: 'nightly-axe', findings }) })
    const j = await r.json().catch(() => ({}))
    console.log(`${slug}: axe ${findings.length} finding(s) → ${r.ok ? `${j.opened} new, ${j.resolved} resolved` : `report failed ${r.status}`}`)
    if (!r.ok) failures++
  }
} finally {
  await browser.close()
}
if (failures) process.exit(1)
