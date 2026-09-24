// Parties jouées hors ligne (ou dont l'envoi a échoué) : gardées sur le téléphone et renvoyées
// au serveur dès que possible. Le serveur reste juge : une partie d'un jour déjà passé sera refusée.
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PendingAttempt {
  day: number;
  score: number;
  success: boolean;
}

const STORAGE_KEY = 'adventquest.pendingAttempts.v1';

export async function loadPendingAttempts(): Promise<PendingAttempt[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function savePendingAttempts(attempts: PendingAttempt[]): Promise<void> {
  try {
    if (attempts.length === 0) await AsyncStorage.removeItem(STORAGE_KEY);
    else await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
  } catch {
    // Stockage indisponible : la partie sera perdue pour le serveur, mais l'app ne plante pas
  }
}
