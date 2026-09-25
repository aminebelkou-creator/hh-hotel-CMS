/**
 * Legal page set every generated site gets as footer DRAFTS (rule 9: only confirmed facts;
 * anything unknown is a visible "[à compléter]" for the hotel, never a guess):
 *   mentions légales · confidentialité & cookies · règlement intérieur et conditions de vente.
 * The texts are the platform's generic skeletons in the site's language, filled with the hotel's
 * facts; a lawyer reviews them before the site goes live (docs/compliance).
 */
import { all, first, type FactMap, type Locale } from './copy'

export type LegalKind = 'legal' | 'privacy' | 'terms'
export const LEGAL_SLUGS: Record<LegalKind, Record<Locale, string>> = {
  legal: { en: 'legal-notice', fr: 'mentions-legales', de: 'impressum', es: 'aviso-legal', it: 'note-legali' },
  privacy: { en: 'privacy', fr: 'confidentialite', de: 'datenschutz', es: 'privacidad', it: 'privacy' },
  terms: { en: 'house-rules-and-terms', fr: 'reglement-cgv', de: 'hausordnung-agb', es: 'normas-y-condiciones', it: 'regolamento-e-condizioni' },
}

const FILL = { fr: '[à compléter par l’hôtel]', en: '[to be completed by the hotel]' }
const NOTE = { fr: 'Version de travail à valider par l’exploitant et son conseil.', en: 'Working draft, to be validated by the hotel and its counsel.' }

export function legalCopy(f: FactMap, locale: Locale, hotelName: string): Record<LegalKind, { title: string; navLabel: string; description: string; blocks: { heading: string; body: string }[] }> {
  const fr = locale === 'fr'
  const L = fr ? 'fr' : 'en'
  const address = first(f, 'address') ?? FILL[L]
  const phone = first(f, 'contact.phone') ?? FILL[L]
  const email = first(f, 'contact.email') ?? FILL[L]
  const checkin = first(f, 'policy.checkin')
  const checkout = first(f, 'policy.checkout')
  const pets = first(f, 'policy.pets')
  const smoking = first(f, 'policy.smoking')
  const cancellation = first(f, 'policy.cancellation')
  const payment = first(f, 'policy.payment')
  const legalName = first(f, 'business.legalName') ?? hotelName
  const siret = first(f, 'business.siret') ?? FILL[L]
  const j = (lines: (string | false | undefined)[]) => lines.filter(Boolean).join('\n\n')
  return {
    legal: {
      title: fr ? 'Mentions légales' : 'Legal notice',
      navLabel: fr ? 'Mentions légales' : 'Legal notice',
      description: fr ? `Mentions légales du site de ${hotelName}.` : `Legal notice for the ${hotelName} website.`,
      blocks: [
        {
          heading: fr ? 'Mentions légales' : 'Legal notice',
          body: fr
            ? j(['## Éditeur du site', `${legalName}`, address, `SIRET ${siret}`, `Directeur de la publication : ${FILL.fr}`, `Contact : ${email} · ${phone}`, '## Hébergement', 'Le site est servi par la plateforme Hotelier Website Platform (xedge), hébergée sur Tencent Cloud EdgeOne (région Francfort, Allemagne). Les données du site sont stockées chez Neon (région Francfort, Allemagne).', '## Propriété intellectuelle', `Les textes et photographies de ce site appartiennent à ${hotelName}, sauf mention contraire. Toute reproduction sans autorisation écrite est interdite.`, NOTE.fr])
            : j(['## Publisher', `${legalName}`, address, `Company registration: ${siret}`, `Publication director: ${FILL.en}`, `Contact: ${email} · ${phone}`, '## Hosting', 'The site is served by the Hotelier Website Platform (xedge), hosted on Tencent Cloud EdgeOne (Frankfurt region, Germany). Site data is stored with Neon (Frankfurt region, Germany).', '## Intellectual property', `Texts and photographs on this site belong to ${hotelName} unless stated otherwise. Reproduction without written permission is prohibited.`, NOTE.en]),
        },
      ],
    },
    privacy: {
      title: fr ? 'Confidentialité et cookies' : 'Privacy and cookies',
      navLabel: fr ? 'Confidentialité & cookies' : 'Privacy & cookies',
      description: fr ? `Politique de confidentialité et de cookies du site de ${hotelName}.` : `Privacy and cookie policy of the ${hotelName} website.`,
      blocks: [
        {
          heading: fr ? 'Politique de confidentialité et de cookies' : 'Privacy and cookie policy',
          body: fr
            ? j(['## Responsable du traitement', `${legalName}, ${address} · ${email}`, '## Données collectées', 'Ce site ne dépose aucun cookie publicitaire ou de mesure d’audience. Les seules données personnelles traitées sont celles que vous nous envoyez par le formulaire de contact (nom, e-mail, téléphone, message), utilisées pour vous répondre et conservées 12 mois au plus.', '## Hébergement et sous-traitants', 'Les données sont hébergées dans l’Union européenne (Francfort, Allemagne) par les prestataires de la plateforme. Aucun transfert hors de l’Union européenne.', '## Vos droits', `Vous pouvez accéder à vos données, les rectifier ou demander leur effacement en écrivant à ${email}. Vous pouvez aussi saisir la CNIL (www.cnil.fr).`, NOTE.fr])
            : j(['## Data controller', `${legalName}, ${address} · ${email}`, '## Data we collect', 'This site sets no advertising or analytics cookies. The only personal data processed is what you send us through the contact form (name, email, phone, message), used to answer you and kept for at most 12 months.', '## Hosting and processors', 'Data is hosted in the European Union (Frankfurt, Germany) by the platform’s providers. No transfer outside the European Union.', '## Your rights', `You may access, correct or ask for the erasure of your data by writing to ${email}. You may also lodge a complaint with your data-protection authority (in France, the CNIL, www.cnil.fr).`, NOTE.en]),
        },
      ],
    },
    terms: {
      title: fr ? 'Règlement intérieur et conditions générales de vente' : 'House rules and terms of sale',
      navLabel: fr ? 'Règlement & CGV' : 'House rules & terms',
      description: fr ? `Règlement intérieur et conditions générales de vente de ${hotelName}.` : `House rules and terms of sale of ${hotelName}.`,
      blocks: [
        {
          heading: fr ? 'Règlement intérieur' : 'House rules',
          body: fr
            ? j(['## Arrivée et départ', checkin || checkout ? `Les chambres sont disponibles à partir de ${checkin ?? FILL.fr} et doivent être libérées avant ${checkout ?? FILL.fr}.` : `Horaires d’arrivée et de départ : ${FILL.fr}.`, '## Tranquillité', `Le calme est demandé à tous les clients ; horaires de silence : ${FILL.fr}.`, '## Animaux', pets ?? `Animaux : ${FILL.fr}.`, '## Fumeurs', smoking ?? `Fumeurs : ${FILL.fr}.`, '## Responsabilités', 'Tout dommage causé dans l’établissement est facturé au client responsable.', NOTE.fr])
            : j(['## Arrival and departure', checkin || checkout ? `Rooms are available from ${checkin ?? FILL.en} and must be vacated by ${checkout ?? FILL.en}.` : `Check-in and check-out times: ${FILL.en}.`, '## Quiet', `All guests are asked to keep quiet; quiet hours: ${FILL.en}.`, '## Pets', pets ?? `Pets: ${FILL.en}.`, '## Smoking', smoking ?? `Smoking: ${FILL.en}.`, '## Responsibility', 'Any damage caused in the establishment is charged to the guest responsible.', NOTE.en]),
        },
        {
          heading: fr ? 'Conditions générales de vente' : 'Terms of sale',
          body: fr
            ? j(['## Établissement', `${legalName} · SIRET ${siret} · ${address} · ${phone}`, '## Réservation, paiement et annulation', payment ?? `Paiement : ${FILL.fr}.`, cancellation ?? `Annulation : ${FILL.fr}.`, '## Tarifs', 'Les tarifs s’entendent TVA comprise, par chambre et pour le nombre de personnes indiqué. La taxe de séjour est due en supplément selon la réglementation locale.', '## Réclamations et médiation', `Toute réclamation doit être adressée par écrit à ${email}. En cas de litige, le client peut saisir un médiateur de la consommation : ${FILL.fr}.`, '## Droit applicable', `Droit applicable et juridiction : ${FILL.fr}.`, NOTE.fr])
            : j(['## The establishment', `${legalName} · registration ${siret} · ${address} · ${phone}`, '## Booking, payment and cancellation', payment ?? `Payment: ${FILL.en}.`, cancellation ?? `Cancellation: ${FILL.en}.`, '## Rates', 'Rates include VAT, per room and for the number of guests stated. Local tourist tax is charged in addition where it applies.', '## Complaints and mediation', `Complaints must be sent in writing to ${email}. In case of dispute, guests may refer to a consumer mediator: ${FILL.en}.`, '## Applicable law', `Applicable law and jurisdiction: ${FILL.en}.`, NOTE.en]),
        },
      ],
    },
  }
  void all
}
