// AI blog drafts: the Sites panel writes a DRAFT post from the confirmed facts and links to it (session 15, batch 8).
//   SEED_PASSWORD=... node tests/visual/blog-drafts.mjs <base-url> <out-dir> [site-slug]
import { chromium } from '@playwright/test'
const base = process.argv[2] || 'http://localhost:3100'
const out = process.argv[3] || '.'
const slug = process.argv[4] || 'site-10'
const login = await (await fetch(`${base}/api/users/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'super@example.test', password: process.env.SEED_PASSWORD }) })).json()
const auth = { authorization: `JWT ${login.token}`, 'content-type': 'application/json' }
const site = (await (await fetch(`${base}/api/sites?where[slug][equals]=${slug}&depth=0&limit=1`, { headers: auth })).json()).docs[0]
const browser = await chromium.launch({ channel: 'chrome' })
const result = {}
let postId = null
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
  await page.goto(`${base}/admin/login`, { waitUntil: 'networkidle' })
  await page.fill('input[name="email"]', 'super@example.test')
  await page.fill('input[name="password"]', process.env.SEED_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/admin(?!\/login)/, { timeout: 30000 })
  await page.goto(`${base}/admin/collections/sites/${site.id}`, { waitUntil: 'networkidle' })
  const panel = page.getByText('Suggest a post written from your confirmed facts.')
  await panel.scrollIntoViewIfNeeded()
  result.panel = await panel.isVisible()
  await page.getByRole('button', { name: 'Suggest a draft post' }).click()
  const status = page.getByRole('status').filter({ hasText: /Draft ready:|facts|HTTP|Error/i })
  await status.first().waitFor({ timeout: 60000 })
  await status.first().scrollIntoViewIfNeeded()
  await page.screenshot({ path: `${out}/blog-drafts-panel.png` })
  result.status = await status.first().innerText()
  if (!result.status.startsWith('Draft ready')) throw new Error(`No draft: ${result.status}`)
  const link = page.getByText(/Draft ready:/)
  const href = await link.locator('a').getAttribute('href')
  postId = href?.split('/').pop() ?? null
  await page.goto(`${base}${href}`, { waitUntil: 'networkidle' })
  await page.screenshot({ path: `${out}/blog-drafts-post.png` })
  const post = await (await fetch(`${base}/api/posts/${postId}?depth=0`, { headers: auth })).json()
  result.draft = post.status === 'draft'
  result.generated = post.provenance?.origin === 'generated'
  result.title = post.title
} finally {
  if (postId) await fetch(`${base}/api/posts/${postId}`, { method: 'DELETE', headers: auth })
  await browser.close()
}
console.log(JSON.stringify(result))
if (!result.panel || !result.draft || !result.generated) process.exit(1)
