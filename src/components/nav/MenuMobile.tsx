import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/** Les destinations, dans l'ordre de la nav de bureau. Contact est à part : il
 *  garde sa pilule et se place en bas de liste. */
const LIENS = [
  { href: '/', libelle: 'Accueil' },
  { href: '/projets', libelle: 'Projets' },
  { href: '/#parcours', libelle: 'Parcours' },
  { href: '/#confiance', libelle: 'Partenaires' },
  { href: '/blog', libelle: 'Blog' },
];

export default function MenuMobile() {
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

  // Focus sur le premier lien à l'ouverture.
  useEffect(() => {
    if (!ouvert) return;
    panneauRef.current?.querySelector<HTMLElement>('a[href]')?.focus();
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

      const premier = focusables[0];
      const dernier = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === premier) {
        e.preventDefault();
        dernier.focus();
      } else if (!e.shiftKey && document.activeElement === dernier) {
        e.preventDefault();
        premier.focus();
      }
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
        aria-label={ouvert ? 'Fermer le menu' : 'Ouvrir le menu'}
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
            aria-label="Navigation"
            className="menu-panneau"
          >
            {LIENS.map(({ href, libelle }) => (
              <a
                key={href}
                href={href}
                className={chemin === href ? 'menu-lien menu-lien--actif' : 'menu-lien'}
                onClick={fermer}
              >
                <span aria-hidden="true">&gt;</span>
                {libelle}
              </a>
            ))}

            <a href="/contact" className="menu-contact btn-retro" onClick={fermer}>
              Contact
            </a>
          </div>,
          document.body
        )}
    </>
  );
}
