import React from 'react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { buildSnapshot, toSnapshotPage } from '@/releases/snapshot'
import { labelsFor } from '@/site/i18n'
import { Blocks } from '@/site/Blocks'
import { SiteFooter, SiteHeader } from '@/site/Chrome'
import { themeAttrs } from '@/site/theme'

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ locale?: string }> }

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Preview', robots: { index: false, follow: false } }

/**
 * Draft preview for the admin's Preview button. The signed-in user must be able to read the
 * page with their own access (another tenant's page answers 404). The rest of the site comes
 * from its published content, so the preview shows the page as it will look once published.
 */
export default async function PreviewPage(props: Props) {
  const { id } = await props.params
  const { locale: requested } = await props.searchParams
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect(`/admin/login?redirect=${encodeURIComponent(`/preview/pages/${id}`)}`)

  const draft = await payload
    .findByID({ collection: 'pages', id, draft: true, locale: 'all', depth: 0, user, overrideAccess: false })
    .catch(() => null)
  if (!draft) notFound()
  const tenantId = Number(typeof draft.tenant === 'object' && draft.tenant ? draft.tenant.id : draft.tenant)
  const siteId = Number(typeof draft.site === 'object' && draft.site ? draft.site.id : draft.site)

  const snapshot = await buildSnapshot(payload, tenantId, siteId)
  const page = toSnapshotPage(draft)
  snapshot.pages = [...snapshot.pages.filter((p) => p.id !== page.id), page]
  const locale = requested && snapshot.site.enabledLocales.includes(requested) ? requested : snapshot.site.defaultLocale
  const t = labelsFor(locale)

  return (
    <div lang={locale} {...themeAttrs(snapshot)}>
      <div role="note" style={{ background: '#1b1814', color: '#fff', padding: '8px 20px', font: '600 13px system-ui, sans-serif', textAlign: 'center' }}>
        {locale === 'fr' ? 'Aperçu du brouillon · pas encore publié' : 'Draft preview · not published yet'}
      </div>
      <SiteHeader snapshot={snapshot} locale={locale} t={t} current={page.slug} />
      <main id="main">
        <Blocks blocks={page.blocks} ctx={{ snapshot, locale, t }} />
      </main>
      <SiteFooter snapshot={snapshot} locale={locale} t={t} release={{ version: 'preview', checksum: 'draft' }} />
    </div>
  )
}
