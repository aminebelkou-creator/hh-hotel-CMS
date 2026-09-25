import React from 'react'
import { liveReleaseForHost } from '@/site/load'
import { themeAttrs } from '@/site/theme'
import { fontVariables } from '@/design/fonts'
import '../../s/[site]/site.css'

/**
 * Root layout for a hotel served on its own domain. The proxy rewrites <host>/<path> to
 * /h/<host>/<path>; visitors never see this prefix. Same renderer and theme as /s/<site>.
 */
export const dynamic = 'force-dynamic'

export default async function HostLayout(props: { children: React.ReactNode; params: Promise<{ host: string }> }) {
  const { host } = await props.params
  const { live } = await liveReleaseForHost(decodeURIComponent(host))
  const snapshot = live?.release.snapshot
  return (
    <html lang={snapshot?.site.defaultLocale ?? 'en'}>
      <body {...themeAttrs(snapshot, `hh-site ${fontVariables}`)}>{props.children}</body>
    </html>
  )
}
