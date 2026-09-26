/**
 * Seed: 50 tenants, one user each, one site, four pages (home, rooms, contact, blog), one room type,
 * two published blog posts and one draft, one domain, plus one super-admin.
 * Run with: pnpm seed   (payload run src/seed/index.ts)
 *
 * This is a system operation and uses overrideAccess: true on purpose. It is listed in
 * src/access/override-access.allowlist.json and audited by tests/int/override-access.int.spec.ts.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Page } from '@/payload-types'

import { SEED_PASSWORD, SUPER_ADMIN_EMAIL, TENANT_COUNT, tenantEmail, tenantSlug } from './constants'

const seedProvenance = { origin: 'generated' as const, sourceFact: 'seed' }
/** A tiny inline photo (1×1 WebP), so seeded pages carry images without network or storage. */
const PHOTO = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA'

/**
 * Every core block on the three seeded pages, so the quality gates (tests/quality/gates.mjs)
 * exercise the templates' full CSS: accessibility, structured data and page weight.
 */
type SeedBlocks = NonNullable<Page['blocks']>
const seedBlocks = (slug: string, n: number): SeedBlocks => {
  const hero: SeedBlocks[number] = { blockType: 'hero', heading: `Welcome to tenant ${n}`, subheading: `${slug} page of a seeded hotel`, ctaLabel: 'Contact us', ctaHref: 'contact', rating: 'classification', bookingBar: slug === 'home', imageUrl: n === 5 && slug === 'home' ? PHOTO : undefined, imageAlt: n === 5 && slug === 'home' ? 'The lounge' : undefined, videoUrl: n === 5 && slug === 'home' ? '/stock/paris/seine-conciergerie-1280.mp4' : undefined, videoMobileUrl: n === 5 && slug === 'home' ? '/stock/paris/seine-conciergerie-540x960.mp4' : undefined, provenance: seedProvenance }
  if (slug === 'rooms') {
    return [
      hero,
      { blockType: 'rooms', heading: 'Our rooms', intro: 'Each room type, described from the confirmed facts.', layout: 'detailed' },
      { blockType: 'mediaBand', imageUrl: PHOTO, imageAlt: 'The courtyard at dusk', provenance: seedProvenance },
      { blockType: 'offers', heading: 'Offers', intro: 'Current offers appear here while they run.' },
      { blockType: 'policies', heading: 'Good to know', showTimes: true, items: [{ title: 'Pets', text: 'Small pets are welcome on request.' }, { title: 'Children', text: 'Cots are available for children under two.' }] },
      { blockType: 'cta', heading: 'Ready to book?', text: 'Book directly for the best rate.', buttonLabel: 'Contact us', buttonHref: 'contact' },
    ]
  }
  if (slug === 'blog') {
    return [{ blockType: 'news', heading: 'News from the hotel', intro: 'Stories from the house and the neighbourhood.', layout: 'list', provenance: seedProvenance }]
  }
  if (slug === 'contact') {
    return [
      hero,
      { blockType: 'contact', heading: 'Contact', intro: 'We answer every message within a day.' },
      { blockType: 'faq', heading: 'Questions', items: [{ question: 'Is breakfast included?', answer: 'Breakfast is served every morning and can be added to any rate.' }, { question: 'Do you have parking?', answer: 'Public parking is a short walk away.' }], provenance: seedProvenance },
      { blockType: 'text', heading: 'Getting here', body: 'The hotel is ten minutes on foot from the station.\n\n## By car\n\nFollow the signs to the centre.', provenance: seedProvenance },
    ]
  }
  return [
    hero,
    { blockType: 'text', heading: `About tenant ${n}`, body: 'A small independent hotel, seeded for tests.\n\nTwo paragraphs of plain text.', provenance: seedProvenance },
    { blockType: 'banners', eyebrow: 'The house', heading: 'Rooms, breakfast, courtyard', items: [{ imageUrl: PHOTO, imageAlt: 'A bright room', title: 'Rooms', href: 'rooms' }, { imageUrl: PHOTO, imageAlt: 'The breakfast buffet', title: 'Breakfast' }], provenance: seedProvenance },
    { blockType: 'features', heading: 'Why stay with us', intro: 'Three reasons.', items: [{ icon: 'bed', title: 'Quiet rooms', text: 'Double glazing on every window.' }, { icon: 'coffee', title: 'Breakfast', text: 'Fresh bread every morning.' }, { icon: 'pin', title: 'Central', text: 'Walk everywhere.' }], provenance: seedProvenance },
    { blockType: 'textImage', eyebrow: 'The house', heading: 'A family home since 1952', body: 'Restored room by room.', imagePosition: 'right', points: [{ text: 'Free luggage room' }, { text: 'Lift to every floor' }], provenance: seedProvenance },
    { blockType: 'rooms', heading: 'Rooms', intro: 'From the standard room to the suite.', layout: 'cards', limit: 3, linkLabel: 'See all rooms', linkHref: 'rooms' },
    { blockType: 'gallery', heading: 'In pictures', images: [{ url: PHOTO, alt: 'The courtyard' }, { url: PHOTO, alt: 'A room' }] },
    { blockType: 'news', heading: 'Latest news', layout: 'latest', limit: 3, linkLabel: 'All news', linkHref: 'blog', provenance: seedProvenance },
    { blockType: 'reviews', heading: 'What our guests say', limit: 6, provenance: seedProvenance },
    { blockType: 'quote', text: 'Perfect stay, we will be back.', author: 'A guest' },
    { blockType: 'cta', heading: 'Book direct', text: 'Best rate guaranteed.', buttonLabel: 'Contact us', buttonHref: 'contact' },
  ]
}

const run = async () => {
  const payload = await getPayload({ config })
  const t0 = Date.now()

  // Idempotent: wipe seeded data first (by slug/email prefix). Only the synthetic tenant-NN
  // tenants are touched, so real tenants (customer zero) survive a reseed.
  const seeded = await payload.find({ collection: 'tenants', where: { slug: { like: 'tenant-' } }, overrideAccess: true, limit: 0, pagination: false })
  const seededIds = seeded.docs.map((t) => t.id)
  if (seededIds.length) {
    await payload.update({ collection: 'sites', where: { tenant: { in: seededIds } }, data: { currentRelease: null }, overrideAccess: true })
    for (const collection of ['issues', 'crawls', 'releases', 'facts', 'rooms', 'offers', 'posts', 'reviews', 'redirects', 'forms', 'domains', 'pages', 'sites', 'audit-log'] as const) {
      await payload.delete({ collection, where: { tenant: { in: seededIds } }, overrideAccess: true })
    }
  }
  await payload.delete({ collection: 'users', where: { email: { like: '@example.test' } }, overrideAccess: true })
  await payload.delete({ collection: 'tenants', where: { slug: { like: 'tenant-' } }, overrideAccess: true })

  await payload.create({
    collection: 'users',
    data: { email: SUPER_ADMIN_EMAIL, password: SEED_PASSWORD, roles: ['super-admin'] },
    overrideAccess: true,
  })

  for (let n = 1; n <= TENANT_COUNT; n++) {
    const tenant = await payload.create({
      collection: 'tenants',
      data: { name: `Tenant ${n}`, slug: tenantSlug(n), plan: 'concierge' },
      overrideAccess: true,
    })
    await payload.create({
      collection: 'users',
      data: {
        email: tenantEmail(n),
        password: SEED_PASSWORD,
        roles: ['owner'],
        tenants: [{ tenant: tenant.id }],
      },
      overrideAccess: true,
    })
    const site = await payload.create({
      collection: 'sites',
      data: { name: `Site ${n}`, slug: `site-${n}`, enabledLocales: ['en', 'fr'], defaultLocale: 'en', status: 'draft', tenant: tenant.id, cta: { label: 'Book', href: 'contact' } },
      overrideAccess: true,
    })
    // Confirmed facts every seeded site carries: the classification (hero stars) and a phone (header, sticky bar).
    for (const [key, value] of [['rating.stars', '3'], ['contact.phone', `+33 1 00 00 00 ${String(n).padStart(2, '0')}`]] as const) {
      await payload.create({
        collection: 'facts',
        data: { tenant: tenant.id, site: site.id, key, value, method: 'manual', confidence: 1, status: 'confirmed', decisionNote: 'seed' },
        overrideAccess: true,
      })
    }
    for (const slug of ['home', 'rooms', 'contact', 'blog']) {
      await payload.create({
        collection: 'pages',
        data: {
          title: slug === 'blog' ? 'News' : `${slug} of tenant ${n}`,
          slug,
          site: site.id,
          tenant: tenant.id,
          _status: 'published',
          blocks: seedBlocks(slug, n),
        },
        overrideAccess: true,
      })
    }
    // Blog: two published posts (the newer one first on the site) and a draft that must never show.
    const posts = [
      { slug: 'garden-open', title: 'The garden is open again', status: 'published', publishedAt: '2026-09-01', excerpt: 'Breakfast outside from May to September.', body: 'The courtyard garden reopens for the season.\n\n## Breakfast outside\n\n- Served until 10:30\n- Weather permitting' },
      { slug: 'walks-nearby', title: 'Three walks from the door', status: 'published', publishedAt: '2026-08-15', excerpt: 'The river, the old town and the market, all on foot.', body: 'Three short walks, each under an hour.' },
      { slug: 'draft-post', title: 'Unpublished draft post', status: 'draft', publishedAt: '2026-09-10', excerpt: 'Not yet.', body: 'Not yet.' },
    ] as const
    for (const p of posts) {
      await payload.create({
        collection: 'posts',
        data: { ...p, site: site.id, tenant: tenant.id, imageUrl: PHOTO, imageAlt: 'A seeded photo', provenance: seedProvenance },
        overrideAccess: true,
      })
    }
    // Reviews: two published (a 5-star Google one, a 9.2/10 Booking one in French) and a draft.
    const reviews = [
      { order: 1, text: 'Quiet room, lovely staff.\n\nWe will be back.', language: 'en', author: 'Anna K.', origin: 'Oslo', source: 'google', sourceUrl: 'https://example.test/review/1', rating: 5, ratingScale: 5, visitedAt: '2026-08-01', status: 'published' },
      { order: 2, text: 'Très bien situé, petit-déjeuner copieux.', language: 'fr', author: 'Luc', source: 'booking', rating: 9.2, ratingScale: 10, visitedAt: '2026-07-01', status: 'published' },
      { order: 3, text: 'Unpublished draft review', language: 'en', author: 'Draft', source: 'direct', status: 'draft' },
    ] as const
    for (const r of reviews) {
      await payload.create({ collection: 'reviews', data: { ...r, site: site.id, tenant: tenant.id }, overrideAccess: true })
    }
    await payload.create({
      collection: 'rooms',
      data: { tenant: tenant.id, slug: 'standard', name: `Standard room of tenant ${n}`, order: 1, maxOccupancy: 2 },
      overrideAccess: true,
    })
    await payload.create({
      collection: 'domains',
      data: { hostname: `${tenantSlug(n)}.example.test`, site: site.id, primary: true, status: 'pending', tenant: tenant.id },
      overrideAccess: true,
    })
  }

  payload.logger.info(`Seeded ${TENANT_COUNT} tenants in ${((Date.now() - t0) / 1000).toFixed(1)}s`)
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
