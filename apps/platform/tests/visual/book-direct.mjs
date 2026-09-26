// Book direct (fix-later batch 9): the booking bar opens the hotel's engine with the dates, the
// reasons strip, room Book buttons, FAQ and Offers pages. Nothing is booked: the engine request is intercepted.
//   node tests/visual/book-direct.mjs <base-url> <out-dir> [site-slug]
import { chromium } from '@playwright/test'
const base = (process.argv[2] || 'http://localhost:3100').replace(/\/+$/, '')
const out = process.argv[3] || '.'
const slug = process.argv[4] || 'hotel-herse-dor'
const root = base.includes('localhost') || base.includes('edgeone') ? `${base}/s/${slug}` : base
const browser = await chromium.launch({ channel: 'chrome' })
const result = {}
try {
  for (const [name, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: name === 'mobile' ? 2 : 1 })
    let engineUrl = null
    await page.route('https://sky-eu1.clock-software.com/**', (r) => {
      engineUrl = r.request().url()
      return r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>engine</title><p>Booking engine (stub)</p>' })
    })
    await page.goto(root, { waitUntil: 'load' })
    await page.waitForTimeout(800)
    const strip = page.locator('.hh-cta-strip').first()
    result[`${name}StripVisible`] = await strip.isVisible()
    await strip.scrollIntoViewIfNeeded()
    await page.screenshot({ path: `${out}/book-direct-strip-${name}.jpg`, quality: 80 })
    // Dates two and four weeks ahead, 3 guests.
    const d = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)
    await page.fill('.hh-booking-bar input[name="arrival"]', d(14))
    await page.fill('.hh-booking-bar input[name="departure"]', d(16))
    await page.selectOption('.hh-booking-bar select[name="guests"]', '3')
    await Promise.all([page.waitForURL(/clock-software/, { timeout: 15000 }), page.click('.hh-booking-bar button[type="submit"]')])
    const u = page.url()
    result[`${name}Engine`] = u
    result[`${name}EngineOk`] = u.includes('#/hotel/12223?') && u.includes(`arrival=${d(14)}`) && u.includes(`departure=${d(16)}`) && u.includes('adults=3') && u.includes('submit=true') && u.includes('site_language=fr')
    void engineUrl
    await page.goto(`${root}/chambres`, { waitUntil: 'load' })
    const book = page.locator('.hh-room-book a').first()
    await book.scrollIntoViewIfNeeded()
    result[`${name}RoomBook`] = (await page.locator('.hh-room-book a').count()) >= 2
    await page.screenshot({ path: `${out}/book-direct-room-${name}.jpg`, quality: 80 })
    await page.goto(`${root}/faq`, { waitUntil: 'load' })
    result[`${name}Faq`] = (await page.locator('.hh-faq details').count()) >= 10
    await page.locator('.hh-faq summary').nth(3).click()
    await page.screenshot({ path: `${out}/book-direct-faq-${name}.jpg`, quality: 80, fullPage: name === 'desktop' })
    await page.goto(`${root}/offres`, { waitUntil: 'load' })
    await page.screenshot({ path: `${out}/book-direct-offers-${name}.jpg`, quality: 80 })
    await page.close()
  }
  const home = await (await fetch(root)).text()
  result.offersInMenu = /<a [^>]*href="[^"]*\/offres"[^>]*>Offres<\/a>/.test(home)
  result.faqInFooter = /href="[^"]*\/faq">FAQ<\/a>/.test(home)
} finally {
  await browser.close()
}
console.log(JSON.stringify(result, null, 1))
const ok = ['desktop', 'mobile'].every((n) => result[`${n}StripVisible`] && result[`${n}EngineOk`] && result[`${n}RoomBook`] && result[`${n}Faq`]) && result.offersInMenu && result.faqInFooter
if (!ok) process.exit(1)
