import React from 'react'
import { liveReleaseFor } from '@/site/load'
import './site.css'

/**
 * Root layout for public hotel sites (preview path /s/<site>; the hotel's own domain maps
 * here later). Everything below renders from the site's current immutable release only.
 */
export const dynamic = 'force-dynamic'

export default async function SiteLayout(props: { children: React.ReactNode; params: Promise<{ site: string }> }) {
  const { site } = await props.params
  const live = await liveReleaseFor(site)
  const lang = live?.release.snapshot.site.defaultLocale ?? 'en'
  return (
    <html lang={lang}>
      <body className="hh-site">{props.children}</body>
    </html>
  )
}
