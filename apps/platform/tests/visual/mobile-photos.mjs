// Photos on a phone: no photo drawn at a shape its box was not meant to have, and viewable photos
// open in the lightbox. Run after any image or CSS change (the session-15 regression: the
// width/height attributes fixed the rendered height on phones).
//   node tests/visual/mobile-photos.mjs <base-url> [site-slug] [path ...]
import { chromium } from '@playwright/test'
const base = process.argv[2] || 'http://localhost:3100'
const slug = process.argv[3] || 'hotel-herse-dor'
const paths = process.argv.slice(4).length ? process.argv.slice(4) : ['', '/chambres', '/galerie']
const browser = await chromium.launch({ channel: 'chrome' })
const problems = []
const report = []
try {
  for (const path of paths) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true })
    const res = await page.goto(`${base}/s/${slug}${path}`, { waitUntil: 'load', timeout: 90000 })
    if (!res || res.status() >= 400) { report.push({ path, status: res?.status() }); await page.close(); continue }
    const template = await page.evaluate(() => document.body.dataset.template)
    // Every content photo: the drawn box must not be a sliver or a tower (object-fit covers the rest).
    // Banners, bands, heroes and the CTA are wide backgrounds on purpose: not checked.
    const boxes = await page.evaluate(() => [...document.querySelectorAll('#main img')].filter((i) => !i.closest('.hh-banner, .hh-media-band, .hh-hero, .hh-cta, .hh-map')).map((i) => {
      const r = i.getBoundingClientRect()
      return { src: i.currentSrc.split('/').pop(), cls: i.parentElement?.className || i.closest('section')?.className, w: Math.round(r.width), h: Math.round(r.height) }
    }).filter((b) => b.w > 0 && b.h > 0))
    for (const b of boxes) {
      const ratio = b.h / b.w
      if (b.w > 40 && (ratio > 2.2 || ratio < 0.25)) problems.push(`${path || '/'} ${template}: ${b.cls} ${b.w}x${b.h}`)
    }
    // Lightbox: the first viewable photo opens the dialog with its full-size file.
    const links = await page.locator('a[data-lightbox]').count()
    let opened = null
    if (links) {
      await page.locator('a[data-lightbox]').first().scrollIntoViewIfNeeded()
      await page.waitForTimeout(300)
      await page.locator('a[data-lightbox]').first().click()
      opened = await page.waitForFunction(() => document.querySelector('dialog.hh-lightbox')?.open && document.querySelector('dialog.hh-lightbox img')?.src, null, { timeout: 5000 }).then(() => true).catch(() => false)
      if (!opened) problems.push(`${path || '/'} ${template}: lightbox did not open`)
      await page.keyboard.press('Escape')
    }
    report.push({ path: path || '/', template, photos: boxes.length, viewable: links, opened })
    await page.close()
  }
} finally {
  await browser.close()
}
console.log(JSON.stringify({ report, problems }, null, 1))
if (problems.length) process.exit(1)
