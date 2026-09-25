// Publish with unsaved site settings: the panel saves them first, then publishes (session 15).
//   SEED_PASSWORD=... node tests/visual/publish-guard.mjs <base-url> <out-dir> [site-slug]
import { chromium } from '@playwright/test'
const base = process.argv[2] || 'http://localhost:3100'
const out = process.argv[3] || '.'
const slug = process.argv[4] || 'site-10'
const login = await (await fetch(`${base}/api/users/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'super@example.test', password: process.env.SEED_PASSWORD }) })).json()
const auth = { authorization: `JWT ${login.token}`, 'content-type': 'application/json' }
const site = (await (await fetch(`${base}/api/sites?where[slug][equals]=${slug}&depth=0&limit=1`, { headers: auth })).json()).docs[0]
const original = site.brandName ?? ''
const edited = `Guard test ${Date.now() % 100000}`
const browser = await chromium.launch({ channel: 'chrome' })
const result = {}
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
  await page.goto(`${base}/admin/login`, { waitUntil: 'networkidle' })
  await page.fill('input[name="email"]', 'super@example.test')
  await page.fill('input[name="password"]', process.env.SEED_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/admin(?!\/login)/, { timeout: 30000 })
  await page.goto(`${base}/admin/collections/sites/${site.id}`, { waitUntil: 'networkidle' })
  await page.fill('#field-brandName', edited)
  await page.waitForTimeout(400)
  result.noteShown = await page.getByText('Unsaved changes: Publish site saves them first.').isVisible()
  await page.screenshot({ path: `${out}/publish-guard-before.png` })
  await page.getByRole('button', { name: 'Publish site' }).click()
  await page.getByText(/Published r\d+ in .* \(your changes were saved first\)/).waitFor({ timeout: 60000 })
  await page.screenshot({ path: `${out}/publish-guard-after.png` })
  const stored = (await (await fetch(`${base}/api/sites/${site.id}?depth=0`, { headers: auth })).json()).brandName
  const html = await (await fetch(`${base}/s/${slug}`)).text()
  result.saved = stored === edited
  result.live = html.includes(edited)
} finally {
  await fetch(`${base}/api/sites/${site.id}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ brandName: original || null }) })
  await fetch(`${base}/api/sites/${site.id}/publish`, { method: 'POST', headers: auth })
  await browser.close()
}
console.log(JSON.stringify(result))
if (!result.noteShown || !result.saved || !result.live) process.exit(1)
