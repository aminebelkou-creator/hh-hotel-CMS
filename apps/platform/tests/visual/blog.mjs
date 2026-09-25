// Blog screenshots: the home page's latest posts, the blog page and one post, desktop and phone.
//   node tests/visual/blog.mjs <base-url> <out-dir> [site-slug] [post-slug]
import { chromium } from '@playwright/test'
const base = process.argv[2] || 'http://localhost:3100'
const out = process.argv[3] || '.'
const slug = process.argv[4] || 'hotel-herse-dor'
const post = process.argv[5] || 'le-marais-a-pied'
const browser = await chromium.launch({ channel: 'chrome' })
const report = []
const settle = async (page) => {
  await page.evaluate(async () => {
    for (const i of [...document.images]) { i.loading = 'eager'; i.scrollIntoView({ block: 'center' }); await i.decode().catch(() => {}) }
    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(700)
}
try {
  for (const [w, suffix] of [[1280, 'desktop'], [390, 'mobile']]) {
    const ctx = w < 500 ? { viewport: { width: w, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: w, height: 900 } }
    const page = await browser.newPage(ctx)
    const errors = []
    page.on('pageerror', (e) => errors.push(String(e)))
    page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`) })
    await page.goto(`${base}/s/${slug}`, { waitUntil: 'load', timeout: 90000 })
    await settle(page)
    const news = page.locator('section.hh-news').first()
    if (await news.count()) await news.screenshot({ path: `${out}/blog-home-${suffix}.jpg`, type: 'jpeg', quality: 72, scale: 'css' })
    await page.goto(`${base}/s/${slug}/blog`, { waitUntil: 'load', timeout: 90000 })
    await settle(page)
    await page.screenshot({ path: `${out}/blog-list-${suffix}.jpg`, type: 'jpeg', quality: 72, fullPage: true, scale: 'css' })
    await page.goto(`${base}/s/${slug}/blog/${post}`, { waitUntil: 'load', timeout: 90000 })
    await settle(page)
    await page.screenshot({ path: `${out}/blog-post-${suffix}.jpg`, type: 'jpeg', quality: 72, fullPage: true, scale: 'css' })
    const distorted = await page.evaluate(() => [...document.querySelectorAll('#main img')].map((i) => i.getBoundingClientRect()).filter((r) => r.width > 40 && (r.height / r.width > 2.2 || r.height / r.width < 0.25)).length)
    report.push({ w, errors, distorted })
    await page.close()
  }
} finally {
  await browser.close()
}
console.log(JSON.stringify(report))
