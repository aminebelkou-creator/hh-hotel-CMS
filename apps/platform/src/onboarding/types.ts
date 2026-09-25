/** Onboarding content: what a hotel's first site is built from. FR and EN side by side. */
export type L = { fr: string; en: string }
export type Img = { url: string; alt: L }

export type BlockInput =
  | { blockType: 'hero'; heading: L; subheading?: L; image?: Img; cta?: { label: L; href: string }; rating?: 'none' | 'classification'; bookingBar?: boolean }
  | { blockType: 'textImage'; eyebrow?: L; heading?: L; body: L; image?: Img; imagePosition?: 'left' | 'right'; points?: L[]; link?: { label: L; href: string } }
  | { blockType: 'features'; heading?: L; intro?: L; items: { icon?: string; title: L; text?: L }[] }
  | { blockType: 'banners'; eyebrow?: L; heading?: L; items: { image: Img; title: L; href?: string }[] }
  | { blockType: 'mediaBand'; image: Img }
  | { blockType: 'gallery'; heading?: L; images: Img[] }
  | { blockType: 'quote'; text: L; author?: L }
  | { blockType: 'cta'; heading?: L; text?: L; button?: { label: L; href: string }; image?: Img }
  | { blockType: 'contact'; heading?: L; intro?: L }
  | { blockType: 'map'; heading?: L; text?: L; zoom?: number }
  | { blockType: 'rooms'; heading?: L; intro?: L; limit?: number; layout?: 'cards' | 'detailed'; link?: { label: L; href: string } }
  | { blockType: 'text'; heading?: L; body: L }
  | { blockType: 'faq'; heading?: L; items: { question: L; answer: L }[] }
  | { blockType: 'offers'; heading?: L; intro?: L; limit?: number }
  | { blockType: 'news'; heading?: L; intro?: L; layout?: 'latest' | 'list'; limit?: number; link?: { label: L; href: string } }
  | { blockType: 'policies'; heading?: L; showTimes?: boolean; items: { title: L; text: L }[] }

export type PageInput = { slug: string; title: L; navLabel?: L; navOrder: number; showInNav?: boolean; showInFooter?: boolean; seo?: { title?: L; description?: L }; blocks: BlockInput[] }

export type RoomInput = {
  slug: string
  order: number
  name: L
  category?: string
  summary: L
  description: L
  sizeSqm?: number
  maxOccupancy?: number
  bed?: L
  view?: L
  features: L[]
  images: Img[]
}

export type OfferInput = {
  slug: string
  order: number
  title: L
  highlight?: L
  summary: L
  conditions?: L
  validFrom?: string
  validTo?: string
  image?: Img
  cta?: { label: L; href: string }
}

/** A blog post. Written from confirmed facts and checked public sources (rule 9): no prices, no invented claims. */
export type PostInput = {
  slug: string
  publishedAt: string
  title: L
  excerpt: L
  body: L
  image?: Img
}

export type SiteContent = {
  tenant: { slug: string; name: string }
  site: {
    slug: string
    name: string
    brandName: string
    tagline: L
    logoUrl?: string
    defaultLocale: 'fr' | 'en'
    enabledLocales: ('fr' | 'en')[]
    cta: { label: L; href: string }
  }
  rooms: RoomInput[]
  offers?: OfferInput[]
  posts?: PostInput[]
  pages: PageInput[]
}
