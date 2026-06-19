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

/** Calcule le score selon le nombre de mouvements effectués (moins de mouvements = meilleur score) */
export function calculateMazeScore(movesCount: number, mazeSize: number): number {
  const optimalMoves = mazeSize * 2; // estimation grossière du chemin minimal
  const baseScore = 1000;
  const penalty = Math.max(0, movesCount - optimalMoves) * 15;
  return Math.max(baseScore - penalty, 200);
}