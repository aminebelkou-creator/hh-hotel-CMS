import React from 'react'
import { liveReleaseFor } from '@/site/load'
import { themeAttrs } from '@/site/theme'
import { fontVariables } from '@/design/fonts'
import './site.css'

/**
 * Root layout for public hotel sites (preview path /s/<site>; the hotel's own domain maps
 * here later). Everything below renders from the site's current immutable release only,
 * including its look: template and brand are part of the release (design contract, docs/11).
 */
export const dynamic = 'force-dynamic'

export default async function SiteLayout(props: { children: React.ReactNode; params: Promise<{ site: string }> }) {
  const { site } = await props.params
  const live = await liveReleaseFor(site)
  const snapshot = live?.release.snapshot
  const lang = snapshot?.site.defaultLocale ?? 'en'
  return (
    <html lang={lang}>
      <body {...themeAttrs(snapshot, `hh-site ${fontVariables}`)}>{props.children}</body>
    </html>
  )
}
