// Hero video in a real browser: plays muted after load, the right cut per screen, a pause button
// that works, nothing with reduced motion. Screenshots desktop and phone.
//   node tests/visual/hero-video.mjs <base-url> <out-dir> [site-slug]
import { chromium } from '@playwright/test'
const base = process.argv[2] || 'http://localhost:3100'
const out = process.argv[3] || '.'
const slug = process.argv[4] || 'hotel-herse-dor'
const browser = await chromium.launch({ channel: 'chrome' })
const report = []
try {
  for (const [name, ctx] of [
    ['desktop', { viewport: { width: 1280, height: 800 } }],
    ['mobile', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
    ['reduced-motion', { viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' }],
  ]) {
    const page = await browser.newPage(ctx)
    const videoBytes = []
    page.on('response', async (r) => { if (r.url().includes('/stock/')) videoBytes.push(`${r.status()} ${r.url().split('/').pop()}`) })
    await page.goto(`${base}/s/${slug}`, { waitUntil: 'load', timeout: 90000 })
    const played = await page.waitForFunction(() => { const v = document.querySelector('video.hh-hero-video'); return v && !v.paused && v.currentTime > 0.5 }, null, { timeout: 15000 }).then(() => true).catch(() => false)
    const state = await page.evaluate(() => { const v = document.querySelector('video.hh-hero-video'); return v ? { src: v.currentSrc.split('/').pop(), muted: v.muted, playing: v.classList.contains('is-playing') } : null })
    let pausedByButton = null
    if (played) {
      await page.waitForTimeout(1500)
      await page.screenshot({ path: `${out}/hero-video-${name}.jpg`, type: 'jpeg', quality: 72, scale: 'css' })
      await page.getByRole('button', { name: /pause/i }).click()
      pausedByButton = await page.evaluate(() => document.querySelector('video.hh-hero-video').paused)
    }
    report.push({ name, played, state, pausedByButton, requests: videoBytes })
    await page.close()
  }
} finally {
  await browser.close()
}
console.log(JSON.stringify(report, null, 1))
const [d, m, r] = report
if (!d.played || !d.pausedByButton || !m.played || !m.state.src.includes('540x960') || r.played || r.requests.length) process.exit(1)
