import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { create } from 'zustand';

// Réglages de l'appareil (pas liés au compte) : son coupé ou non, langue et commandes préférées, mémorisés entre
// deux lancements
const STORAGE_KEY = 'adventquest.settings.v1';

export type Lang = 'fr' | 'en';

// Langue du téléphone : français s'il est en français, anglais sinon
function detectDeviceLang(): Lang {
  try {
    return getLocales()[0]?.languageCode === 'fr' ? 'fr' : 'en';
  } catch {
    return 'fr';
  }
}

interface SettingsStore {
  muted: boolean;
  lang: Lang;
  /** Dernier choix de commandes des jeux qui le proposent (Snake, Labyrinthe) : croix directionnelle ou glisser */
  directionPad: boolean;
  loadSettings: () => Promise<void>;
  toggleMuted: () => void;
  setLang: (lang: Lang) => void;
  setDirectionPad: (directionPad: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => {
  const save = () => {
    const { muted, lang, directionPad } = get();
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ muted, lang, directionPad })).catch(() => {});
  };

  return {
    muted: false,
    lang: detectDeviceLang(),
    directionPad: true,

    loadSettings: async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw);
        set({
          muted: !!saved.muted,
          ...(saved.lang === 'fr' || saved.lang === 'en' ? { lang: saved.lang } : {}),
          ...(typeof saved.directionPad === 'boolean' ? { directionPad: saved.directionPad } : {}),
        });
      } catch {
        // stockage indisponible : son activé et langue du téléphone par défaut
      }
    },

    toggleMuted: () => {
      set({ muted: !get().muted });
      save();
    },

    setLang: (lang) => {
      set({ lang });
      save();
    },

    setDirectionPad: (directionPad) => {
      set({ directionPad });
      save();
    },
  };
});
