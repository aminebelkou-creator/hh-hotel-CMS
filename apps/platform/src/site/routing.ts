import type { SiteSnapshot } from '@/releases/snapshot'

/**
 * Public URL scheme (preview host): /s/<site>[/<locale>][/<page>]
 * The default locale has no prefix; other enabled locales do. "home" is the root.
 * On the hotel's own domain the prefix is empty (site.basePath, set by the loader).
 */
export function resolvePath(snapshot: SiteSnapshot, parts: string[] = []) {
  const { enabledLocales, defaultLocale } = snapshot.site
  let locale = defaultLocale
  let rest = parts
  if (parts[0] && parts[0] !== defaultLocale && enabledLocales.includes(parts[0])) {
    locale = parts[0]
    rest = parts.slice(1)
  }
  // A path that names the default locale explicitly is not canonical.
  if (parts[0] === defaultLocale && parts.length) return null
  return { locale, slug: rest.join('/') || 'home' }
}

export const siteBase = (snapshot: SiteSnapshot) => snapshot.site.basePath ?? `/s/${snapshot.site.slug}`

export function pageHref(snapshot: SiteSnapshot, locale: string, slug: string) {
  return pageHrefWithBase(snapshot, siteBase(snapshot), locale, slug)
}

/** The same path under an explicit base ('' for a hotel's own domain). */
export function pageHrefWithBase(snapshot: SiteSnapshot, base: string, locale: string, slug: string) {
  const prefix = locale === snapshot.site.defaultLocale ? '' : `/${locale}`
  const tail = slug === 'home' ? '' : `/${slug}`
  return `${base}${prefix}${tail}` || '/'
}

/** A link field: absolute URL, tel:, mailto:, #anchor or a page slug of this site. */
export function linkHref(snapshot: SiteSnapshot, locale: string, href: string | null | undefined) {
  if (!href) return null
  if (/^(https?:|tel:|mailto:|#)/.test(href)) return href
  const slug = href.replace(/^\/+|\/+$/g, '')
  return pageHref(snapshot, locale, slug || 'home')
}
