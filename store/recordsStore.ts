import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { fetchMyArcadeRecords, submitArcadeRecord } from '../services/api';

// Records personnels, par joueur. Clés :
// - `arcade:<jeu>[-<niveau>]` : un jeu de l'onglet Jeux ;
// - `day<N>` : le jeu du jour N (entraînement, et aussi les vraies parties du calendrier) ;
// - `game:<type>` : score d'une épreuve des jours 22 à 24.
// Gardés sur l'appareil (affichage immédiat, hors ligne) ET sur le serveur (tous les appareils, classement entre
// amis) : au chargement on garde le meilleur des deux. Hors classement officiel de la saison.

const PREFIX = 'adventquest.records.v1';
const keyFor = (username: string | null) => `${PREFIX}.${username ?? 'anonyme'}`;

interface RecordsStore {
  username: string | null;
  records: Record<string, number>;
  loaded: boolean;
  load: (username: string | null) => Promise<void>;
  /** Enregistre un score ; renvoie true si c'est un nouveau record */
  submit: (key: string, score: number) => boolean;
}

export const useRecordsStore = create<RecordsStore>((set, get) => {
  const saveLocal = () => {
    const { username, records } = get();
    AsyncStorage.setItem(keyFor(username), JSON.stringify(records)).catch(() => {});
  };

  return {
    username: null,
    records: {},
    loaded: false,

    load: async (username) => {
      if (get().loaded && get().username === username) return;
      let local: Record<string, number> = {};
      try {
        const raw = await AsyncStorage.getItem(keyFor(username));
        local = raw ? JSON.parse(raw) : {};
      } catch {
        // stockage indisponible
      }
      set({ username, records: local, loaded: true });

      // Records du serveur (autres appareils) ; ceux de l'appareil qui sont meilleurs y sont renvoyés
      try {
        const server = await fetchMyArcadeRecords();
        if (get().username !== username) return; // changement de compte entre-temps
        const merged = { ...get().records };
        const serverMap = new Map(server.map((row) => [row.record_key, row.score]));
        serverMap.forEach((score, key) => {
          if (score > (merged[key] ?? 0)) merged[key] = score;
        });
        Object.entries(merged).forEach(([key, score]) => {
          if (score > (serverMap.get(key) ?? 0)) submitArcadeRecord(key, score).catch(() => {});
        });
        set({ records: merged });
        saveLocal();
      } catch {
        // hors ligne, ou fonctions pas encore installées sur le serveur : on garde les records de l'appareil
      }
    },

    submit: (key, score) => {
      const { records } = get();
      if (!(score > 0) || score <= (records[key] ?? 0)) return false;
      set({ records: { ...records, [key]: Math.round(score) } });
      saveLocal();
      submitArcadeRecord(key, score).catch(() => {}); // hors ligne : renvoyé au prochain chargement
      return true;
    },
  };
});

/** Clé de record du jeu d'un jour du calendrier */
export const dayRecordKey = (day: number) => `day${day}`;
/** Clé de record d'un mini-jeu d'épreuve */
export const gameRecordKey = (game: string) => `game:${game}`;
