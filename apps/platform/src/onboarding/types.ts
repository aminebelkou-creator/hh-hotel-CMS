/** Onboarding content: what a hotel's first site is built from. FR and EN side by side. */
export type L = { fr: string; en: string }
export type Img = { url: string; alt: L }

export type BlockInput =
  | { blockType: 'hero'; heading: L; subheading?: L; image?: Img; cta?: { label: L; href: string } }
  | { blockType: 'textImage'; eyebrow?: L; heading?: L; body: L; image?: Img; imagePosition?: 'left' | 'right'; link?: { label: L; href: string } }
  | { blockType: 'features'; heading?: L; intro?: L; items: { title: L; text?: L }[] }
  | { blockType: 'gallery'; heading?: L; images: Img[] }
  | { blockType: 'quote'; text: L; author?: L }
  | { blockType: 'cta'; heading?: L; text?: L; button?: { label: L; href: string }; image?: Img }
  | { blockType: 'contact'; heading?: L; intro?: L }
  | { blockType: 'map'; heading?: L; text?: L; zoom?: number }
  | { blockType: 'rooms'; heading?: L; intro?: L; limit?: number; layout?: 'cards' | 'detailed' }

export type PageInput = { slug: string; title: L; navLabel?: L; navOrder: number; showInNav?: boolean; seo?: { title?: L; description?: L }; blocks: BlockInput[] }

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
  pages: PageInput[]
}
