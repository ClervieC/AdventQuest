import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { create } from 'zustand';

// Réglages de l'appareil (pas liés au compte) : son coupé ou non et langue, mémorisés entre deux lancements
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
  loadSettings: () => Promise<void>;
  toggleMuted: () => void;
  setLang: (lang: Lang) => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => {
  const save = () => {
    const { muted, lang } = get();
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ muted, lang })).catch(() => {});
  };

  return {
    muted: false,
    lang: detectDeviceLang(),

    loadSettings: async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw);
        set({ muted: !!saved.muted, ...(saved.lang === 'fr' || saved.lang === 'en' ? { lang: saved.lang } : {}) });
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
  };
});
