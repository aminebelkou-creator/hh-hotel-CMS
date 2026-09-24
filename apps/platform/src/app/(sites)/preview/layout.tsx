import React from 'react'
import { fontVariables } from '@/design/fonts'
import '../s/[site]/site.css'

export const dynamic = 'force-dynamic'

/** Root layout for draft previews. Never indexed; auth is checked by each preview page. */
export default function PreviewLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body className={`hh-site ${fontVariables}`}>{props.children}</body>
    </html>
  )
}
