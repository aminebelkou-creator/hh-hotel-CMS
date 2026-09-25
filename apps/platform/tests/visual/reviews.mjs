// Guest reviews section on the home page, desktop and phone.
//   node tests/visual/reviews.mjs <base-url> <out-dir> [site-slug]
import { chromium } from '@playwright/test'
const base = process.argv[2] || 'http://localhost:3100'
const out = process.argv[3] || '.'
const slug = process.argv[4] || 'hotel-herse-dor'
const browser = await chromium.launch({ channel: 'chrome' })
const report = []
try {
  for (const [w, suffix, path] of [[1280, 'desktop', ''], [390, 'mobile', ''], [1280, 'desktop-en', '/en']]) {
    const ctx = w < 500 ? { viewport: { width: w, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: w, height: 900 } }
    const page = await browser.newPage(ctx)
    await page.goto(`${base}/s/${slug}${path}`, { waitUntil: 'load', timeout: 90000 })
    // The hero with its booking bar, as first seen (full width on phones).
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${out}/hero-${suffix}.jpg`, type: 'jpeg', quality: 72, fullPage: false, scale: 'css' })
    const bar = await page.evaluate(() => { const b = document.querySelector('.hh-booking-bar'); return b ? Math.round(b.getBoundingClientRect().width) : 0 })
    const section = page.locator('section.hh-reviews').first()
    const found = await section.count()
    if (found) {
      await section.scrollIntoViewIfNeeded()
      await page.waitForTimeout(500)
      await section.screenshot({ path: `${out}/reviews-${suffix}.jpg`, type: 'jpeg', quality: 75, scale: 'css' })
    }
    report.push({ suffix, found, cards: await page.locator('.hh-review').count(), bookingBarWidth: bar, viewport: w })
    await page.close()
  }
} finally {
  await browser.close()
}
console.log(JSON.stringify(report))
