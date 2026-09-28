import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { t } from '../../i18n/ui';
import { buildPath, normalizePath, otherLang, type Lang } from '../../i18n/utils';

interface MenuMobileProps {
  lang?: Lang;
  /** Page équivalente dans l'autre langue. */
  altHref?: string;
}

/** Les destinations, dans l'ordre de la nav de bureau. Contact est à part : il
 *  garde sa pilule et se place en bas de liste. */
function liens(lang: Lang) {
  const d = t(lang);
  return [
    { href: buildPath('home', lang), libelle: d['nav.home'] },
    { href: buildPath('projects', lang), libelle: d['nav.projects'] },
    { href: buildPath('home', lang, undefined, '#parcours'), libelle: d['nav.parcours'] },
    { href: buildPath('home', lang, undefined, '#confiance'), libelle: d['nav.partners'] },
    { href: buildPath('blog', lang), libelle: d['nav.blog'] },
  ];
}

export default function MenuMobile({ lang = 'fr', altHref = '/en/' }: MenuMobileProps) {
  const d = t(lang);
  const LIENS = liens(lang);
  const [ouvert, setOuvert] = useState(false);
  const boutonRef = useRef<HTMLButtonElement>(null);
  const panneauRef = useRef<HTMLDivElement>(null);

  // Le chemin n'est lisible qu'après hydratation : `client:idle` rend ce
  // composant côté serveur, où `window` n'existe pas. Aucun lien n'est donc
  // marqué actif dans le HTML servi ; le marquage apparaît à l'hydratation.
  const [chemin, setChemin] = useState('');
  useEffect(() => setChemin(window.location.pathname), []);

  // Contrairement à la pastille de MARVIN, le bouton n'est jamais masqué quand
  // le panneau est ouvert — celui-ci est en z-45, sous la barre en z-50. Le
  // focus peut donc revenir dans la même passe, sans attendre le commit.
  const fermer = useCallback(() => {
    setOuvert(false);
    boutonRef.current?.focus();
  }, []);

  // `window.location.pathname` ne contient jamais de fragment, donc comparer
  // `chemin` à `/#parcours` ne peut jamais être vrai. Et rabattre l'ancre sur
  // son chemin marquerait Accueil, Parcours et Partenaires actifs ensemble sur
  // la page d'accueil. On ne marque donc que les vraies routes.
  const estActif = (href: string) => !href.includes('#') && normalizePath(chemin) === normalizePath(href);

  // Focus sur le premier lien à l'ouverture.
  useEffect(() => {
    if (!ouvert) return;
    panneauRef.current?.querySelector<HTMLElement>('a[href]')?.focus();
  }, [ouvert]);

  // Rien ne masque le panneau quand la largeur franchit le point de rupture :
  // l'enveloppe `md:hidden` fait disparaître le bouton, mais le panneau vit
  // dans `document.body` via le portail et lui échappe. On se retrouverait avec
  // une liste plein écran sans aucun contrôle de fermeture. `matchMedia` dans
  // un effet, donc le contrat `client:idle` tient.
  useEffect(() => {
    if (!ouvert) return;

    const requete = window.matchMedia('(min-width: 768px)');
    const surChangement = () => {
      if (requete.matches) setOuvert(false);
    };

    requete.addEventListener('change', surChangement);

    return () => requete.removeEventListener('change', surChangement);
  }, [ouvert]);

  // Verrou de scroll. On restaure la valeur précédente, pas la chaîne vide :
  // une autre feuille de style pourrait avoir posé la sienne.
  useEffect(() => {
    if (!ouvert) return;

    const precedent = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = precedent;
    };
  }, [ouvert]);

  // Échap et piège à focus.
  useEffect(() => {
    if (!ouvert) return;

    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        fermer();
        return;
      }
      if (e.key !== 'Tab') return;

      // Le piège enjambe deux sous-arbres : le bouton est dans la nav, le
      // panneau dans document.body via le portail. On compose donc la liste à
      // la main — interroger un conteneur unique laisserait le bouton dehors.
      const focusables = [
        boutonRef.current,
        ...Array.from(panneauRef.current?.querySelectorAll<HTMLElement>('a[href]') ?? []),
      ].filter((el): el is HTMLElement => el !== null);
      if (focusables.length === 0) return;

      // On intercepte CHAQUE tabulation et on déplace le focus à l'index,
      // au lieu de n'intercepter qu'aux extrémités. Le motif classique — ne
      // rattraper que le premier et le dernier — suppose que les éléments sont
      // contigus dans l'ordre de tabulation natif. Ils ne le sont pas ici : le
      // bouton est dans la nav, le panneau est ajouté à la fin de
      // `document.body`. Tabuler depuis le bouton, ou reculer depuis le premier
      // lien, s'échapperait donc vers le contenu de la page — sous un panneau
      // opaque annoncé `aria-modal`.
      e.preventDefault();

      const courant = focusables.indexOf(document.activeElement as HTMLElement);
      const suivant = e.shiftKey
        ? (courant <= 0 ? focusables.length - 1 : courant - 1)
        : (courant === -1 || courant === focusables.length - 1 ? 0 : courant + 1);

      focusables[suivant].focus();
    };

    document.addEventListener('keydown', surTouche);

    return () => document.removeEventListener('keydown', surTouche);
  }, [ouvert, fermer]);

  return (
    <>
      <button
        ref={boutonRef}
        type="button"
        className="menu-burger"
        aria-expanded={ouvert}
        aria-controls="menu-mobile"
        aria-label={ouvert ? d['nav.menuClose'] : d['nav.menuOpen']}
        onClick={() => (ouvert ? fermer() : setOuvert(true))}
      >
        <span aria-hidden="true">{ouvert ? '✕' : '≡'}</span>
      </button>

      {ouvert &&
        createPortal(
          <div
            ref={panneauRef}
            id="menu-mobile"
            role="dialog"
            aria-modal="true"
            aria-label={d['nav.menuLabel']}
            className="menu-panneau"
          >
            {LIENS.map(({ href, libelle }) => (
              <a
                key={href}
                href={href}
                className={estActif(href) ? 'menu-lien menu-lien--actif' : 'menu-lien'}
                aria-current={estActif(href) ? 'page' : undefined}
                onClick={fermer}
              >
                <span aria-hidden="true">&gt;</span>
                {libelle}
              </a>
            ))}

            <a
              href={altHref}
              data-lang-switch={otherLang(lang)}
              hrefLang={otherLang(lang)}
              lang={otherLang(lang)}
              className="menu-lien"
              onClick={fermer}
            >
              <span aria-hidden="true">&gt;</span>
              {d['nav.otherLangName']}
            </a>

            <a href={buildPath('contact', lang)} className="menu-contact btn-retro" onClick={fermer}>
              {d['nav.contact']}
            </a>
          </div>,
          document.body
        )}
    </>
  );
}
