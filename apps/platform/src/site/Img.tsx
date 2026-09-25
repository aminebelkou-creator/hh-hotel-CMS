import React from 'react'
import type { SiteSnapshot } from '@/releases/snapshot'

/** How wide the image is laid out, per context, so the browser picks the smallest fitting variant. */
export const SIZES = {
  full: '100vw',
  half: '(max-width: 860px) 100vw, 50vw',
  third: '(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw',
  card: '(max-width: 700px) 100vw, 400px',
  thumb: '160px',
} as const

type Props = {
  snapshot?: SiteSnapshot | null
  src?: string | null
  alt?: string
  sizes?: keyof typeof SIZES
  /** The first hero: fetched first, never lazy. */
  eager?: boolean
  className?: string
}

/* eslint-disable @next/next/no-img-element */
/**
 * One image element for every block. Platform photos (in `snapshot.images`) get a srcset from
 * their WebP variants, their intrinsic width/height (no layout shift) and a `sizes` hint; other
 * URLs render as they are. Lazy by default; the first hero is eager with high fetch priority.
 */
export function Img({ snapshot, src, alt, sizes = 'full', eager, className }: Props) {
  if (!src) return null
  const meta = snapshot?.images?.[src]
  return (
    <img
      src={src}
      alt={alt ?? ''}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : undefined}
      {...(meta ? { srcSet: meta.srcset, sizes: SIZES[sizes], width: meta.w, height: meta.h } : {})}
    />
  )
}

/** The largest file of a platform photo, for the lightbox; the URL itself otherwise. */
export const fullSizeOf = (snapshot: SiteSnapshot | null | undefined, src: string) => snapshot?.images?.[src]?.full ?? src
