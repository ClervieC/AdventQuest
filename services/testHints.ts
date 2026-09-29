import AsyncStorage from '@react-native-async-storage/async-storage';

// Hints offerts en mode test (testeurs / admin), mémorisés par joueur et par jour sur l'appareil :
// quitter le jeu puis revenir (Sudoku, Solitaire... qui reprennent la partie) ne les remet pas à neuf.
// Ils repartent au maximum seulement quand une partie se termine.

const PREFIX = 'adventquest.testHints.v1';
const keyFor = (username: string | null, day: number) => `${PREFIX}.${username ?? 'anonyme'}.day${day}`;

export async function loadTestHintsLeft(username: string | null, day: number): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(username, day));
    const value = raw === null ? NaN : Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export function saveTestHintsLeft(username: string | null, day: number, left: number): void {
  AsyncStorage.setItem(keyFor(username, day), String(left)).catch(() => {});
}

export function clearTestHintsLeft(username: string | null, day: number): void {
  AsyncStorage.removeItem(keyFor(username, day)).catch(() => {});
}
