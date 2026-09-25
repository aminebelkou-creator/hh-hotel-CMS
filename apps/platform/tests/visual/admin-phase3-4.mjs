// Screenshots of the Phase 3–4 admin: dashboard (hotel and fleet), fact review, site panels.
//   SEED_PASSWORD=... HH_OWNER_PASSWORD=... node tests/visual/admin-phase3-4.mjs <base-url> <out-dir>
import { chromium } from '@playwright/test'
const base = process.argv[2] || 'http://localhost:3100'
const out = process.argv[3] || '.'
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined })
const login = async (email, password) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(`${base}/admin/login`, { waitUntil: 'networkidle' })
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL((u) => /\/admin\/?$/.test(u.pathname), { timeout: 30000 })
  await page.waitForLoadState('networkidle')
  return page
}
const shot = async (page, name, path, full = true) => {
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: full })
  console.log(`${name}: ${page.url()}`)
}
// Owner of customer zero.
const owner = await login('proprietaire@hotel-herse-dor.demo', process.env.HH_OWNER_PASSWORD)
await shot(owner, 'admin-dashboard-hotel', '/admin')
const tok = (await (await fetch(`${base}/api/users/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'proprietaire@hotel-herse-dor.demo', password: process.env.HH_OWNER_PASSWORD }) })).json()).token
const siteId = (await (await fetch(`${base}/api/sites?limit=1&depth=0`, { headers: { authorization: `JWT ${tok}` } })).json()).docs[0].id
await shot(owner, 'admin-review-facts', `/admin/review/${siteId}`)
await shot(owner, 'admin-site-panels', `/admin/collections/sites/${siteId}`)
await shot(owner, 'admin-issues', '/admin/collections/issues')
await owner.context().close()
// Our team: the fleet.
const admin = await login('super@example.test', process.env.SEED_PASSWORD)
await shot(admin, 'admin-dashboard-fleet', '/admin')
await admin.context().close()
await browser.close()
