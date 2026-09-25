import React from 'react'
import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { FactReview } from './FactReview'

/**
 * /admin/review/:siteId — the fact review screen: confirm, correct or reject in one pass.
 * Server shell only; the work happens in FactReview with the signed-in user's own access.
 */
export async function ReviewView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const segments = (await params)?.segments ?? []
  const siteId = Number(segments[1])
  const user = initPageResult.req.user
  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={user ?? undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <div style={{ padding: '0 var(--gutter-h, 24px) 40px' }}>
        {!user ? <p>Sign in to review facts.</p> : !Number.isInteger(siteId) ? <p>Missing site.</p> : <FactReview siteId={siteId} />}
      </div>
    </DefaultTemplate>
  )
}
