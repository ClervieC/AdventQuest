// Paires : des cartes face cachée, on en retourne deux ; si elles sont identiques elles restent visibles.

export interface PairCard {
  id: number;
  symbol: string;
  matched: boolean;
}

export interface PairsSettings {
  pairs: number;
  columns: number;
  timeLimitSeconds: number;
}

export const PAIRS_SETTINGS: Record<string, PairsSettings> = {
  easy: { pairs: 6, columns: 3, timeLimitSeconds: 90 },
  medium: { pairs: 8, columns: 4, timeLimitSeconds: 90 },
  hard: { pairs: 8, columns: 4, timeLimitSeconds: 70 },
  very_hard: { pairs: 10, columns: 4, timeLimitSeconds: 90 },
};

export const SYMBOLS = ['🎄', '⛄', '🦌', '🎁', '🔔', '⭐', '🍪', '🧦', '🕯️', '❄️', '🍭', '🎅'];

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Jeu de cartes mélangé : `pairs` symboles tirés au hasard, chacun en double */
export function createDeck(pairs: number, random: () => number = Math.random): PairCard[] {
  const symbols = shuffle(SYMBOLS, random).slice(0, pairs);
  return shuffle([...symbols, ...symbols], random).map((symbol, id) => ({ id, symbol, matched: false }));
}

export function isComplete(cards: PairCard[]): boolean {
  return cards.every((card) => card.matched);
}

/** Score : 1000, −25 par paire ratée, +5 par seconde restante (au moins 100) */
export function calculatePairsScore(mistakes: number, secondsLeft: number): number {
  return Math.max(100, 1000 - mistakes * 25 + secondsLeft * 5);
}
