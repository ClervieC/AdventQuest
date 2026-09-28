import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

// Sauvegarde locale d'une partie en cours (Sudoku, Solitaire) : quitter le jeu puis revenir reprend la même grille.
// La sauvegarde est effacée quand la partie est gagnée ou quand le joueur demande une nouvelle partie.

const PREFIX = 'adventquest.save.v1';

/** Une sauvegarde par joueur (pseudo) et par jeu, pour ne pas reprendre la partie d'un autre compte sur le même appareil */
function storageKey(username: string | null, saveId: string): string {
  return `${PREFIX}.${username ?? 'anonyme'}.${saveId}`;
}

export type SaveLoad<T> = { status: 'loading' } | { status: 'ready'; saved: T | null };

/** Charge la sauvegarde au montage du jeu (ou null s'il n'y en a pas) */
export function useGameSaveLoad<T>(saveId: string): SaveLoad<T> {
  const username = useGameStore((s) => s.username);
  const [load, setLoad] = useState<SaveLoad<T>>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(storageKey(username, saveId))
      .then((raw) => {
        if (!cancelled) setLoad({ status: 'ready', saved: raw ? (JSON.parse(raw) as T) : null });
      })
      .catch(() => {
        if (!cancelled) setLoad({ status: 'ready', saved: null });
      });
    return () => {
      cancelled = true;
    };
  }, [username, saveId]);

  return load;
}

/** Fonctions d'écriture / effacement pour un jeu donné */
export function useGameSaveWriter<T>(saveId: string) {
  const username = useGameStore((s) => s.username);
  const key = storageKey(username, saveId);
  return {
    write: (data: T) => {
      AsyncStorage.setItem(key, JSON.stringify(data)).catch(() => {});
    },
    clear: () => {
      AsyncStorage.removeItem(key).catch(() => {});
    },
  };
}
