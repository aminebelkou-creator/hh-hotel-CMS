import React from 'react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound, permanentRedirect } from 'next/navigation'
import { liveReleaseFor } from '@/site/load'
import { SiteView, originFrom, redirectFor, resolvePage, siteMetadata } from '@/site/render'

/** A hotel site on the platform host: /s/<site>[/<locale>][/<page>]. The hotel's own domain uses /h. */
type Props = { params: Promise<{ site: string; slug?: string[] }> }

export const dynamic = 'force-dynamic'

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { site, slug } = await props.params
  const live = await liveReleaseFor(site)
  if (!live) return {}
  const h = await headers()
  return siteMetadata(live, slug, originFrom((n) => h.get(n)))
}

export default async function SitePage(props: Props) {
  const { site, slug } = await props.params
  const live = await liveReleaseFor(site)
  if (!live) notFound()
  if (!resolvePage(live, slug)) {
    const to = redirectFor(live, slug)
    if (to) permanentRedirect(to)
    notFound()
  }
  const h = await headers()
  return <SiteView live={live} slugParts={slug} origin={originFrom((n) => h.get(n))} />
}
