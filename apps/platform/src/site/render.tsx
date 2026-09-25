import React from 'react'
import type { Metadata } from 'next'
import { hotelJsonLd, type HotelSnapshot } from '@hh/pack-hotel'
import { pick } from '@/releases/snapshot'
import type { LiveRelease } from '@/releases/resolve'
import { pageHref, pageHrefWithBase, resolvePath, siteBase } from './routing'
import { labelsFor } from './i18n'
import { Blocks } from './Blocks'
import { SiteFooter, SiteHeader } from './Chrome'

/**
 * Renders a live release, whether reached as /s/<site>/… on the platform host or as /… on
 * the hotel's own domain (the loader sets site.basePath). Canonical and sitemap URLs point at
 * the hotel's primary domain when it has one, so the platform copy never competes with it.
 */
export type Origin = { host: string; proto: string }

export function originFrom(get: (name: string) => string | null): Origin {
  const host = (process.env.TRUST_FORWARDED_HOST === 'true' && get('x-forwarded-host')) || get('host') || 'localhost'
  const proto = get('x-forwarded-proto') || (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? 'http' : 'https')
  return { host, proto }
}

/** Absolute, canonical URL of a page: on the primary domain if there is one, else where we are. */
export function canonicalUrl(live: LiveRelease, origin: Origin, locale: string, slug: string) {
  const s = live.release.snapshot
  const primary = live.site.primaryHost
  // The home of a domain is written without a trailing slash, as Next.js prints it in <head>.
  const path = (p: string) => (p === '/' ? '' : p)
  if (primary) return `https://${primary}${path(pageHrefWithBase(s, '', locale, slug))}`
  return `${origin.proto}://${origin.host}${path(pageHref(s, locale, slug))}`
}

export function resolvePage(live: LiveRelease, slugParts: string[] | undefined) {
  const snapshot = live.release.snapshot
  const path = resolvePath(snapshot, slugParts)
  if (!path) return null
  const page = snapshot.pages.find((p) => p.slug === path.slug)
  if (!page) return null
  return { snapshot, page, locale: path.locale }
}

export function siteMetadata(live: LiveRelease, slugParts: string[] | undefined, origin: Origin): Metadata {
  const d = resolvePage(live, slugParts)
  if (!d) return {}
  const { snapshot, page, locale } = d
  const def = snapshot.site.defaultLocale
  const brand = snapshot.site.brandName || snapshot.site.name
  const title = pick(page.seo?.title, locale, def) || pick(page.title, locale, def) || brand
  const hero = page.blocks.find((b) => b.blockType === 'hero' && b.imageUrl)
  return {
    metadataBase: new URL(`${origin.proto}://${origin.host}`),
    title: page.slug === 'home' ? title : `${title} · ${brand}`,
    description: pick(page.seo?.description, locale, def) || pick(snapshot.site.tagline, locale, def) || undefined,
    alternates: {
      canonical: canonicalUrl(live, origin, locale, page.slug),
      languages: Object.fromEntries(snapshot.site.enabledLocales.map((l) => [l, canonicalUrl(live, origin, l, page.slug)])),
    },
    openGraph: { title, siteName: brand, locale, type: 'website', images: hero ? [String(hero.imageUrl)] : undefined },
    // Release stamp: the pipeline's verification step reads this to confirm what is served.
    other: { 'x-release': String(live.release.id), 'x-release-version': live.release.version },
  }
}

export function SiteView({ live, slugParts, origin }: { live: LiveRelease; slugParts: string[] | undefined; origin: Origin }) {
  const d = resolvePage(live, slugParts)
  if (!d) return null
  const { snapshot, page, locale } = d
  const t = labelsFor(locale)
  const def = snapshot.site.defaultLocale
  const hero = snapshot.pages.find((p) => p.slug === 'home')?.blocks.find((b) => b.blockType === 'hero' && b.imageUrl)
  const jsonLd =
    page.slug === 'home' && snapshot.packs.hotel
      ? hotelJsonLd(
          {
            name: snapshot.site.brandName || snapshot.site.name,
            url: canonicalUrl(live, origin, locale, 'home'),
            locale,
            defaultLocale: def,
            image: hero ? String(hero.imageUrl) : null,
            description: pick(page.seo?.description, locale, def) || pick(snapshot.site.tagline, locale, def) || null,
          },
          snapshot.facts,
          snapshot.packs.hotel as HotelSnapshot,
        )
      : null
  return (
    <div lang={locale}>
      <SiteHeader snapshot={snapshot} locale={locale} t={t} current={page.slug} />
      <main id="main">
        <Blocks blocks={page.blocks} ctx={{ snapshot, locale, t }} />
      </main>
      <SiteFooter snapshot={snapshot} locale={locale} t={t} release={live.release} />
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />}
    </div>
  )
}

export function sitemapXml(live: LiveRelease, origin: Origin) {
  const s = live.release.snapshot
  const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const urls = s.pages.flatMap((p) =>
    s.site.enabledLocales.map((l) => {
      const alts = s.site.enabledLocales
        .map((a) => `<xhtml:link rel="alternate" hreflang="${a}" href="${esc(canonicalUrl(live, origin, a, p.slug))}"/>`)
        .join('')
      return `<url><loc>${esc(canonicalUrl(live, origin, l, p.slug))}</loc>${alts}</url>`
    }),
  )
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('')}</urlset>`
}

export function robotsTxt(live: LiveRelease, origin: Origin) {
  const s = live.release.snapshot
  const primary = live.site.primaryHost
  const sitemap = primary ? `https://${primary}/sitemap.xml` : `${origin.proto}://${origin.host}${siteBase(s)}/sitemap.xml`
  return `User-agent: *\nAllow: /\nSitemap: ${sitemap}\n`
}
