import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PlayerState } from './api';

// Dernier état connu du joueur (progression, jour, hints...), gardé sur l'appareil : sans réseau, l'appli
// s'ouvre quand même sur cet état. Les parties jouées hors ligne sont renvoyées au retour du réseau
// (voir pendingAttempts) ; le serveur reste seul juge (une partie d'un jour déjà passé est refusée).

const KEY = 'adventquest.lastState.v1';

export interface OfflineSnapshot {
  state: PlayerState;
  hasAccount: boolean;
  savedAt: string;
}

export async function loadLastState(): Promise<OfflineSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OfflineSnapshot) : null;
  } catch {
    return null;
  }
}

export function saveLastState(state: PlayerState, hasAccount: boolean): void {
  if (!state.profile) return; // pas encore de profil : rien d'utile à garder
  const snapshot: OfflineSnapshot = { state, hasAccount, savedAt: new Date().toISOString() };
  AsyncStorage.setItem(KEY, JSON.stringify(snapshot)).catch(() => {});
}

export function clearLastState(): void {
  AsyncStorage.removeItem(KEY).catch(() => {});
}
