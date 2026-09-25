# Accessibility statement — template per hotel site (draft)

Published on each site's accessibility page (customer zero has a draft at `/accessibilite`). Fill the brackets per hotel; the measured parts come from the CI gates.

---

**Déclaration d'accessibilité — `[Hôtel]`**

`[Hôtel]` s'engage à rendre son site internet accessible, conformément à l'article 47 de la loi n° 2005-102 du 11 février 2005 et à la directive (UE) 2016/2102.

**État de conformité.** Le site `[www.hotel.fr]` est en **conformité partielle** avec le RGAA 4.1 / EN 301 549, en attendant un audit externe. Les contrôles automatiques (règles WCAG 2.2 niveau AA) sont exécutés à chaque modification du gabarit du site et ne signalent aucune non-conformité au `[date]`.

**Ce que le site fait.** Navigation au clavier, lien d'évitement vers le contenu, contrastes de texte vérifiés automatiquement (4,5:1), titres hiérarchisés, textes alternatifs sur les photos, formulaires étiquetés, respect de la préférence « réduire les animations », police lisible et zoom jusqu'à 200 %.

**Contenus non accessibles.** `[liste, ou « aucun connu »]` — par exemple : la carte est une image statique avec le lien vers OpenStreetMap ; les documents PDF fournis par l'hôtel ne sont pas tous balisés.

**Établissement de cette déclaration.** Établie le `[date]`, sur la base des contrôles automatiques de la plateforme (axe-core, WCAG 2.2 AA) et `[d'un audit manuel du …]`.

**Retour d'information et contact.** Si vous rencontrez un défaut d'accessibilité, écrivez à `[email]` ou téléphonez au `[téléphone]`. Vous pouvez également saisir le Défenseur des droits.

---

Where the numbers come from: `tests/quality/gates.mjs` (every push, three templates × three pages, zero axe violations required) and the nightly run on each live home page (`tests/quality/nightly.mjs`), whose findings appear in the hotel's admin as issues.
