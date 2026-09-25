import type { PostInput } from '../types'
import { IMG } from './hotel-herse-dor.images'

/**
 * First blog posts of the Hôtel de la Herse d'Or: the neighbourhood, written by us on
 * 25 Sep 2026 from the hotel's own confirmed page (addresses, metro, Victor Hugo 1832-1848)
 * and checked public sources (museum and cathedral sites, Paris city, Wikipedia for dates).
 * No prices. Opening days are the institutions' own and may change: the posts say so.
 * Walking times: straight-line distance from the hotel's coordinates x 1.3, at a relaxed pace.
 * Covers are the hotel's own photos (no third-party images), their alt text describes them.
 * Stored as `generated`: the owner's first edit makes a post `human` and it is never rewritten.
 */
export const posts: PostInput[] = [
  {
    slug: 'le-marais-a-pied',
    publishedAt: '2026-09-25T12:00:00.000Z',
    title: { fr: 'Le Marais à pied depuis la Herse d’Or', en: 'The Marais on foot from the Herse d’Or' },
    excerpt: {
      fr: 'Place des Vosges, Bastille, musées Carnavalet et Picasso, Notre-Dame : depuis la rue Saint-Antoine, presque tout se fait à pied. Nos repères, classés par temps de marche.',
      en: 'Place des Vosges, Bastille, the Carnavalet and Picasso museums, Notre-Dame: from rue Saint-Antoine almost everything is within walking distance. Our landmarks, by walking time.',
    },
    image: IMG.view,
    body: {
      fr: [
        'L’hôtel se trouve au 20, rue Saint-Antoine, entre la place de la Bastille et la place des Vosges. C’est l’un des rares endroits de Paris d’où l’on peut presque tout découvrir à pied. Voici nos repères, du plus proche au plus lointain. Les temps de marche sont donnés à titre indicatif, sans se presser.',
        '## À moins de 5 minutes',
        '- La place des Vosges et la maison de Victor Hugo\n- La place de la Bastille et la colonne de Juillet\n- L’Opéra Bastille',
        '## De 5 à 10 minutes',
        '- L’hôtel de Sully et son jardin, qui ouvre sur la place des Vosges\n- Le Village Saint-Paul et ses cours intérieures\n- L’église Saint-Paul-Saint-Louis\n- Le port de l’Arsenal, au bord de l’eau\n- Le marché Bastille, le jeudi et le dimanche matin\n- Le musée Carnavalet, consacré à l’histoire de Paris',
        '## De 10 à 15 minutes',
        '- La rue des Rosiers, au cœur de l’ancien quartier juif du Marais\n- Le musée Picasso, installé dans l’hôtel Salé\n- L’île Saint-Louis\n- La Coulée verte René-Dumont, promenade plantée sur une ancienne voie ferrée',
        '## Une vingtaine de minutes',
        '- Notre-Dame de Paris et l’île de la Cité\n- L’Hôtel de Ville\n- Le Centre Pompidou',
        'Pour aller plus loin, le métro est à deux pas : Bastille (lignes 1, 5 et 8) et Saint-Paul (ligne 1). La réception, ouverte 24h/24, vous indique volontiers le meilleur itinéraire.',
      ].join('\n\n'),
      en: [
        'The hotel is at 20 rue Saint-Antoine, between Place de la Bastille and Place des Vosges. It is one of the few places in Paris from which you can see almost everything on foot. Here are our landmarks, from the closest to the furthest. Walking times are a guide, at a relaxed pace.',
        '## Under 5 minutes',
        '- Place des Vosges and Victor Hugo’s house\n- Place de la Bastille and the July Column\n- The Opéra Bastille',
        '## 5 to 10 minutes',
        '- The Hôtel de Sully and its garden, which opens onto Place des Vosges\n- The Village Saint-Paul and its inner courtyards\n- The church of Saint-Paul-Saint-Louis\n- The Port de l’Arsenal, by the water\n- The Bastille market, on Thursday and Sunday mornings\n- The Carnavalet museum, devoted to the history of Paris',
        '## 10 to 15 minutes',
        '- Rue des Rosiers, at the heart of the Marais’ old Jewish quarter\n- The Picasso museum, in the Hôtel Salé\n- Île Saint-Louis\n- The Coulée verte René-Dumont, a planted walkway on a former railway line',
        '## About 20 minutes',
        '- Notre-Dame de Paris and Île de la Cité\n- The Hôtel de Ville\n- The Centre Pompidou',
        'To go further, the metro is a short walk away: Bastille (lines 1, 5 and 8) and Saint-Paul (line 1). Reception is open 24 hours and happy to suggest the best route.',
      ].join('\n\n'),
    },
  },
  {
    slug: 'place-des-vosges-victor-hugo',
    publishedAt: '2026-09-25T11:00:00.000Z',
    title: { fr: 'La place des Vosges, Victor Hugo et deux musées à quelques rues', en: 'Place des Vosges, Victor Hugo and two museums a few streets away' },
    excerpt: {
      fr: 'La plus ancienne place planifiée de Paris est à deux pas de l’hôtel. Son histoire, l’appartement de Victor Hugo, le passage secret de l’hôtel de Sully, et les musées Carnavalet et Picasso.',
      en: 'The oldest planned square in Paris is a short walk from the hotel. Its history, Victor Hugo’s apartment, the hidden passage through the Hôtel de Sully, and the Carnavalet and Picasso museums.',
    },
    image: IMG.stone,
    body: {
      fr: [
        'Voulue par Henri IV, construite de 1605 à 1612 et inaugurée sous le nom de place Royale, la place des Vosges aligne trente-six maisons de brique et de pierre autour d’un jardin. Au sud et au nord se font face le pavillon du Roi et le pavillon de la Reine. Elle doit son nom actuel, adopté en 1800, au département des Vosges, le premier à s’acquitter de l’impôt levé pour les armées de la Révolution.',
        '## Chez Victor Hugo',
        'Au numéro 6, Victor Hugo a vécu de 1832 à 1848. Son appartement est devenu la Maison de Victor Hugo, un musée de la Ville de Paris ouvert du mardi au dimanche. L’entrée des collections est habituellement gratuite, mais elle peut être payante pendant une exposition temporaire : mieux vaut vérifier sur le site du musée avant de venir.',
        '## Le passage de l’hôtel de Sully',
        'Depuis la rue Saint-Antoine, à quelques minutes de l’hôtel, poussez la porte de l’hôtel de Sully, demeure du XVIIe siècle. On traverse sa cour puis son jardin, et une porte au fond ouvre directement sur la place des Vosges. C’est notre façon préférée d’y arriver.',
        '## Deux musées à quelques rues',
        '- Le musée Carnavalet raconte l’histoire de Paris, de la préhistoire à nos jours. Ses collections permanentes sont gratuites, sans réservation, du mardi au dimanche de 10 h à 18 h.\n- Le musée Picasso occupe l’hôtel Salé, rue de Thorigny. Il est ouvert du mardi au dimanche, de 9 h 30 à 18 h, et gratuit pour tous le premier dimanche du mois.',
        'Horaires relevés en septembre 2026 sur les sites des musées ; ils peuvent changer.',
      ].join('\n\n'),
      en: [
        'Commissioned by Henri IV, built from 1605 to 1612 and inaugurated as the Place Royale, Place des Vosges lines up thirty-six brick and stone houses around a garden. The King’s Pavilion and the Queen’s Pavilion face each other on the south and north sides. It took its present name in 1800 from the Vosges département, the first to pay the tax raised for the armies of the Revolution.',
        '## At Victor Hugo’s',
        'Victor Hugo lived at number 6 from 1832 to 1848. His apartment is now the Maison de Victor Hugo, a City of Paris museum open Tuesday to Sunday. The collections are usually free, but entry may be charged during a temporary exhibition: check the museum’s website before you go.',
        '## Through the Hôtel de Sully',
        'On rue Saint-Antoine, a few minutes from the hotel, push open the door of the Hôtel de Sully, a 17th-century mansion. Cross its courtyard and garden, and a door at the far end opens straight onto Place des Vosges. It is our favourite way in.',
        '## Two museums a few streets away',
        '- The Carnavalet museum tells the history of Paris from prehistory to the present day. Its permanent collections are free, with no booking, Tuesday to Sunday from 10 am to 6 pm.\n- The Picasso museum is in the Hôtel Salé on rue de Thorigny. It opens Tuesday to Sunday from 9:30 am to 6 pm and is free for everyone on the first Sunday of the month.',
        'Opening times taken from the museums’ websites in September 2026; they may change.',
      ].join('\n\n'),
    },
  },
  {
    slug: 'bastille-marche-coulee-verte',
    publishedAt: '2026-09-25T10:00:00.000Z',
    title: { fr: 'La Bastille : la place, l’Opéra, le marché et la Coulée verte', en: 'Bastille: the square, the opera, the market and the Coulée verte' },
    excerpt: {
      fr: 'À trois minutes de l’hôtel, la place de la Bastille rassemble deux siècles d’histoire, un opéra, l’un des grands marchés de Paris et le départ d’une promenade plantée de 4,5 km.',
      en: 'Three minutes from the hotel, Place de la Bastille brings together two centuries of history, an opera house, one of the big Paris markets and the start of a 4.5 km planted walkway.',
    },
    image: IMG.lounge,
    body: {
      fr: [
        'La forteresse prise le 14 juillet 1789 a disparu, mais la place qui porte son nom reste l’un des carrefours de Paris. Au centre, la colonne de Juillet rend hommage aux révolutionnaires de juillet 1830, les Trois Glorieuses ; le Génie de la Liberté la domine.',
        '## L’Opéra Bastille',
        'Inauguré le 13 juillet 1989, pour le bicentenaire de la Révolution, l’Opéra Bastille accueille l’opéra et le ballet de l’Opéra national de Paris. Il est à quatre minutes à pied de l’hôtel.',
        '## Le marché Bastille',
        'Boulevard Richard-Lenoir, une centaine de commerçants s’installent le jeudi (de 7 h à 14 h 30 environ) et le dimanche (de 7 h à 15 h environ) : fromages, poissons, fruits et légumes, spécialités régionales. Parfait pour un pique-nique sur la place des Vosges.',
        '## La Coulée verte René-Dumont',
        'Près de l’Opéra, rue de Lyon, commence une promenade plantée de 4,5 km aménagée sur l’ancienne voie ferrée qui reliait la Bastille à Varenne-Saint-Maur. Elle court d’abord au-dessus des arcades du Viaduc des Arts, où travaillent artisans et créateurs, puis continue vers le bois de Vincennes.',
        '## Le port de l’Arsenal',
        'Entre la place et la Seine, le port de l’Arsenal abrite des bateaux de plaisance et un jardin au bord de l’eau : une halte calme, à cinq minutes de la rue Saint-Antoine.',
      ].join('\n\n'),
      en: [
        'The fortress stormed on 14 July 1789 has gone, but the square that bears its name is still one of the great crossroads of Paris. At its centre, the July Column honours the revolutionaries of July 1830, the Three Glorious Days; the Spirit of Freedom stands on top.',
        '## The Opéra Bastille',
        'Opened on 13 July 1989 for the bicentenary of the Revolution, the Opéra Bastille is home to the opera and ballet of the Opéra national de Paris. It is a four-minute walk from the hotel.',
        '## The Bastille market',
        'On boulevard Richard-Lenoir, about a hundred stallholders set up on Thursday (roughly 7 am to 2:30 pm) and Sunday (roughly 7 am to 3 pm): cheese, fish, fruit and vegetables, regional specialities. Perfect for a picnic on Place des Vosges.',
        '## The Coulée verte René-Dumont',
        'Near the opera house, on rue de Lyon, a 4.5 km planted walkway begins, laid out on the former railway line from Bastille to Varenne-Saint-Maur. It first runs above the arches of the Viaduc des Arts, home to craftspeople and designers, then continues towards the Bois de Vincennes.',
        '## The Port de l’Arsenal',
        'Between the square and the Seine, the Port de l’Arsenal shelters pleasure boats and a waterside garden: a quiet stop, five minutes from rue Saint-Antoine.',
      ].join('\n\n'),
    },
  },
  {
    slug: 'notre-dame-a-pied',
    publishedAt: '2026-09-25T09:00:00.000Z',
    title: { fr: 'Jusqu’à Notre-Dame à pied, par Saint-Paul et l’île Saint-Louis', en: 'To Notre-Dame on foot, by Saint-Paul and Île Saint-Louis' },
    excerpt: {
      fr: 'Une vingtaine de minutes de marche séparent l’hôtel de Notre-Dame, rouverte en décembre 2024. Notre itinéraire par le Village Saint-Paul, le pont Marie et l’île Saint-Louis.',
      en: 'Notre-Dame, reopened in December 2024, is about twenty minutes’ walk from the hotel. Our route through the Village Saint-Paul, the Pont Marie and Île Saint-Louis.',
    },
    image: IMG.patio,
    body: {
      fr: [
        'En sortant de l’hôtel, prenez la rue Saint-Antoine vers l’ouest. Sans flâner, il faut une vingtaine de minutes pour rejoindre le parvis de Notre-Dame ; en réalité, on met souvent bien plus longtemps, tant la route est belle.',
        '## Saint-Paul',
        'L’église Saint-Paul-Saint-Louis, bâtie par les jésuites au XVIIe siècle, se dresse sur la rue Saint-Antoine. Tout près, entre la rue Saint-Paul et la rue Charlemagne, le Village Saint-Paul relie une série de cours intérieures bordées de boutiques, d’antiquaires et de galeries.',
        '## L’île Saint-Louis',
        'Par le quai puis le pont Marie, on gagne l’île Saint-Louis, ses hôtels particuliers et sa rue commerçante, la rue Saint-Louis-en-l’Île. Au bout de l’île, le pont Saint-Louis mène sur l’île de la Cité, face au chevet de la cathédrale.',
        '## Notre-Dame',
        'Rouverte le 7 décembre 2024 après l’incendie de 2019, la cathédrale se visite gratuitement. Une réservation gratuite d’un créneau est possible sur le site officiel de la cathédrale ; elle aide à éviter l’attente. La montée aux tours est payante et se réserve à part.',
        'Au retour, laissez-vous guider par les ruelles du Marais : l’hôtel n’est jamais loin.',
      ].join('\n\n'),
      en: [
        'Leaving the hotel, head west along rue Saint-Antoine. Without stopping, it takes about twenty minutes to reach the square in front of Notre-Dame; in practice it usually takes much longer, because the way is so beautiful.',
        '## Saint-Paul',
        'The church of Saint-Paul-Saint-Louis, built by the Jesuits in the 17th century, stands on rue Saint-Antoine. Close by, between rue Saint-Paul and rue Charlemagne, the Village Saint-Paul links a series of inner courtyards lined with shops, antique dealers and galleries.',
        '## Île Saint-Louis',
        'Along the quay and over the Pont Marie you reach Île Saint-Louis, with its mansions and its shopping street, rue Saint-Louis-en-l’Île. At the end of the island, the Pont Saint-Louis leads onto Île de la Cité, facing the east end of the cathedral.',
        '## Notre-Dame',
        'Reopened on 7 December 2024 after the 2019 fire, the cathedral is free to visit. A free time-slot booking is available on the cathedral’s official website and helps you skip the queue. Climbing the towers is charged and booked separately.',
        'On the way back, let the lanes of the Marais guide you: the hotel is never far.',
      ].join('\n\n'),
    },
  },
]
