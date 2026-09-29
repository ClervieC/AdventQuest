import { useMemo } from 'react';
import { Lang, useSettingsStore } from '../store/settingsStore';

export type { Lang };

// Texte disponible dans les deux langues (données : jours, zones, tutoriels, pages légales...)
export interface Localized {
  fr: string;
  en: string;
}

export interface I18n {
  lang: Lang;
  locale: string; // pour les dates et nombres (toLocaleString)
  tr: (fr: string, en: string) => string; // texte écrit directement dans un écran
  l: (text: Localized) => string; // texte venant des données
}

function makeI18n(lang: Lang): I18n {
  return {
    lang,
    locale: lang === 'en' ? 'en-GB' : 'fr-FR',
    tr: (fr, en) => (lang === 'en' ? en : fr),
    l: (text) => text[lang],
  };
}

/** Dans un composant : se met à jour tout seul quand le joueur change de langue */
export function useI18n(): I18n {
  const lang = useSettingsStore((state) => state.lang);
  return useMemo(() => makeI18n(lang), [lang]);
}

/** Hors composant (store, services) : langue actuelle au moment de l'appel */
export function getI18n(): I18n {
  return makeI18n(useSettingsStore.getState().lang);
}
