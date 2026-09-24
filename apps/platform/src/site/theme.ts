import type React from 'react'
import type { SiteSnapshot } from '@/releases/snapshot'
import { resolveTheme, themeVars, type Brand } from '@/design/theme'

/** Attributes that apply a site's theme to an element (the page body, or the preview wrapper). */
export function themeAttrs(snapshot: SiteSnapshot | null | undefined, extraClass = '') {
  const th = resolveTheme(snapshot?.site.template, (snapshot?.site.brand ?? null) as Brand | null)
  return {
    className: `hh-theme ${extraClass}`.trim(),
    'data-template': th.template,
    'data-scheme': th.scheme,
    style: themeVars(th) as React.CSSProperties,
  }
}
