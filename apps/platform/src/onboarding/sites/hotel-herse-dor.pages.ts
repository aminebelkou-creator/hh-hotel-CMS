import type { PageInput } from '../types'
import { IMG } from './hotel-herse-dor.images'
import { accessibility, legalNotice, privacy } from './hotel-herse-dor.legal'

const home: PageInput = {
  slug: 'home',
  navOrder: 0,
  showInNav: false,
  title: { fr: 'Hôtel de la Herse d’Or · Hôtel 3 étoiles dans le Marais, Paris', en: 'Hôtel de la Herse d’Or · 3-star hotel in the Marais, Paris' },
  navLabel: { fr: 'Accueil', en: 'Home' },
  seo: {
    description: {
      fr: 'Hôtel 3 étoiles au cœur du Marais, entre la Bastille et la place des Vosges. 29 chambres rénovées, réception 24h/24, petit-déjeuner buffet.',
      en: '3-star hotel in the heart of the Marais, between Bastille and Place des Vosges. 29 renovated rooms, 24-hour reception, breakfast buffet.',
    },
  },
  blocks: [
    {
      blockType: 'hero',
      heading: { fr: 'Au cœur du Marais, depuis 1790', en: 'In the heart of the Marais, since 1790' },
      subheading: {
        fr: 'Authenticité, confort et modernité, à deux pas de la place des Vosges et de la Bastille.',
        en: 'Authenticity, comfort and modern ease, a short walk from Place des Vosges and Bastille.',
      },
      image: IMG.lounge,
      cta: { label: { fr: 'Découvrir les chambres', en: 'Discover the rooms' }, href: 'chambres' },
      // Stars from the confirmed classification fact; the bar opens the site's Book link with the dates (no booking logic).
      rating: 'classification',
      bookingBar: true,
    },
    {
      blockType: 'quote',
      text: { fr: 'Respirer Paris, cela conserve l’âme.', en: 'To breathe Paris preserves the soul.' },
      author: { fr: 'Victor Hugo, ancien voisin de l’hôtel', en: 'Victor Hugo, the hotel’s former neighbour' },
    },
    {
      blockType: 'textImage',
      eyebrow: { fr: 'L’hôtel', en: 'The hotel' },
      heading: { fr: 'Une maison typique du Marais', en: 'A typical Marais house' },
      body: {
        fr: 'Victor Hugo habita la place des Vosges de 1832 à 1848, et ce n’était certainement pas un hasard. Idéalement située dans le Marais, à deux pas de la place de la Bastille, la Herse d’Or vous accueille dans le cœur historique et romanesque de la capitale.\n\nHôtel depuis 1790, la maison a gardé ses pierres, ses poutres et ses cours. Entièrement rénovée en 2023, elle dispose désormais d’un ascenseur accessible aux personnes à mobilité réduite.',
        en: 'Victor Hugo lived on Place des Vosges from 1832 to 1848, and surely not by chance. Right in the Marais, a few steps from Place de la Bastille, the Herse d’Or welcomes you in the historic, romantic heart of Paris.\n\nA hotel since 1790, the house has kept its stone, its beams and its courtyards. Fully renovated in 2023, it now has a lift accessible to guests with reduced mobility.',
      },
      image: IMG.breakfastRoom,
      imagePosition: 'right',
      link: { label: { fr: 'Nos services', en: 'Our services' }, href: 'services' },
    },
    {
      blockType: 'banners',
      eyebrow: { fr: 'La maison', en: 'The house' },
      heading: { fr: 'Deux catégories, 29 chambres, un seul quartier : le Marais.', en: 'Two categories, 29 rooms, one neighbourhood: the Marais.' },
      items: [
        { image: IMG.supWide, title: { fr: 'Chambres Supérieures', en: 'Superior rooms' }, href: 'chambres' },
        { image: IMG.comfortTwin, title: { fr: 'Chambres Confort', en: 'Comfort rooms' }, href: 'chambres' },
        { image: IMG.buffet, title: { fr: 'Petit-déjeuner', en: 'Breakfast' }, href: 'services' },
        { image: IMG.patio, title: { fr: 'La cour intérieure', en: 'The inner courtyard' } },
      ],
    },
    {
      blockType: 'rooms',
      heading: { fr: 'Chambres & équipements', en: 'Rooms & amenities' },
      link: { label: { fr: 'Toutes les chambres', en: 'All the rooms' }, href: 'chambres' },
      intro: {
        fr: '29 chambres en deux catégories, Supérieure et Confort : simple, double ou triple, communicantes, vue sur rue, sur cour ou sous les toits.',
        en: '29 rooms in two categories, Superior and Comfort: single, double or triple, connecting, overlooking the street, the courtyard or under the roofs.',
      },
      layout: 'cards',
    },
    {
      blockType: 'features',
      heading: { fr: 'Pour un séjour sans souci', en: 'For an easy stay' },
      items: [
        { icon: 'clock', title: { fr: 'Réception 24h/24', en: '24-hour reception' }, text: { fr: 'Idéal pour les arrivées tardives, avec une équipe multilingue.', en: 'Ideal for late arrivals, with a multilingual team.' } },
        { icon: 'tablet', title: { fr: 'Self check-in', en: 'Self check-in' }, text: { fr: 'Enregistrez-vous à la borne ou sur votre téléphone, sans attente.', en: 'Check in at the kiosk or on your phone, with no queue.' } },
        { icon: 'coffee', title: { fr: 'Petit-déjeuner buffet', en: 'Breakfast buffet' }, text: { fr: 'Un buffet « à la française », avec des produits locaux et bio.', en: 'A French-style buffet with local and organic produce.' } },
        { icon: 'tablet', title: { fr: 'Tablette en chambre', en: 'In-room tablet' }, text: { fr: 'Réception, services et bonnes adresses, depuis votre lit.', en: 'Reception, services and local tips, from your bed.' } },
        { icon: 'wifi', title: { fr: 'Wi-Fi très haut débit', en: 'High-speed Wi-Fi' }, text: { fr: 'Gratuit et illimité dans tout l’hôtel.', en: 'Free and unlimited throughout the hotel.' } },
        { icon: 'paw', title: { fr: 'Animaux bienvenus', en: 'Pets welcome' }, text: { fr: 'Chiens et chats acceptés.', en: 'Dogs and cats accepted.' } },
      ],
    },
    { blockType: 'mediaBand', image: IMG.view },
    {
      blockType: 'gallery',
      heading: { fr: 'En images', en: 'In pictures' },
      images: [IMG.patio, IMG.sup, IMG.buffet, IMG.lift, IMG.comfort, IMG.stone],
    },
    {
      blockType: 'cta',
      heading: { fr: 'Réservez en direct', en: 'Book direct' },
      text: {
        fr: 'En réservant directement auprès de l’hôtel, vous bénéficiez des meilleures conditions et d’un interlocuteur unique pour tout votre séjour.',
        en: 'Book directly with the hotel for the best conditions and a single point of contact for your whole stay.',
      },
      button: { label: { fr: 'Nous contacter', en: 'Contact us' }, href: 'contact' },
      image: IMG.view,
    },
  ],
}

const rooms: PageInput = {
  slug: 'chambres',
  navOrder: 1,
  title: { fr: 'Chambres', en: 'Rooms' },
  seo: {
    description: {
      fr: 'Chambres Supérieure et Confort rénovées, simples, doubles ou triples, au cœur du Marais.',
      en: 'Renovated Superior and Comfort rooms, single, double or triple, in the heart of the Marais.',
    },
  },
  blocks: [
    {
      blockType: 'hero',
      heading: { fr: 'Nos chambres', en: 'Our rooms' },
      subheading: { fr: 'Deux catégories, 29 chambres, un seul quartier : le Marais.', en: 'Two categories, 29 rooms, one neighbourhood: the Marais.' },
      image: IMG.supWide,
    },
    {
      blockType: 'rooms',
      intro: {
        fr: 'Récemment rénovées, nos deux catégories offrent confort et modernité. Que vous choisissiez l’une ou l’autre, vous vivrez le Marais : par la vue sur l’antique rue Saint-Antoine, ou par l’architecture d’une maison de plus de deux cents ans.',
        en: 'Recently renovated, both categories offer comfort and modern ease. Whichever you choose, you live the Marais: through the view of historic rue Saint-Antoine, or through the architecture of a house more than two hundred years old.',
      },
      layout: 'detailed',
    },
    {
      blockType: 'offers',
      heading: { fr: 'Nos offres', en: 'Our offers' },
      limit: 3,
    },
    {
      blockType: 'cta',
      heading: { fr: 'Une question sur votre chambre ?', en: 'A question about your room?' },
      text: { fr: 'Notre équipe vous répond à toute heure.', en: 'Our team answers at any time of day or night.' },
      button: { label: { fr: 'Nous contacter', en: 'Contact us' }, href: 'contact' },
    },
  ],
}

const services: PageInput = {
  slug: 'services',
  navOrder: 2,
  title: { fr: 'Hôtel & services', en: 'Hotel & services' },
  navLabel: { fr: 'Services', en: 'Services' },
  seo: {
    description: {
      fr: 'Petit-déjeuner buffet, réception 24h/24, self check-in, consigne à bagages, animaux acceptés : les services de la Herse d’Or.',
      en: 'Breakfast buffet, 24-hour reception, self check-in, luggage storage, pets welcome: services at the Herse d’Or.',
    },
  },
  blocks: [
    {
      blockType: 'hero',
      heading: { fr: 'Hôtel & services', en: 'Hotel & services' },
      subheading: { fr: 'Le charme d’une maison de 1790, le confort d’aujourd’hui.', en: 'The charm of a 1790 house, today’s comforts.' },
      image: IMG.breakfastRoom,
    },
    {
      blockType: 'textImage',
      eyebrow: { fr: 'Petit-déjeuner', en: 'Breakfast' },
      heading: { fr: 'Un buffet à la française', en: 'A French-style buffet' },
      body: {
        fr: 'Servi de 7h à 10h30 en salle : boissons chaudes, viennoiseries, jus d’orange pressé, pains, confitures et miel, fruits secs, yaourts, fromages, compote et fruits frais. Certains produits sont locaux et bio, par engagement pour les circuits courts.\n\nLe petit-déjeuner peut aussi être servi en chambre sur plateau, à réserver la veille avant 18h.',
        en: 'Served from 7:00 to 10:30 in the breakfast room: hot drinks, pastries, freshly squeezed orange juice, breads, jams and honey, dried fruit, yoghurts, cheeses, compote and fresh fruit. Some products are local and organic, in support of short supply chains.\n\nBreakfast can also be served on a tray in your room; order it the day before by 18:00.',
      },
      image: IMG.buffet,
      imagePosition: 'right',
    },
    {
      blockType: 'textImage',
      eyebrow: { fr: 'Arrivée & départ', en: 'Arrival & departure' },
      heading: { fr: 'Self check-in et check-out', en: 'Self check-in and check-out' },
      body: {
        fr: 'Enregistrez-vous et récupérez votre clé en toute autonomie, à la borne de la réception ou depuis votre propre appareil. La réception reste ouverte 24h/24 et notre équipe multilingue est là pour vous conseiller.',
        en: 'Check in and collect your key on your own, at the kiosk in reception or from your own device. Reception stays open 24 hours a day and our multilingual team is on hand with advice.',
      },
      image: IMG.kiosk,
      imagePosition: 'left',
      points: [
        { fr: 'Consigne à bagages gratuite.', en: 'Free luggage storage.' },
        { fr: 'Réservation de taxis pour les aéroports.', en: 'Taxi booking for the airports.' },
        { fr: 'Ascenseur accessible aux personnes à mobilité réduite.', en: 'Lift accessible to guests with reduced mobility.' },
        { fr: 'Parking public couvert et gardé à proximité.', en: 'Covered, attended public car park nearby.' },
      ],
    },
    {
      blockType: 'features',
      heading: { fr: 'Tous nos services', en: 'All our services' },
      items: [
        { icon: 'clock', title: { fr: 'Réception 24h/24', en: '24-hour reception' } },
        { icon: 'wifi', title: { fr: 'Wi-Fi gratuit et illimité', en: 'Free unlimited Wi-Fi' }, text: { fr: 'Très haut débit, et prise Ethernet en chambre.', en: 'High speed, plus an Ethernet socket in the room.' } },
        { icon: 'lift', title: { fr: 'Ascenseur', en: 'Lift' }, text: { fr: 'Accessible aux personnes à mobilité réduite.', en: 'Accessible to guests with reduced mobility.' } },
        { icon: 'snowflake', title: { fr: 'Climatisation', en: 'Air conditioning' } },
        { icon: 'paw', title: { fr: 'Animaux acceptés', en: 'Pets accepted' }, text: { fr: 'Chiens et chats, avec supplément.', en: 'Dogs and cats, for a supplement.' } },
        { icon: 'key', title: { fr: 'Consigne à bagages gratuite', en: 'Free luggage storage' } },
        { icon: 'car', title: { fr: 'Réservation de taxis', en: 'Taxi booking' }, text: { fr: 'Aéroports et autres trajets.', en: 'Airports and other journeys.' } },
        { icon: 'car', title: { fr: 'Parking public à proximité', en: 'Public car park nearby' }, text: { fr: 'Couvert et gardé, 45 rue du Faubourg Saint-Antoine.', en: 'Covered and guarded, 45 rue du Faubourg Saint-Antoine.' } },
        { icon: 'leaf', title: { fr: 'Hôtel non-fumeur', en: 'Non-smoking hotel' } },
      ],
    },
    {
      blockType: 'policies',
      heading: { fr: 'Bon à savoir', en: 'Good to know' },
      showTimes: true,
      items: [
        { title: { fr: 'Petit-déjeuner', en: 'Breakfast' }, text: { fr: 'Buffet de 7h à 10h30 ; en chambre sur réservation la veille avant 18h.', en: 'Buffet from 7:00 to 10:30; in your room if ordered the day before by 18:00.' } },
        { title: { fr: 'Animaux', en: 'Pets' }, text: { fr: 'Chiens et chats acceptés, avec supplément.', en: 'Dogs and cats welcome, for a supplement.' } },
        { title: { fr: 'Bagages', en: 'Luggage' }, text: { fr: 'Consigne gratuite avant l’arrivée et après le départ.', en: 'Free storage before check-in and after check-out.' } },
        { title: { fr: 'Tabac', en: 'Smoking' }, text: { fr: 'Hôtel entièrement non-fumeur.', en: 'The whole hotel is non-smoking.' } },
        { title: { fr: 'Réception', en: 'Reception' }, text: { fr: 'Ouverte 24h/24, équipe multilingue.', en: 'Open 24 hours, multilingual team.' } },
      ],
    },
  ],
}

const area: PageInput = {
  slug: 'quartier',
  navOrder: 3,
  title: { fr: 'Le quartier', en: 'The neighbourhood' },
  navLabel: { fr: 'Quartier', en: 'Neighbourhood' },
  seo: {
    description: {
      fr: 'Rue Saint-Antoine, à 100 m de la place des Vosges et 200 m de la Bastille. Accès métro, bus, RER et depuis les aéroports.',
      en: 'Rue Saint-Antoine, 100 m from Place des Vosges and 200 m from Bastille. Getting here by metro, bus, RER and from the airports.',
    },
  },
  blocks: [
    {
      blockType: 'hero',
      heading: { fr: 'Le Marais, à pied', en: 'The Marais, on foot' },
      subheading: {
        fr: 'Place des Vosges à 100 m, Bastille à 200 m, Notre-Dame et le Louvre à moins de 20 minutes de marche.',
        en: 'Place des Vosges 100 m away, Bastille 200 m, Notre-Dame and the Louvre under 20 minutes on foot.',
      },
      image: IMG.view,
    },
    {
      blockType: 'textImage',
      heading: { fr: 'Une adresse privilégiée', en: 'An exceptional address' },
      body: {
        fr: 'Le Marais, quartier historique, culturel mais aussi tendance et festif, doit son charme à la richesse de son architecture et de son histoire. À quelques mètres de la place de la Bastille et de son Opéra, à deux pas de la place des Vosges où Victor Hugo résida seize ans (sa maison se visite gratuitement).\n\nTout près : le musée Carnavalet, le musée Picasso, la rue des Rosiers, les grands magasins de la rue de Rivoli, le Centre Pompidou, l’île de la Cité et l’île Saint-Louis. Valsez au gré de vos envies, sans forcément prendre le métro.',
        en: 'The Marais, historic and cultural but also lively and fashionable, owes its charm to its architecture and its history. A few metres from Place de la Bastille and its opera house, a short walk from Place des Vosges, where Victor Hugo lived for sixteen years (his house is free to visit).\n\nClose by: the Carnavalet and Picasso museums, rue des Rosiers, the shops of rue de Rivoli, the Centre Pompidou, Île de la Cité and Île Saint-Louis. Wander wherever you like, often without taking the metro.',
      },
      image: IMG.patio,
      imagePosition: 'left',
    },
    {
      blockType: 'features',
      heading: { fr: 'Venir à l’hôtel', en: 'Getting here' },
      items: [
        { title: { fr: 'Métro', en: 'Metro' }, text: { fr: 'Lignes 1, 5 et 8 : Bastille. Ligne 1 : Saint-Paul.', en: 'Lines 1, 5 and 8: Bastille. Line 1: Saint-Paul.' } },
        { title: { fr: 'Bus', en: 'Bus' }, text: { fr: '20, 29, 65, 76, 87, 91 : Bastille.', en: '20, 29, 65, 76, 87, 91: Bastille.' } },
        { title: { fr: 'RER', en: 'RER' }, text: { fr: 'RER A : Gare de Lyon. RER B : Châtelet.', en: 'RER A: Gare de Lyon. RER B: Châtelet.' } },
        { title: { fr: 'Depuis Roissy-CDG', en: 'From Charles de Gaulle' }, text: { fr: 'RER B jusqu’à Châtelet, puis ligne 1 direction Château de Vincennes jusqu’à Bastille.', en: 'RER B to Châtelet, then line 1 towards Château de Vincennes to Bastille.' } },
        { title: { fr: 'Depuis Orly', en: 'From Orly' }, text: { fr: 'OrlyVal jusqu’à Antony, RER B jusqu’à Châtelet, puis ligne 1 jusqu’à Bastille.', en: 'OrlyVal to Antony, RER B to Châtelet, then line 1 to Bastille.' } },
        { title: { fr: 'En voiture', en: 'By car' }, text: { fr: 'Parking public couvert et gardé au 45 rue du Faubourg Saint-Antoine, à moins de 10 minutes à pied.', en: 'Covered, guarded public car park at 45 rue du Faubourg Saint-Antoine, under 10 minutes’ walk.' } },
      ],
    },
    { blockType: 'map', heading: { fr: 'Sur le plan', en: 'On the map' }, zoom: 16 },
  ],
}

const gallery: PageInput = {
  slug: 'galerie',
  navOrder: 4,
  title: { fr: 'Galerie', en: 'Gallery' },
  blocks: [
    {
      blockType: 'gallery',
      heading: { fr: 'Galerie', en: 'Gallery' },
      images: [IMG.lounge, IMG.sup, IMG.patio, IMG.buffet, IMG.supTriple, IMG.lift, IMG.comfort, IMG.stone, IMG.bath, IMG.twin, IMG.buffetBar, IMG.double, IMG.tablet, IMG.comfortTwin, IMG.breakfastRoom, IMG.view],
    },
  ],
}

const contact: PageInput = {
  slug: 'contact',
  navOrder: 5,
  title: { fr: 'Contact', en: 'Contact' },
  seo: {
    description: {
      fr: 'Contactez l’Hôtel de la Herse d’Or, 20 rue Saint-Antoine, 75004 Paris. Réception ouverte 24h/24.',
      en: 'Contact Hôtel de la Herse d’Or, 20 rue Saint-Antoine, 75004 Paris. Reception open 24 hours a day.',
    },
  },
  blocks: [
    {
      blockType: 'contact',
      heading: { fr: 'Nous contacter', en: 'Contact us' },
      intro: {
        fr: 'Pour réserver, poser une question ou organiser votre séjour, appelez-nous ou écrivez-nous : la réception est ouverte 24h/24.\n\nEn réservant directement auprès de l’hôtel, vous bénéficiez des meilleures conditions et d’un interlocuteur unique.',
        en: 'To book, ask a question or plan your stay, call or write to us: reception is open 24 hours a day.\n\nBooking directly with the hotel gets you the best conditions and a single point of contact.',
      },
    },
    { blockType: 'map', zoom: 16 },
    {
      blockType: 'faq',
      heading: { fr: 'Questions fréquentes', en: 'Frequently asked questions' },
      items: [
        { question: { fr: 'À quelle heure puis-je arriver et partir ?', en: 'What time can I check in and out?' }, answer: { fr: 'Les chambres sont disponibles à partir de 15h30 et doivent être libérées avant 11h. La réception est ouverte 24h/24 et garde vos bagages gratuitement.', en: 'Rooms are ready from 15:30 and must be vacated by 11:00. Reception is open 24 hours and keeps your luggage free of charge.' } },
        { question: { fr: 'Le petit-déjeuner est-il inclus ?', en: 'Is breakfast included?' }, answer: { fr: 'Le buffet est servi de 7h à 10h30. Demandez à la réception s’il est inclus dans votre tarif.', en: 'The buffet is served from 7:00 to 10:30. Ask reception whether it is included in your rate.' } },
        { question: { fr: 'L’hôtel est-il accessible ?', en: 'Is the hotel accessible?' }, answer: { fr: 'Oui, l’ascenseur est accessible aux personnes à mobilité réduite. Précisez-nous vos besoins avant l’arrivée.', en: 'Yes, the lift is accessible to guests with reduced mobility. Let us know your needs before you arrive.' } },
        { question: { fr: 'Où se garer ?', en: 'Where can I park?' }, answer: { fr: 'Un parking public couvert et gardé se trouve 45 rue du Faubourg Saint-Antoine, à quelques minutes à pied.', en: 'A covered, guarded public car park is at 45 rue du Faubourg Saint-Antoine, a few minutes’ walk away.' } },
        { question: { fr: 'Comment venir ?', en: 'How do I get here?' }, answer: { fr: 'Métro Bastille (lignes 1, 5 et 8) ou Saint-Paul (ligne 1), à quelques pas de l’hôtel. Nous pouvons réserver un taxi pour les aéroports.', en: 'Bastille metro (lines 1, 5 and 8) or Saint-Paul (line 1), a short walk away. We can book a taxi to the airports.' } },
      ],
    },
  ],
}

export const pages: PageInput[] = [home, rooms, services, area, gallery, contact, legalNotice, privacy, accessibility]
