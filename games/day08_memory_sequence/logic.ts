export type SymbolIndex = 0 | 1 | 2 | 3; // 4 symboles/couleurs possibles

export interface SequenceConfig {
  startLength: number;     // longueur de départ de la séquence
  maxLength: number;       // longueur à atteindre pour gagner
  capLength: number;       // au-delà de l'objectif, on continue en bonus jusqu'à cette longueur au plus
  displayDelayMs: number;  // délai entre chaque symbole affiché
}

export const DIFFICULTY_CONFIGS: Record<string, SequenceConfig> = {
  easy: { startLength: 3, maxLength: 5, capLength: 10, displayDelayMs: 800 },
  medium: { startLength: 4, maxLength: 6, capLength: 13, displayDelayMs: 650 }, // jour 8 : objectif 6 couleurs
  hard: { startLength: 5, maxLength: 8, capLength: 16, displayDelayMs: 550 }, // jour 18 : objectif 8 couleurs, un peu plus lent
  very_hard: { startLength: 6, maxLength: 12, capLength: 20, displayDelayMs: 380 },
};

// Une couleur au-delà de l'objectif rapporte 125 (au lieu de 150) : bonus ≈ 1 000 au plus
export const BONUS_POINTS_PER_COLOR = 125;

/** Génère une séquence aléatoire de la longueur demandée */
export function generateSequence(length: number): SymbolIndex[] {
  const sequence: SymbolIndex[] = [];
  for (let i = 0; i < length; i++) {
    sequence.push(Math.floor(Math.random() * 4) as SymbolIndex);
  }
  return sequence;
}

/** Étend une séquence existante d'un symbole supplémentaire (pour le niveau suivant) */
export function extendSequence(sequence: SymbolIndex[]): SymbolIndex[] {
  return [...sequence, Math.floor(Math.random() * 4) as SymbolIndex];
}

/**
 * Compare ce que le joueur a tapé avec la séquence attendue, position par position.
 * Retourne le résultat dès la première erreur trouvée, ou 'correct' si tout correspond jusqu'ici.
 */
export function checkPlayerInput(
  expectedSequence: SymbolIndex[],
  playerInput: SymbolIndex[]
): 'correct_so_far' | 'wrong' | 'complete' {
  for (let i = 0; i < playerInput.length; i++) {
    if (playerInput[i] !== expectedSequence[i]) {
      return 'wrong';
    }
  }
  if (playerInput.length === expectedSequence.length) {
    return 'complete';
  }
  return 'correct_so_far';
}

/**
 * Calcule le score selon la longueur de séquence atteinte et les hints utilisés.
 * Chaque couleur au-delà de l'objectif (`goalLength`) rapporte BONUS_POINTS_PER_COLOR (bonus, non plafonné).
 */
export function calculateSequenceScore(sequenceLengthReached: number, hintsUsed: number, goalLength: number = Infinity): number {
  const baseScore = Math.min(sequenceLengthReached, goalLength) * 150;
  const bonus = Math.max(0, sequenceLengthReached - goalLength) * BONUS_POINTS_PER_COLOR;
  const hintPenalty = hintsUsed * 80;
  return Math.max(baseScore + bonus - hintPenalty, 50);
}

/** Le joueur a-t-il atteint la longueur maximale pour gagner ? */
export function hasWon(currentLength: number, maxLength: number): boolean {
  return currentLength >= maxLength;
}
/**
 * Délai entre deux couleurs : plus lent aux premières manches pour se mettre dans le rythme
 * (×1,5 à la 1re séquence, puis ×1,33, ×1,17), puis la vitesse normale de la difficulté.
 */
export function sequenceDelayMs(baseDelayMs: number, round: number): number {
  const slowdown = 1 + 0.5 * Math.max(0, 1 - round / 3);
  return Math.round(baseDelayMs * slowdown);
}

/** Délai minimal entre deux couleurs : en dessous, on ne voit plus bien chaque couleur s'allumer (retour testeur) */
export const MIN_DELAY_MS = 380;

/**
 * En bonus (séquences plus longues que l'objectif), les couleurs défilent de plus en plus vite :
 * −10 % par manche bonus, sans descendre sous MIN_DELAY_MS.
 */
export function bonusDelayMs(delayMs: number, bonusRounds: number): number {
  if (bonusRounds <= 0) return delayMs;
  return Math.max(MIN_DELAY_MS, Math.round(delayMs * 0.9 ** bonusRounds));
}
