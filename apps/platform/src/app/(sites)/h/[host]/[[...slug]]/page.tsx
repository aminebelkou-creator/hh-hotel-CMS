import React from 'react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound, permanentRedirect } from 'next/navigation'
import { liveReleaseForHost } from '@/site/load'
import { SiteView, originFrom, redirectFor, resolvePage, siteMetadata } from '@/site/render'

/** A hotel site on its own domain: /[<locale>][/<page>] (internally /h/<host>/…). */
type Props = { params: Promise<{ host: string; slug?: string[] }> }

export const dynamic = 'force-dynamic'

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { host, slug } = await props.params
  const { live } = await liveReleaseForHost(decodeURIComponent(host))
  if (!live) return {}
  const h = await headers()
  return siteMetadata(live, slug, originFrom((n) => h.get(n)))
}

export default async function HostPage(props: Props) {
  const { host, slug } = await props.params
  const { live, redirectTo } = await liveReleaseForHost(decodeURIComponent(host))
  if (!live && redirectTo) permanentRedirect(`https://${redirectTo}/${(slug ?? []).join('/')}`)
  if (!live) notFound()
  if (!resolvePage(live, slug)) {
    const to = redirectFor(live, slug)
    if (to) permanentRedirect(to)
    notFound()
  }
  const h = await headers()
  return <SiteView live={live} slugParts={slug} origin={originFrom((n) => h.get(n))} />
}
