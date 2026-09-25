import type { ReviewInput } from '../types'

/**
 * Real Google reviews of the Hôtel de la Herse d'Or, sent by the owner as screenshots on
 * 25 Sep 2026 and typed in word for word (emoji kept; only paragraph breaks as shown).
 * Names shortened to the first name and initial. Month = "Visited in …" on Google (2026).
 * Google also shows sub-scores (rooms, service, location); only the overall score is kept.
 */
export const reviews: ReviewInput[] = [
  {
    key: 'google-auriane-m',
    order: 1,
    text: 'Super hôtel, très propre, avec un personnel absolument adorable et très bien situé. La literie est confortable et l’hôtel très propre, que ce soit les chambres ou la réception. Remerciement spécial à la personne de l’accueil qui m’a prêté son chargeur et qui a été absolument adorable.\n\nJe recommande vivement l’hôtel.',
    language: 'fr',
    author: 'Auriane M.',
    source: 'google',
    rating: 5,
    ratingScale: 5,
    visitedAt: '2026-05-15T12:00:00.000Z',
  },
  {
    key: 'google-cagan-y',
    order: 2,
    text: 'BOOK IT! its a very safe and center spot, also the staff were incredibly kind and helpful.\n\nthe rooms were very clean, and sheets/towels/trash regularly get changed. They also had AC which was lifesaving for the time i visited haha.\n\ni had a wonderful stay here 🙏 💜',
    language: 'en',
    author: 'Cagan Y.',
    source: 'google',
    rating: 5,
    ratingScale: 5,
    visitedAt: '2026-07-15T12:00:00.000Z',
  },
  {
    key: 'google-matthew-s',
    order: 3,
    text: 'Great location for this no frills hotel with clean rooms (quite small), decent common areas and a great locker service to store bags after or before check out. Very helpful manager and great aircon (much needed in the heatwave).',
    language: 'en',
    author: 'Matthew S.',
    source: 'google',
    rating: 5,
    ratingScale: 5,
    visitedAt: '2026-06-15T12:00:00.000Z',
  },
]
