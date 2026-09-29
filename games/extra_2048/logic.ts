// 2048 de Noël : on fait glisser toutes les tuiles ; deux tuiles identiques qui se rencontrent fusionnent.
// Les valeurs sont des puissances de 2, affichées comme des objets de Noël de plus en plus précieux.

export type Board = number[][]; // 0 = case vide
export type Direction = 'up' | 'down' | 'left' | 'right';

export const SIZE = 4;

/** Objet de Noël affiché pour chaque valeur (2 = flocon ... 2048 = Cœur de Noël) */
export const TILE_ICONS: Record<number, string> = {
  2: '❄️', 4: '⛄', 8: '🍪', 16: '🍭', 32: '🧦', 64: '🔔', 128: '🎄', 256: '🎁', 512: '⭐', 1024: '👑', 2048: '❤️‍🔥',
};

export function emptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

/** Pose une nouvelle tuile (2 dans 90 % des cas, sinon 4) sur une case vide au hasard */
export function addRandomTile(board: Board, random: () => number = Math.random): Board {
  const empty: [number, number][] = [];
  board.forEach((row, r) => row.forEach((v, c) => v === 0 && empty.push([r, c])));
  if (empty.length === 0) return board;
  const [r, c] = empty[Math.floor(random() * empty.length)];
  const next = board.map((row) => [...row]);
  next[r][c] = random() < 0.9 ? 2 : 4;
  return next;
}

export function newGame(random: () => number = Math.random): Board {
  return addRandomTile(addRandomTile(emptyBoard(), random), random);
}

/** Fait glisser une ligne vers la gauche : renvoie la ligne, les points gagnés (somme des fusions) */
export function slideRow(row: number[]): { row: number[]; gained: number } {
  const tiles = row.filter((v) => v !== 0);
  const result: number[] = [];
  let gained = 0;
  for (let i = 0; i < tiles.length; i++) {
    if (i + 1 < tiles.length && tiles[i] === tiles[i + 1]) {
      result.push(tiles[i] * 2);
      gained += tiles[i] * 2;
      i++; // une tuile ne fusionne qu'une fois par coup
    } else {
      result.push(tiles[i]);
    }
  }
  while (result.length < row.length) result.push(0);
  return { row: result, gained };
}

const transpose = (board: Board): Board => board[0].map((_, c) => board.map((row) => row[c]));
const reverseRows = (board: Board): Board => board.map((row) => [...row].reverse());

/** Joue un coup : renvoie le nouveau plateau (sans nouvelle tuile), les points gagnés et si quelque chose a bougé */
export function move(board: Board, direction: Direction): { board: Board; gained: number; moved: boolean } {
  // On ramène chaque direction à un glissement vers la gauche
  let working = board;
  if (direction === 'up' || direction === 'down') working = transpose(working);
  if (direction === 'right' || direction === 'down') working = reverseRows(working);

  let gained = 0;
  let slid = working.map((row) => {
    const result = slideRow(row);
    gained += result.gained;
    return result.row;
  });

  if (direction === 'right' || direction === 'down') slid = reverseRows(slid);
  if (direction === 'up' || direction === 'down') slid = transpose(slid);

  const moved = slid.some((row, r) => row.some((v, c) => v !== board[r][c]));
  return { board: slid, gained, moved };
}

/** Plus aucun coup ne fait bouger une tuile */
export function isStuck(board: Board): boolean {
  return (['up', 'down', 'left', 'right'] as Direction[]).every((d) => !move(board, d).moved);
}

export function maxTile(board: Board): number {
  return Math.max(...board.flat());
}

/** Indice : le coup qui rapporte le plus de points tout de suite (à égalité, celui qui libère le plus de cases) */
export function bestMove(board: Board): Direction | null {
  let best: Direction | null = null;
  let bestValue = -1;
  for (const d of ['down', 'left', 'right', 'up'] as Direction[]) {
    const result = move(board, d);
    if (!result.moved) continue;
    const emptyCells = result.board.flat().filter((v) => v === 0).length;
    const value = result.gained * 100 + emptyCells;
    if (value > bestValue) {
      bestValue = value;
      best = d;
    }
  }
  return best;
}
