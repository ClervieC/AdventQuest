// Match-3 « friandises de Noël » : on échange deux friandises voisines pour en aligner au moins 3 identiques.
// Les alignements disparaissent, tout tombe, de nouvelles friandises arrivent par le haut (réactions en chaîne).

export type Board = number[][]; // index de la friandise (0..KINDS-1)
export interface Cell {
  row: number;
  col: number;
}

export const SIZE = 7;
export const KINDS = 6;
export const TREATS = ['🍎', '🍭', '🍪', '🔔', '⭐', '🎄'];
export const POINTS_PER_TILE = 10;

const inside = (r: number, c: number) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;

/** Cases faisant partie d'un alignement de 3 ou plus (lignes et colonnes) */
export function findMatches(board: Board): Cell[] {
  const hit = new Set<string>();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = board[r][c];
      if (v < 0) continue;
      // Début d'un alignement horizontal
      if (c === 0 || board[r][c - 1] !== v) {
        let end = c;
        while (end + 1 < SIZE && board[r][end + 1] === v) end++;
        if (end - c + 1 >= 3) for (let k = c; k <= end; k++) hit.add(`${r},${k}`);
      }
      // Début d'un alignement vertical
      if (r === 0 || board[r - 1][c] !== v) {
        let end = r;
        while (end + 1 < SIZE && board[end + 1][c] === v) end++;
        if (end - r + 1 >= 3) for (let k = r; k <= end; k++) hit.add(`${k},${c}`);
      }
    }
  }
  return [...hit].map((key) => {
    const [row, col] = key.split(',').map(Number);
    return { row, col };
  });
}

export function isAdjacent(a: Cell, b: Cell): boolean {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

export function swap(board: Board, a: Cell, b: Cell): Board {
  const next = board.map((row) => [...row]);
  [next[a.row][a.col], next[b.row][b.col]] = [next[b.row][b.col], next[a.row][a.col]];
  return next;
}

/** Retire les cases données, fait tomber le reste et remplit le haut avec de nouvelles friandises */
export function collapse(board: Board, cleared: Cell[], random: () => number = Math.random): Board {
  const gone = new Set(cleared.map((c) => `${c.row},${c.col}`));
  const next: Board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  for (let c = 0; c < SIZE; c++) {
    const kept: number[] = [];
    for (let r = SIZE - 1; r >= 0; r--) if (!gone.has(`${r},${c}`)) kept.push(board[r][c]);
    for (let r = SIZE - 1, i = 0; r >= 0; r--, i++) {
      next[r][c] = i < kept.length ? kept[i] : Math.floor(random() * KINDS);
    }
  }
  return next;
}

/**
 * Enchaîne les disparitions jusqu'à ce qu'il n'y ait plus d'alignement.
 * Chaque vague rapporte 10 points par friandise × son rang dans la chaîne (1re vague ×1, 2e ×2...).
 * `firstCleared` : les cases de la 1re vague, pour les faire clignoter.
 */
export function resolve(board: Board, random: () => number = Math.random): { board: Board; gained: number; chains: number; firstCleared: Cell[] } {
  let current = board;
  let gained = 0;
  let chains = 0;
  let firstCleared: Cell[] = [];
  for (;;) {
    const matches = findMatches(current);
    if (matches.length === 0) break;
    chains++;
    if (chains === 1) firstCleared = matches;
    gained += matches.length * POINTS_PER_TILE * chains;
    current = collapse(current, matches, random);
    if (chains > 50) break; // sécurité
  }
  return { board: current, gained, chains, firstCleared };
}

/** Un échange utile possible (pour l'indice, et pour savoir s'il faut remélanger) */
export function findValidMove(board: Board): [Cell, Cell] | null {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const a = { row: r, col: c };
        const b = { row: r + dr, col: c + dc };
        if (!inside(b.row, b.col)) continue;
        if (findMatches(swap(board, a, b)).length > 0) return [a, b];
      }
    }
  }
  return null;
}

/** Nouveau plateau sans alignement déjà fait, avec au moins un coup possible */
export function createBoard(random: () => number = Math.random): Board {
  for (;;) {
    const board: Board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        let v: number;
        do {
          v = Math.floor(random() * KINDS);
        } while ((c >= 2 && board[r][c - 1] === v && board[r][c - 2] === v) || (r >= 2 && board[r - 1][c] === v && board[r - 2][c] === v));
        board[r][c] = v;
      }
    }
    if (findValidMove(board)) return board;
  }
}

/** Joue un échange : null si les cases ne sont pas voisines ou si l'échange n'aligne rien */
export function playSwap(board: Board, a: Cell, b: Cell, random: () => number = Math.random) {
  if (!isAdjacent(a, b)) return null;
  const swapped = swap(board, a, b);
  if (findMatches(swapped).length === 0) return null;
  const result = resolve(swapped, random);
  // Plus aucun coup possible : on remélange
  const finalBoard = findValidMove(result.board) ? result.board : createBoard(random);
  return { ...result, swapped, board: finalBoard, reshuffled: finalBoard !== result.board };
}
