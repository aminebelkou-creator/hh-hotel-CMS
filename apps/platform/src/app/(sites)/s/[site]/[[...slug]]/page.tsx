import React from 'react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { hotelJsonLd, type HotelSnapshot } from '@hh/pack-hotel'
import { pick } from '@/releases/snapshot'
import { liveReleaseFor } from '@/site/load'
import { pageHref, resolvePath } from '@/site/routing'
import { labelsFor } from '@/site/i18n'
import { Blocks } from '@/site/Blocks'
import { SiteFooter, SiteHeader } from '@/site/Chrome'

type Props = { params: Promise<{ site: string; slug?: string[] }> }

export const dynamic = 'force-dynamic'

async function origin() {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost'
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

async function load(props: Props) {
  const { site, slug } = await props.params
  const live = await liveReleaseFor(site)
  if (!live) return null
  const snapshot = live.release.snapshot
  const path = resolvePath(snapshot, slug)
  if (!path) return null
  const page = snapshot.pages.find((p) => p.slug === path.slug)
  if (!page) return null
  return { live, snapshot, page, locale: path.locale }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const d = await load(props)
  if (!d) return {}
  const { snapshot, page, locale, live } = d
  const def = snapshot.site.defaultLocale
  const brand = snapshot.site.brandName || snapshot.site.name
  const title = pick(page.seo?.title, locale, def) || pick(page.title, locale, def) || brand
  const base = await origin()
  const hero = page.blocks.find((b) => b.blockType === 'hero' && b.imageUrl)
  return {
    metadataBase: new URL(base),
    title: page.slug === 'home' ? title : `${title} · ${brand}`,
    description: pick(page.seo?.description, locale, def) || pick(snapshot.site.tagline, locale, def) || undefined,
    alternates: {
      canonical: pageHref(snapshot, locale, page.slug),
      languages: Object.fromEntries(snapshot.site.enabledLocales.map((l) => [l, pageHref(snapshot, l, page.slug)])),
    },
    openGraph: {
      title,
      siteName: brand,
      locale,
      type: 'website',
      images: hero ? [String(hero.imageUrl)] : undefined,
    },
    // Release stamp: the pipeline's verification step reads this to confirm what is served.
    other: { 'x-release': String(live.release.id), 'x-release-version': live.release.version },
  }
}

export default async function SitePage(props: Props) {
  const d = await load(props)
  if (!d) notFound()
  const { live, snapshot, page, locale } = d
  const t = labelsFor(locale)
  const def = snapshot.site.defaultLocale
  const base = await origin()
  const hero = snapshot.pages.find((p) => p.slug === 'home')?.blocks.find((b) => b.blockType === 'hero' && b.imageUrl)
  const jsonLd =
    page.slug === 'home' && snapshot.packs.hotel
      ? hotelJsonLd(
          {
            name: snapshot.site.brandName || snapshot.site.name,
            url: `${base}${pageHref(snapshot, locale, 'home')}`,
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
