export type SymbolIndex = 0 | 1 | 2 | 3; // 4 symboles/couleurs possibles

export interface SequenceConfig {
  startLength: number;     // longueur de départ de la séquence
  maxLength: number;       // longueur à atteindre pour gagner
  displayDelayMs: number;  // délai entre chaque symbole affiché
}

export const DIFFICULTY_CONFIGS: Record<string, SequenceConfig> = {
  easy: { startLength: 3, maxLength: 5, displayDelayMs: 800 },
  medium: { startLength: 4, maxLength: 7, displayDelayMs: 650 },
  hard: { startLength: 5, maxLength: 10, displayDelayMs: 450 },
};

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

/** Calcule le score selon la longueur de séquence atteinte et les hints utilisés */
export function calculateSequenceScore(sequenceLengthReached: number, hintsUsed: number): number {
  const baseScore = sequenceLengthReached * 150;
  const hintPenalty = hintsUsed * 80;
  return Math.max(baseScore - hintPenalty, 50);
}

/** Le joueur a-t-il atteint la longueur maximale pour gagner ? */
export function hasWon(currentLength: number, maxLength: number): boolean {
  return currentLength >= maxLength;
}