export interface Position {
  row: number;
  col: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * Une cellule du labyrinthe : chaque mur (haut/bas/gauche/droite) est soit présent soit absent.
 * `visited` sert uniquement pendant la génération, pas pendant le jeu.
 */
export interface MazeCell {
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
  visited: boolean;
}

export type Maze = MazeCell[][];

/** Crée une grille où toutes les cellules ont leurs 4 murs (avant génération) */
function createEmptyMaze(size: number): Maze {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({
      walls: { top: true, right: true, bottom: true, left: true },
      visited: false,
    }))
  );
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Retire le mur entre deux cellules adjacentes, des deux côtés */
function removeWallBetween(maze: Maze, current: Position, next: Position): void {
  const rowDiff = next.row - current.row;
  const colDiff = next.col - current.col;

  if (rowDiff === 1) {
    maze[current.row][current.col].walls.bottom = false;
    maze[next.row][next.col].walls.top = false;
  } else if (rowDiff === -1) {
    maze[current.row][current.col].walls.top = false;
    maze[next.row][next.col].walls.bottom = false;
  } else if (colDiff === 1) {
    maze[current.row][current.col].walls.right = false;
    maze[next.row][next.col].walls.left = false;
  } else if (colDiff === -1) {
    maze[current.row][current.col].walls.left = false;
    maze[next.row][next.col].walls.right = false;
  }
}

function getUnvisitedNeighbors(maze: Maze, position: Position, size: number): Position[] {
  const candidates: Position[] = [
    { row: position.row - 1, col: position.col },
    { row: position.row + 1, col: position.col },
    { row: position.row, col: position.col - 1 },
    { row: position.row, col: position.col + 1 },
  ];

  return candidates.filter(
    (p) => p.row >= 0 && p.row < size && p.col >= 0 && p.col < size && !maze[p.row][p.col].visited
  );
}

/** Génère un labyrinthe résolvable via recursive backtracking, en partant de (0,0) */
export function generateMaze(size: number): Maze {
  const maze = createEmptyMaze(size);
  const stack: Position[] = [{ row: 0, col: 0 }];
  maze[0][0].visited = true;

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = shuffle(getUnvisitedNeighbors(maze, current, size));

    if (neighbors.length === 0) {
      stack.pop(); // dead-end, on remonte
    } else {
      const next = neighbors[0];
      removeWallBetween(maze, current, next);
      maze[next.row][next.col].visited = true;
      stack.push(next);
    }
  }

  return maze;
}

/** Vérifie si un déplacement dans une direction donnée est possible (pas de mur) */
export function canMove(maze: Maze, position: Position, direction: Direction): boolean {
  const cell = maze[position.row][position.col];
  switch (direction) {
    case 'up':
      return !cell.walls.top;
    case 'down':
      return !cell.walls.bottom;
    case 'left':
      return !cell.walls.left;
    case 'right':
      return !cell.walls.right;
  }
}

/** Calcule la nouvelle position après un déplacement valide */
export function getNextPosition(position: Position, direction: Direction): Position {
  switch (direction) {
    case 'up':
      return { row: position.row - 1, col: position.col };
    case 'down':
      return { row: position.row + 1, col: position.col };
    case 'left':
      return { row: position.row, col: position.col - 1 };
    case 'right':
      return { row: position.row, col: position.col + 1 };
  }
}

/** Tente un déplacement : retourne la nouvelle position si valide, sinon la position actuelle inchangée */
export function attemptMove(maze: Maze, position: Position, direction: Direction): Position {
  if (!canMove(maze, position, direction)) return position;
  return getNextPosition(position, direction);
}

export function isAtExit(position: Position, size: number): boolean {
  return position.row === size - 1 && position.col === size - 1;
}

/**
 * Calcule le score selon le nombre de mouvements effectués (moins de mouvements = meilleur score).
 * `optimalMoves` : longueur du plus court chemin (sinon estimée grossièrement à 2 × la taille).
 */
export function calculateMazeScore(movesCount: number, mazeSize: number, optimalMoves: number = mazeSize * 2): number {
  const baseScore = 1000;
  const penalty = Math.max(0, movesCount - optimalMoves) * 15;
  return Math.max(baseScore - penalty, 200);
}
const PERPENDICULAR: Record<Direction, Direction[]> = {
  up: ['left', 'right'],
  down: ['left', 'right'],
  left: ['up', 'down'],
  right: ['up', 'down'],
};

/**
 * Glissement : avance dans une direction jusqu'au mur, jusqu'au prochain croisement
 * (une autre direction devient possible) ou jusqu'à la sortie. Renvoie la position atteinte et le nombre de cases.
 */
export function slideMove(maze: Maze, position: Position, direction: Direction): { position: Position; steps: number } {
  const path = slidePath(maze, position, direction);
  return { position: path.length > 0 ? path[path.length - 1] : position, steps: path.length };
}

/** Cases traversées par un glissement, dans l'ordre (sans la case de départ ; vide si un mur bloque) */
export function slidePath(maze: Maze, position: Position, direction: Direction): Position[] {
  const size = maze.length;
  const path: Position[] = [];
  let current = position;
  while (canMove(maze, current, direction)) {
    current = getNextPosition(current, direction);
    path.push(current);
    if (isAtExit(current, size)) break;
    if (PERPENDICULAR[direction].some((side) => canMove(maze, current, side))) break; // croisement
  }
  return path;
}

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];

/** Distance (en cases, en suivant les couloirs) de chaque case depuis `from` */
export function distancesFrom(maze: Maze, from: Position): number[][] {
  const size = maze.length;
  const distances = Array.from({ length: size }, () => Array<number>(size).fill(Infinity));
  distances[from.row][from.col] = 0;
  const queue: Position[] = [from];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const direction of DIRECTIONS) {
      if (!canMove(maze, current, direction)) continue;
      const next = getNextPosition(current, direction);
      if (distances[next.row][next.col] !== Infinity) continue;
      distances[next.row][next.col] = distances[current.row][current.col] + 1;
      queue.push(next);
    }
  }
  return distances;
}

/** Longueur du plus court chemin entre le départ (0,0) et la sortie */
export function shortestPathLength(maze: Maze): number {
  const size = maze.length;
  return distancesFrom(maze, { row: 0, col: 0 })[size - 1][size - 1];
}

/**
 * Torches à ramasser (du temps en plus) : sur des cases au hasard, assez loin du départ (`minDistance`
 * cases de couloir) et jamais sur la sortie ni l'une sur l'autre.
 */
export function placeTorches(maze: Maze, count: number, minDistance: number, random: () => number = Math.random): Position[] {
  const size = maze.length;
  const distances = distancesFrom(maze, { row: 0, col: 0 });
  const candidates: Position[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (distances[row][col] >= minDistance && !isAtExit({ row, col }, size)) candidates.push({ row, col });
    }
  }
  const torches: Position[] = [];
  while (torches.length < count && candidates.length > 0) {
    torches.push(candidates.splice(Math.floor(random() * candidates.length), 1)[0]);
  }
  return torches;
}
