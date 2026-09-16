import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Réinitialise automatiquement le défilement (scroll) tout en haut de l'écran 
 * à chaque changement de page ou d'URL.
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // 1. Défilement standard de la fenêtre
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // ou 'smooth' si vous voulez une animation douce
    });

    // 2. Sécurité pour documentElement et body
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, search]);

  return null;
}