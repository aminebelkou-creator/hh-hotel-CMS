// Screenshots of one site in every template (design contract, docs/11).
//   SEED_PASSWORD=... node tests/visual/templates.mjs <base-url> <out-dir> [site-slug]
// Signs in as the super-admin, switches the site's template, publishes, screenshots, and
// finally puts the original template back and republishes.
import { chromium } from '@playwright/test'
const base = process.argv[2] || 'http://localhost:3100'
const out = process.argv[3] || '.'
const slug = process.argv[4] || 'hotel-herse-dor'
const pages = [
  ['home', '', 1280],
  ['home-mobile', '', 390],
  ['rooms', '/chambres', 1280],
  ['contact', '/contact', 1280],
]
const login = await (await fetch(`${base}/api/users/login`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'super@example.test', password: process.env.SEED_PASSWORD }),
})).json()
if (!login.token) throw new Error('login failed')
const auth = { authorization: `JWT ${login.token}`, 'content-type': 'application/json' }
const site = (await (await fetch(`${base}/api/sites?where[slug][equals]=${slug}&depth=0&limit=1`, { headers: auth })).json()).docs[0]
const original = site.template || 'maison'
const setTemplate = async (template) => {
  const r = await fetch(`${base}/api/sites/${site.id}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ template }) })
  if (!r.ok) throw new Error(`template ${template}: ${r.status}`)
  const p = await (await fetch(`${base}/api/sites/${site.id}/publish`, { method: 'POST', headers: auth })).json()
  if (p.outcome !== 'live') throw new Error(`publish ${template}: ${JSON.stringify(p)}`)
  return p.version
}
const browser = await chromium.launch({ channel: 'chrome' })
const report = []
try {
  for (const template of ['maison', 'atelier', 'soiree']) {
    const version = await setTemplate(template)
    for (const [name, path, w] of pages) {
      const page = await browser.newPage({ viewport: { width: w, height: 900 } })
      const errors = []
      page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`) })
      await page.goto(`${base}/s/${slug}${path}`, { waitUntil: 'load', timeout: 90000 })
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 100)) }
        window.scrollTo(0, 0)
      })
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {}) // the map iframe can keep the network busy
      // Lazy photos: load them all now, then wait until every image has loaded before the capture.
      await page.evaluate(async () => {
        for (const i of [...document.images]) {
          i.loading = 'eager'
          i.scrollIntoView({ block: 'center' })
          await i.decode().catch(() => {})
        }
        window.scrollTo(0, 0)
      })
      await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 45000 }).catch(() => {})
      await page.waitForTimeout(600)
      const fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family))
      const tpl = await page.evaluate(() => document.body.dataset.template)
      await page.screenshot({ path: `${out}/${template}-${name}.png`, fullPage: true })
      report.push({ template, version, name, tpl, fonts: [...new Set(fonts)], errors })
      await page.close()
    }
  }
  // The admin: template and brand fields on the site.
  const admin = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
  await admin.goto(`${base}/admin/login`, { waitUntil: 'networkidle' })
  await admin.fill('input[name="email"]', 'super@example.test')
  await admin.fill('input[name="password"]', process.env.SEED_PASSWORD)
  await admin.click('button[type="submit"]')
  await admin.waitForTimeout(4000)
  await admin.goto(`${base}/admin/collections/sites/${site.id}`, { waitUntil: 'networkidle' })
  await admin.waitForTimeout(2500)
  await admin.getByText('Brand', { exact: true }).first().scrollIntoViewIfNeeded().catch(() => {})
  await admin.mouse.wheel(0, -250)
  await admin.waitForTimeout(800)
  await admin.screenshot({ path: `${out}/admin-template-brand.png` })
  report.push({ name: 'admin-template-brand' })
} finally {
  await setTemplate(original)
  await browser.close()
}
console.log(JSON.stringify(report, null, 1))
