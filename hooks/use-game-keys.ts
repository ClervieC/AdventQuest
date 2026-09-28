import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

// Touches qui feraient défiler la page pendant la partie
const SCROLL_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ']);

/**
 * Clavier pour jouer sur ordi (web uniquement, sans effet sur téléphone).
 * `onKey` reçoit la touche appuyée (event.key : 'ArrowLeft', '5', ' ', 'n'...) et renvoie true si elle l'a utilisée.
 * Les touches tapées dans un champ de texte (formulaire d'avis...) sont ignorées.
 */
export function useGameKeys(onKey: (key: string, event: KeyboardEvent) => boolean | void, enabled = true) {
  const handlerRef = useRef(onKey);
  handlerRef.current = onKey;

  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled) return;
    const listener = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const used = handlerRef.current(event.key, event);
      if (used !== false && SCROLL_KEYS.has(event.key)) event.preventDefault();
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [enabled]);
}
