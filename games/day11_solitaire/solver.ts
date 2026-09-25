// Solveur de Klondike selon les règles EXACTES du jeu (voir logic.ts) :
// pioche 1 par 1, défausse recyclable sans limite, séquences déplaçables, Roi seul sur colonne vide,
// pas de retour depuis les fondations.
//
// Simplification exacte : comme on pioche 1 carte à la fois et qu'on recycle sans limite, n'importe quelle
// carte de la pioche/défausse ("talon") peut être amenée sur la défausse. Le solveur la considère donc jouable
// directement (le joueur, lui, pioche jusqu'à elle). Utilisé hors ligne pour choisir des donnes avec solution.
import { canPlaceOnColumn, canPlaceOnFoundation, Card, GameState, getMovableCards } from './logic';

export type SolverTarget = { type: 'foundation' | 'column'; index: number };
export type SolverMove =
  | { from: 'talon'; cardId: string; to: SolverTarget }
  | { from: 'column'; column: number; cardIndex: number; to: SolverTarget };

interface SolverState {
  columns: Card[][];
  foundations: Card[][];
  talon: Card[]; // pioche + défausse, toutes accessibles
}

export interface SolveResult {
  solved: boolean; // false aussi quand le budget est épuisé (inconnu = on n'utilise pas la donne)
  moves: SolverMove[];
  nodes: number;
}

const keyOf = (s: SolverState) =>
  s.columns.map((col) => col.map((c) => (c.faceUp ? c.id : '#' + c.id)).join(',')).join('|') +
  '/' + s.foundations.map((f) => f.length).join(',') +
  '/' + s.talon.map((c) => c.id).join(',');

const isWon = (s: SolverState) => s.foundations.every((f) => f.length === 13);

function flipTop(column: Card[]): Card[] {
  if (column.length === 0 || column[column.length - 1].faceUp) return column;
  const next = column.slice();
  next[next.length - 1] = { ...next[next.length - 1], faceUp: true };
  return next;
}

function apply(state: SolverState, move: SolverMove): SolverState {
  const columns = state.columns.slice();
  const foundations = state.foundations.slice();
  let talon = state.talon;
  let cards: Card[];
  if (move.from === 'talon') {
    const card = talon.find((c) => c.id === move.cardId)!;
    talon = talon.filter((c) => c.id !== move.cardId);
    cards = [{ ...card, faceUp: true }];
  } else {
    cards = columns[move.column].slice(move.cardIndex);
    columns[move.column] = flipTop(columns[move.column].slice(0, move.cardIndex));
  }
  if (move.to.type === 'foundation') foundations[move.to.index] = [...foundations[move.to.index], cards[0]];
  else columns[move.to.index] = [...columns[move.to.index], ...cards];
  return { columns, foundations, talon };
}

/** Coups candidats, du plus prometteur au moins prometteur (l'ordre accélère beaucoup la recherche) */
function candidateMoves(s: SolverState): SolverMove[] {
  const toFoundation: SolverMove[] = [];
  const revealing: SolverMove[] = [];
  const fromTalon: SolverMove[] = [];
  const others: SolverMove[] = [];

  const foundationFor = (card: Card) => s.foundations.findIndex((f) => canPlaceOnFoundation(card, f));

  // 1. Vers les fondations (carte du dessus des colonnes, ou n'importe quelle carte du talon)
  s.columns.forEach((col, column) => {
    if (col.length === 0) return;
    const f = foundationFor(col[col.length - 1]);
    if (f !== -1) toFoundation.push({ from: 'column', column, cardIndex: col.length - 1, to: { type: 'foundation', index: f } });
  });
  s.talon.forEach((card) => {
    const f = foundationFor(card);
    if (f !== -1) toFoundation.push({ from: 'talon', cardId: card.id, to: { type: 'foundation', index: f } });
  });

  // 2. Colonne → colonne
  s.columns.forEach((col, column) => {
    const firstFaceUp = col.findIndex((c) => c.faceUp);
    if (firstFaceUp === -1) return;
    for (let cardIndex = firstFaceUp; cardIndex < col.length; cardIndex++) {
      if (!getMovableCards(col, cardIndex)) continue;
      const revealsCard = cardIndex === firstFaceUp && firstFaceUp > 0;
      // Une séquence partielle n'est utile que si elle libère une carte pour les fondations
      const freesForFoundation = cardIndex > firstFaceUp && foundationFor(col[cardIndex - 1]) !== -1;
      const emptiesColumn = cardIndex === 0;
      if (!revealsCard && !freesForFoundation && !(emptiesColumn && col[0].rank !== 13)) continue;
      s.columns.forEach((target, index) => {
        if (index === column || !canPlaceOnColumn(col[cardIndex], target)) return;
        if (target.length === 0 && cardIndex === 0) return; // déplacer une colonne entière vers une colonne vide ne sert à rien
        const move: SolverMove = { from: 'column', column, cardIndex, to: { type: 'column', index } };
        (revealsCard ? revealing : others).push(move);
      });
    }
  });

  // 3. Talon → colonne
  s.talon.forEach((card) => {
    s.columns.forEach((target, index) => {
      if (canPlaceOnColumn({ ...card, faceUp: true }, target)) fromTalon.push({ from: 'talon', cardId: card.id, to: { type: 'column', index } });
    });
  });

  return [...toFoundation, ...revealing, ...fromTalon, ...others];
}

/** Cherche une solution ; s'arrête (résultat "non résolu") après `maxNodes` positions explorées */
export function solve(game: GameState, maxNodes = 150000): SolveResult {
  const start: SolverState = {
    columns: game.columns.map((c) => c.slice()),
    foundations: game.foundations.map((f) => f.slice()),
    talon: [...game.waste, ...game.stock].map((c) => ({ ...c, faceUp: true })),
  };
  const visited = new Set<string>();
  const path: SolverMove[] = [];
  let nodes = 0;

  const search = (state: SolverState): boolean => {
    if (isWon(state)) return true;
    if (nodes >= maxNodes) return false;
    const key = keyOf(state);
    if (visited.has(key)) return false;
    visited.add(key);
    nodes++;
    for (const move of candidateMoves(state)) {
      path.push(move);
      if (search(apply(state, move))) return true;
      path.pop();
      if (nodes >= maxNodes) return false;
    }
    return false;
  };

  const solved = search(start);
  return { solved, moves: solved ? path.slice() : [], nodes };
}
