import { chromium } from '@playwright/test'
const base = process.argv[2] || 'http://localhost:3100'
const out = process.argv[3] || '.'
const shots = [
  ['home-fr', '/s/hotel-herse-dor', 1280],
  ['chambres-fr', '/s/hotel-herse-dor/chambres', 1280],
  ['services-en', '/s/hotel-herse-dor/en/services', 1280],
  ['quartier-fr', '/s/hotel-herse-dor/quartier', 1280],
  ['contact-fr', '/s/hotel-herse-dor/contact', 1280],
  ['home-mobile', '/s/hotel-herse-dor', 390],
]
const browser = await chromium.launch({ channel: 'chrome' })
const report = []
for (const [name, path, w] of shots) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`) })
  await page.goto(base + path, { waitUntil: 'networkidle', timeout: 60000 })
  // Scroll through the page so lazy images load before the full-page screenshot.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)) }
    window.scrollTo(0, 0)
  })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true })
  report.push({ name, errors })
  await page.close()
}
// Admin: log in as super-admin and check the dashboard renders.
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.goto(base + '/admin/login', { waitUntil: 'networkidle' })
const inputs = await page.locator('input').count()
if (process.env.SEED_PASSWORD) {
  await page.fill('input[name="email"]', 'super@example.test')
  await page.fill('input[name="password"]', process.env.SEED_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForTimeout(5000)
}
await page.screenshot({ path: `${out}/admin.png` })
report.push({ name: 'admin', loginInputs: inputs, url: page.url(), text: (await page.evaluate(() => document.body.innerText)).slice(0, 300) })
console.log(JSON.stringify(report, null, 1))
await browser.close()
