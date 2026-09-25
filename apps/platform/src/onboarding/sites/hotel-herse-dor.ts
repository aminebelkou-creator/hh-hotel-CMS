import type { SiteContent } from '../types'
import { IMG } from './hotel-herse-dor.images'
import { pages } from './hotel-herse-dor.pages'
import { posts } from './hotel-herse-dor.posts'
import { reviews } from './hotel-herse-dor.reviews'

/**
 * Customer zero: Hôtel de la Herse d'Or, 20 rue Saint-Antoine, Paris 4e.
 * Text is adapted from the hotel's own website (www.hotel-herse-dor.com, crawled 23-24 Sep 2026)
 * for the owner; photos are the hotel's own, served from its current site until the media
 * pipeline exists. English is our translation. Demo content: no booking logic.
 */
export const hotelHerseDor: SiteContent = {
  tenant: { slug: 'hotel-herse-dor', name: 'Hôtel de la Herse d’Or' },
  site: {
    slug: 'hotel-herse-dor',
    name: 'Hôtel de la Herse d’Or',
    brandName: 'Hôtel de la Herse d’Or',
    tagline: { fr: 'Hôtel 3 étoiles · Le Marais, Paris', en: '3-star hotel · Le Marais, Paris' },
    defaultLocale: 'fr',
    enabledLocales: ['fr', 'en'],
    cta: { label: { fr: 'Réserver', en: 'Book' }, href: 'contact' },
  },
  rooms: [
    {
      slug: 'superieure',
      order: 1,
      category: 'Supérieure',
      name: { fr: 'Chambre Supérieure', en: 'Superior Room' },
      summary: {
        fr: 'Les plus belles chambres de l’hôtel : poutres en bois, pierres d’origine et parquet en liège, pour se détendre ou travailler au calme.',
        en: 'The finest rooms in the hotel: wooden beams, original stone and cork floors, for resting or working in peace.',
      },
      description: {
        fr: 'Calme et volupté : récemment rénovées et finement décorées, les chambres Supérieures associent poutres en bois au plafond, pierres d’origine apparentes et chaleur du parquet en liège. Plus vastes et mieux équipées, elles offrent une climatisation réversible réglable par vos soins et une salle de bain avec sèche-serviettes. Chambre simple, double ou triple.',
        en: 'Calm and comfort: recently renovated and finely decorated, the Superior rooms combine wooden ceiling beams, exposed original stone and warm cork floors. Larger and better equipped, they have reversible air conditioning you control yourself and a bathroom with a heated towel rail. Single, double or triple.',
      },
      maxOccupancy: 3,
      bed: { fr: 'Lit double, lits jumeaux ou triple', en: 'Double, twin or triple' },
      features: [
        { fr: 'Climatisation réversible', en: 'Reversible air conditioning' },
        { fr: 'Salle de bain avec sèche-serviettes', en: 'Bathroom with heated towel rail' },
        { fr: 'Poutres et pierres d’origine', en: 'Original beams and stone' },
        { fr: 'Tablette en chambre', en: 'In-room tablet' },
        { fr: 'Wi-Fi gratuit très haut débit', en: 'Free high-speed Wi-Fi' },
        { fr: 'Accès par ascenseur', en: 'Lift access' },
      ],
      images: [IMG.sup, IMG.supBed, IMG.supTriple, IMG.supWide, IMG.bath],
    },
    {
      slug: 'confort',
      order: 2,
      category: 'Confort',
      name: { fr: 'Chambre Confort', en: 'Comfort Room' },
      summary: {
        fr: 'Un excellent rapport qualité-prix, avec vue sur la rue Saint-Antoine et ses monuments ou sur notre cour intérieure typiquement parisienne.',
        en: 'Excellent value, overlooking historic rue Saint-Antoine or our typically Parisian inner courtyard.',
      },
      description: {
        fr: 'Avec un excellent rapport qualité-prix et une vue sur la rue Saint-Antoine et ses monuments historiques ou sur notre cour intérieure typiquement parisienne, la catégorie Confort vous séduira par sa décoration épurée, sa literie confortable et toutes les commodités dont vous avez besoin pour vous sentir bien.',
        en: 'Excellent value, with a view of rue Saint-Antoine and its historic monuments or of our typically Parisian inner courtyard. Comfort rooms offer a clean, simple style, comfortable beds and everything you need to feel at home.',
      },
      maxOccupancy: 2,
      bed: { fr: 'Lit simple, double ou lits jumeaux', en: 'Single, double or twin' },
      view: { fr: 'Rue ou cour', en: 'Street or courtyard' },
      features: [
        { fr: 'Literie confortable', en: 'Comfortable beds' },
        { fr: 'Tablette en chambre', en: 'In-room tablet' },
        { fr: 'Wi-Fi gratuit très haut débit', en: 'Free high-speed Wi-Fi' },
        { fr: 'Accès par ascenseur', en: 'Lift access' },
      ],
      images: [IMG.comfort, IMG.comfortTwin, IMG.double, IMG.comfortSingle],
    },
  ],
  offers: [
    {
      slug: 'reservez-en-direct',
      order: 1,
      title: { fr: 'Réservez en direct', en: 'Book direct' },
      highlight: { fr: 'Meilleures conditions', en: 'Best conditions' },
      summary: {
        fr: 'En réservant directement auprès de l’hôtel, vous bénéficiez des meilleures conditions et d’un interlocuteur unique pour tout votre séjour.',
        en: 'Book directly with the hotel for the best conditions and a single point of contact for your whole stay.',
      },
      conditions: { fr: 'Par téléphone ou par e-mail auprès de la réception.', en: 'By phone or email with reception.' },
      image: IMG.view,
      cta: { label: { fr: 'Nous contacter', en: 'Contact us' }, href: 'contact' },
    },
  ],
  posts,
  reviews,
  pages,
}
