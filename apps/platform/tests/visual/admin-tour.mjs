// Screenshots of the admin as a hotel owner sees it (dashboard, site settings, a page, lists, facts).
//   SEED_PASSWORD=... node tests/visual/admin-tour.mjs <base-url> <out-dir> [email] [prefix]
import { chromium } from '@playwright/test'
const base = (process.argv[2] || 'http://localhost:3100').replace(/\/+$/, '')
const out = process.argv[3] || '.'
const email = process.argv[4] || 'super@example.test'
const prefix = process.argv[5] || 'admin'
const password = process.env.ADMIN_PASSWORD || process.env.SEED_PASSWORD
const browser = await chromium.launch({ channel: 'chrome' })
const shots = []
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.goto(`${base}/admin/login`, { waitUntil: 'networkidle' })
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/admin(?!\/login)/, { timeout: 30000 })
  const login = await (await fetch(`${base}/api/users/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) })).json()
  const auth = { authorization: `JWT ${login.token}` }
  const site = (await (await fetch(`${base}/api/sites?where[slug][equals]=${process.env.SITE || 'hotel-herse-dor'}&depth=0&limit=1`, { headers: auth })).json()).docs[0]
  const pg = site ? (await (await fetch(`${base}/api/pages?where[site][equals]=${site.id}&where[slug][equals]=home&depth=0&limit=1`, { headers: auth })).json()).docs[0] : null
  const views = [
    ['dashboard', '/admin'],
    ['site', site ? `/admin/collections/sites/${site.id}` : null],
    ['pages', '/admin/collections/pages'],
    ['page', pg ? `/admin/collections/pages/${pg.id}` : null],
    ['facts', '/admin/collections/facts'],
    ['posts', '/admin/collections/posts'],
    ['rooms', '/admin/collections/rooms'],
  ]
  for (const [name, path] of views) {
    if (!path) continue
    await page.goto(`${base}${path}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(700)
    const file = `${out}/${prefix}-${name}.png`
    await page.screenshot({ path: file, fullPage: name === 'dashboard' || name === 'site' })
    shots.push(file)
    if (name === 'site') {
      for (const tab of ['Look', 'Booking']) {
        await page.getByRole('button', { name: tab, exact: true }).click()
        await page.waitForTimeout(500)
        const f2 = `${out}/${prefix}-site-${tab.toLowerCase()}.png`
        await page.screenshot({ path: f2, fullPage: true })
        shots.push(f2)
      }
    }
  }
  // The menu, opened.
  await page.goto(`${base}/admin`, { waitUntil: 'networkidle' })
  const burger = page.locator('.nav-toggler, button[aria-label*="menu" i]').first()
  if (await burger.count()) {
    await burger.click()
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${out}/${prefix}-menu.png` })
    shots.push(`${out}/${prefix}-menu.png`)
  }
  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await m.context().addCookies(await page.context().cookies())
  await m.goto(`${base}/admin`, { waitUntil: 'networkidle' })
  await m.screenshot({ path: `${out}/${prefix}-dashboard-mobile.png`, fullPage: true })
  shots.push(`${out}/${prefix}-dashboard-mobile.png`)
} finally {
  await browser.close()
}
console.log(shots.join('\n'))
