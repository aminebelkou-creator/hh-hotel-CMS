/** Extra attributes for a platform photo (srcset, sizes, intrinsic size) when the release carries them. */
export type ImageIndex = Record<string, { w: number; h: number; srcset: string; full: string }>
export const imgAttrs = (images: ImageIndex | undefined, url: string, sizes: string) => {
  const m = images?.[url]
  return m ? { srcSet: m.srcset, sizes, width: m.w, height: m.h } : {}
}
/** The largest file of a platform photo (what the lightbox opens); other URLs as they are. */
export const fullOf = (images: ImageIndex | undefined, url: string) => images?.[url]?.full ?? url
export const SIZES = { card: '(max-width: 700px) 100vw, 400px', half: '(max-width: 860px) 100vw, 50vw', thumb: '160px' }
