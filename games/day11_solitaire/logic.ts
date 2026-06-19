export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13; // 1=As, 11=Valet, 12=Dame, 13=Roi

export interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
  id: string; // identifiant unique, ex "hearts-7"
}

export interface GameState {
  columns: Card[][];       // 7 colonnes du tableau principal
  foundations: Card[][];   // 4 piles de fondation (une par couleur), construites As -> Roi
  stock: Card[];           // pioche restante (face cachée)
  waste: Card[];           // cartes retournées depuis la pioche (face visible)
}

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RED_SUITS: Suit[] = ['hearts', 'diamonds'];

export function isRed(suit: Suit): boolean {
  return RED_SUITS.includes(suit);
}

/** Crée un jeu de 52 cartes trié (pas encore mélangé) */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({ suit, rank: rank as Rank, faceUp: false, id: `${suit}-${rank}` });
    }
  }
  return deck;
}

/** Mélange un tableau de cartes (Fisher-Yates) */
export function shuffleDeck(deck: Card[]): Card[] {
  const result = [...deck];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Distribue un jeu mélangé selon les règles du Klondike :
 * colonne 1 = 1 carte, colonne 2 = 2 cartes, ..., colonne 7 = 7 cartes.
 * Seule la dernière carte de chaque colonne est face visible.
 * Le reste du deck (24 cartes) devient le stock.
 */
export function dealNewGame(shuffledDeck: Card[]): GameState {
  const columns: Card[][] = [[], [], [], [], [], [], []];
  let deckIndex = 0;

  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = { ...shuffledDeck[deckIndex] };
      card.faceUp = row === col; // seule la dernière carte posée est visible
      columns[col].push(card);
      deckIndex++;
    }
  }

  const stock = shuffledDeck.slice(deckIndex).map((c) => ({ ...c, faceUp: false }));

  return {
    columns,
    foundations: [[], [], [], []],
    stock,
    waste: [],
  };
  
}

/**
 * Une carte peut être posée sur une colonne si :
 * - la colonne est vide ET la carte est un Roi, OU
 * - la carte du dessus de la colonne est d'une couleur opposée ET de rang immédiatement supérieur
 */
export function canPlaceOnColumn(card: Card, column: Card[]): boolean {
  if (column.length === 0) {
    return card.rank === 13; // seul un Roi peut commencer une colonne vide
  }
  const topCard = column[column.length - 1];
  if (!topCard.faceUp) return false;

  const oppositeColor = isRed(card.suit) !== isRed(topCard.suit);
  const rankIsOneLess = card.rank === topCard.rank - 1;
  return oppositeColor && rankIsOneLess;
}

/**
 * Une carte peut être posée sur une fondation si :
 * - la fondation est vide ET la carte est un As, OU
 * - la carte du dessus est de la même couleur ET de rang immédiatement inférieur
 */
export function canPlaceOnFoundation(card: Card, foundation: Card[]): boolean {
  if (foundation.length === 0) {
    return card.rank === 1; // seul un As peut commencer une fondation
  }
  const topCard = foundation[foundation.length - 1];
  return card.suit === topCard.suit && card.rank === topCard.rank + 1;
}

/** Retourne la dernière carte face visible d'une colonne, prête à être déplacée (avec celles en dessous si applicable) */
export function getMovableCards(column: Card[], fromIndex: number): Card[] | null {
  if (fromIndex < 0 || fromIndex >= column.length) return null;
  const cardsToMove = column.slice(fromIndex);
  if (!cardsToMove.every((c) => c.faceUp)) return null; // ne peut pas déplacer une carte face cachée

  // Vérifie que les cartes à déplacer forment bien une séquence valide entre elles
  for (let i = 0; i < cardsToMove.length - 1; i++) {
    const current = cardsToMove[i];
    const next = cardsToMove[i + 1];
    const oppositeColor = isRed(current.suit) !== isRed(next.suit);
    const rankIsOneLess = next.rank === current.rank - 1;
    if (!oppositeColor || !rankIsOneLess) return null;
  }

  return cardsToMove;
}

/** Retourne la carte du dessus d'une colonne si elle est face visible, sinon retourne automatiquement la suivante */
export function flipTopCardIfNeeded(column: Card[]): Card[] {
  if (column.length === 0) return column;
  const newColumn = [...column];
  const topIndex = newColumn.length - 1;
  if (!newColumn[topIndex].faceUp) {
    newColumn[topIndex] = { ...newColumn[topIndex], faceUp: true };
  }
  return newColumn;
}

/** Pioche une carte du stock vers le waste ; si le stock est vide, recycle le waste */
export function drawFromStock(state: GameState): GameState {
  if (state.stock.length === 0) {
    // Recycle : le waste redevient le stock, face cachée, dans l'ordre inverse
    const newStock = [...state.waste].reverse().map((c) => ({ ...c, faceUp: false }));
    return { ...state, stock: newStock, waste: [] };
  }

  const newStock = [...state.stock];
  const drawnCard = { ...newStock.pop()!, faceUp: true };
  return { ...state, stock: newStock, waste: [...state.waste, drawnCard] };
}

/** Vérifie si la partie est gagnée (les 4 fondations contiennent 13 cartes chacune) */
export function isGameWon(state: GameState): boolean {
  return state.foundations.every((foundation) => foundation.length === 13);
}

/** Calcule le score selon le nombre de cartes en fondation et le temps pris */
export function calculateSolitaireScore(cardsInFoundations: number, timeSpentSeconds: number, hintsUsed: number): number {
  const baseScore = cardsInFoundations * 25; // jusqu'à 52*25=1300 si toutes les cartes y sont
  const timePenalty = Math.min(Math.floor(timeSpentSeconds / 5), 200);
  const hintPenalty = hintsUsed * 50;
  return Math.max(baseScore - timePenalty - hintPenalty, 50);
}