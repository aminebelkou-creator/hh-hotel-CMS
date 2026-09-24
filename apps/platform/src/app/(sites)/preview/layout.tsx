import React from 'react'
import '../s/[site]/site.css'

export const dynamic = 'force-dynamic'

/** Root layout for draft previews. Never indexed; auth is checked by each preview page. */
export default function PreviewLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body className="hh-site">{props.children}</body>
    </html>
  )
}
