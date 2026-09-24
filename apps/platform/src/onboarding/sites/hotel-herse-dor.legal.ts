import type { PageInput } from '../types'

/**
 * Legal pages for customer zero. Company details come from the hotel's current legal notice
 * (www.hotel-herse-dor.com/mentions-legales, fetched 24 Sep 2026). DRAFTS for the owner to
 * validate before the site replaces the old one; they are not legal advice.
 */
const DRAFT_NOTE = {
  fr: 'Version de travail à valider par l’exploitant.',
  en: 'Working draft, to be validated by the hotel.',
}

export const legalNotice: PageInput = {
  slug: 'mentions-legales',
  navOrder: 90,
  showInNav: false,
  showInFooter: true,
  title: { fr: 'Mentions légales', en: 'Legal notice' },
  seo: { description: { fr: 'Mentions légales du site de l’Hôtel de la Herse d’Or.', en: 'Legal notice for the Hôtel de la Herse d’Or website.' } },
  blocks: [
    {
      blockType: 'text',
      heading: { fr: 'Mentions légales', en: 'Legal notice' },
      body: {
        fr: [
          '## Éditeur du site',
          'Hôtel de la Herse d’Or, SAS au capital de 38 112,25 €',
          '20 rue Saint-Antoine, 75004 Paris, France',
          'SIRET 632 035 911 00015 · RCS Paris B 632 035 911 · TVA intracommunautaire FR51632035911',
          'Directeur de la publication : M. Kamel Soussi',
          'Contact : info@hotel-herse-dor.com · +33 1 48 87 84 09',
          '## Hébergement',
          'Le site est servi par la plateforme Hotelier Website Platform (xedge), hébergée sur Tencent Cloud EdgeOne (région Francfort, Allemagne). Les données du site sont stockées chez Neon (région Francfort, Allemagne).',
          '## Propriété intellectuelle',
          'Les textes et photographies de ce site appartiennent à l’Hôtel de la Herse d’Or, sauf mention contraire. Toute reproduction sans autorisation écrite est interdite.',
          '## Réservations',
          'Ce site présente l’hôtel. Les réservations se font directement auprès de la réception, par téléphone ou par e-mail.',
          DRAFT_NOTE.fr,
        ].join('\n\n'),
        en: [
          '## Publisher',
          'Hôtel de la Herse d’Or, a French SAS with share capital of €38,112.25',
          '20 rue Saint-Antoine, 75004 Paris, France',
          'SIRET 632 035 911 00015 · RCS Paris B 632 035 911 · EU VAT FR51632035911',
          'Publication director: Mr Kamel Soussi',
          'Contact: info@hotel-herse-dor.com · +33 1 48 87 84 09',
          '## Hosting',
          'The site is served by the Hotelier Website Platform (xedge), hosted on Tencent Cloud EdgeOne (Frankfurt region, Germany). Site data is stored with Neon (Frankfurt region, Germany).',
          '## Intellectual property',
          'Texts and photographs on this site belong to Hôtel de la Herse d’Or unless stated otherwise. Reproduction without written permission is prohibited.',
          '## Bookings',
          'This site presents the hotel. Bookings are made directly with reception, by phone or email.',
          DRAFT_NOTE.en,
        ].join('\n\n'),
      },
    },
  ],
}

export const privacy: PageInput = {
  slug: 'confidentialite',
  navOrder: 91,
  showInNav: false,
  showInFooter: true,
  title: { fr: 'Confidentialité & cookies', en: 'Privacy & cookies' },
  seo: { description: { fr: 'Politique de confidentialité et cookies de l’Hôtel de la Herse d’Or.', en: 'Privacy and cookie policy of Hôtel de la Herse d’Or.' } },
  blocks: [
    {
      blockType: 'text',
      heading: { fr: 'Confidentialité & cookies', en: 'Privacy & cookies' },
      body: {
        fr: [
          '## Responsable du traitement',
          'Hôtel de la Herse d’Or, 20 rue Saint-Antoine, 75004 Paris · info@hotel-herse-dor.com',
          '## Aucun cookie, aucun traceur',
          'Ce site ne dépose aucun cookie et n’utilise aucun outil de mesure d’audience ni de publicité. Aucun bandeau de consentement n’est donc nécessaire.',
          '## Carte',
          'La page Contact affiche une carte OpenStreetMap. Lorsque vous la consultez, votre navigateur contacte les serveurs d’OpenStreetMap, qui reçoivent votre adresse IP selon leur propre politique de confidentialité.',
          '## Données que vous nous transmettez',
          'Si vous nous écrivez ou nous appelez, nous utilisons vos coordonnées uniquement pour vous répondre et préparer votre séjour. Elles ne sont ni vendues ni cédées.',
          '## Journaux techniques',
          'Comme tout site web, l’hébergeur conserve brièvement des journaux techniques (adresse IP, page demandée) pour la sécurité et le bon fonctionnement du service.',
          '## Vos droits',
          'Vous pouvez demander l’accès, la rectification ou l’effacement de vos données en écrivant à info@hotel-herse-dor.com. Vous pouvez aussi saisir la CNIL (www.cnil.fr).',
          DRAFT_NOTE.fr,
        ].join('\n\n'),
        en: [
          '## Controller',
          'Hôtel de la Herse d’Or, 20 rue Saint-Antoine, 75004 Paris · info@hotel-herse-dor.com',
          '## No cookies, no trackers',
          'This site sets no cookies and uses no analytics or advertising tools, so no consent banner is needed.',
          '## Map',
          'The Contact page shows an OpenStreetMap map. When you view it, your browser contacts OpenStreetMap’s servers, which receive your IP address under their own privacy policy.',
          '## Information you send us',
          'If you write to or call us, we use your details only to reply and prepare your stay. They are never sold or passed on.',
          '## Technical logs',
          'Like any website, the host briefly keeps technical logs (IP address, page requested) for security and reliable service.',
          '## Your rights',
          'You can ask to access, correct or erase your data by writing to info@hotel-herse-dor.com. You can also contact the French data protection authority, CNIL (www.cnil.fr).',
          DRAFT_NOTE.en,
        ].join('\n\n'),
      },
    },
  ],
}

export const accessibility: PageInput = {
  slug: 'accessibilite',
  navOrder: 92,
  showInNav: false,
  showInFooter: true,
  title: { fr: 'Accessibilité', en: 'Accessibility' },
  seo: { description: { fr: 'Déclaration d’accessibilité du site de l’Hôtel de la Herse d’Or.', en: 'Accessibility statement for the Hôtel de la Herse d’Or website.' } },
  blocks: [
    {
      blockType: 'text',
      heading: { fr: 'Déclaration d’accessibilité', en: 'Accessibility statement' },
      body: {
        fr: [
          '## Notre engagement',
          'Nous voulons que ce site soit utilisable par tous. Il vise le niveau AA des règles WCAG 2.2.',
          '## État de conformité',
          'Le site n’a pas encore fait l’objet d’un audit complet. En attendant, il est conçu avec une structure de titres claire, des textes alternatifs sur les images, une navigation au clavier et des contrastes suffisants.',
          '## À l’hôtel',
          'L’hôtel dispose d’un ascenseur accessible aux personnes à mobilité réduite. N’hésitez pas à nous préciser vos besoins avant votre arrivée.',
          '## Nous signaler un problème',
          'Si un contenu vous est inaccessible, écrivez à info@hotel-herse-dor.com ou appelez le +33 1 48 87 84 09 : nous vous transmettrons l’information sous une autre forme.',
          DRAFT_NOTE.fr,
        ].join('\n\n'),
        en: [
          '## Our commitment',
          'We want this site to work for everyone. It aims for WCAG 2.2 level AA.',
          '## Compliance status',
          'The site has not had a full audit yet. Meanwhile it is built with a clear heading structure, text alternatives on images, keyboard navigation and sufficient contrast.',
          '## At the hotel',
          'The hotel has a lift accessible to guests with reduced mobility. Please tell us about your needs before you arrive.',
          '## Report a problem',
          'If any content is not accessible to you, email info@hotel-herse-dor.com or call +33 1 48 87 84 09 and we will provide the information another way.',
          DRAFT_NOTE.en,
        ].join('\n\n'),
      },
    },
  ],
}
