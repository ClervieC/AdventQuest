import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

// Réglages de l'appareil (pas liés au compte) : ici, le son coupé ou non, mémorisé entre deux lancements
const STORAGE_KEY = 'adventquest.settings.v1';

interface SettingsStore {
  muted: boolean;
  loadSettings: () => Promise<void>;
  toggleMuted: () => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  muted: false,

  loadSettings: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) set({ muted: !!JSON.parse(raw).muted });
    } catch {
      // stockage indisponible : on garde le son activé par défaut
    }
  },

  toggleMuted: () => {
    const muted = !get().muted;
    set({ muted });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ muted })).catch(() => {});
  },
}));
