import type { Img } from '../types'

/** The hotel's own photos, served from its current website until the media pipeline exists. */
const U = 'https://www.hotel-herse-dor.com/wp-content/uploads/'
const img = (path: string, fr: string, en: string): Img => ({ url: U + path, alt: { fr, en } })

export const IMG = {
  lounge: img('2023/10/c170d342-8206-4582-b1d5-ed46520d5a1f.jpeg', 'Le salon de l’hôtel, fauteuils verts et pierres apparentes', 'The hotel lounge with green armchairs and exposed stone'),
  breakfastRoom: img('2023/10/13e3f7a1-46a5-4aef-a680-34e103ceb274.jpeg', 'La salle du petit-déjeuner sous les poutres', 'The breakfast room under the wooden beams'),
  buffet: img('2024/02/1a33c9d5-22f7-4a05-bc34-f803bf28e354.jpeg', 'Le buffet du petit-déjeuner', 'The breakfast buffet'),
  buffetBar: img('2024/02/IMG-20231223-WA0004.jpg', 'Le bar du petit-déjeuner', 'The breakfast bar'),
  kiosk: img('2023/10/32c84478-a56c-451a-bd90-d35e91809cd9-e1696779136140.jpeg', 'La borne de self check-in', 'The self check-in kiosk'),
  lift: img('2023/10/4ee6b3ca-8cbf-43a3-9281-9d2dcc35f96b.jpeg', 'L’ascenseur et le hall', 'The lift and the lobby'),
  patio: img('2024/02/IMG-20231223-WA0002.jpg', 'La cour intérieure vitrée', 'The glass-roofed inner courtyard'),
  stone: img('2024/02/IMG-20231223-WA0008.jpg', 'Pierres d’origine dans la cour', 'Original stone walls in the courtyard'),
  view: img('2022/01/hero2.jpg', 'Vue sur les toits du Marais', 'A view over the rooftops of the Marais'),
  sup: img('2021/12/sup.jpg', 'Chambre Supérieure, lit double et poutres', 'Superior room, double bed and beams'),
  supBed: img('2020/11/chambre-superieure-sizel-5994-1600-1200.jpg', 'Chambre Supérieure, détail de la literie', 'Superior room, bedding detail'),
  supTriple: img('2020/11/chambre-triple-superieure-sizel-5983-1600-1200.jpg', 'Chambre Supérieure triple', 'Superior triple room'),
  supWide: img('2020/11/hotel-de-la-herse-d-or-accueil-size-7890-1400-1000.jpg', 'Chambre Supérieure lumineuse', 'A bright Superior room'),
  bath: img('2020/11/salle-de-bain-superieure-sizel-6014-1600-1200.jpg', 'Salle de bain d’une chambre Supérieure', 'Bathroom of a Superior room'),
  double: img('2024/02/da928a05-b1a7-487e-9685-784e98104c28.jpeg', 'Chambre double', 'Double room'),
  comfort: img('2022/02/eco2.jpg', 'Chambre Confort, lit double', 'Comfort room with a double bed'),
  comfortTwin: img('2021/12/cnfrt.jpg', 'Chambre Confort, lits jumeaux', 'Comfort room with twin beds'),
  comfortSingle: img('2022/02/eco1.jpg', 'Chambre Confort simple', 'Comfort single room'),
  twin: img('2024/02/IMG-20231223-WA0016.jpg', 'Chambre avec lits jumeaux', 'Twin room'),
  tablet: img('2024/08/WhatsApp-Image-2024-08-12-at-17.02.38.jpeg', 'La tablette en chambre', 'The in-room tablet'),
}

