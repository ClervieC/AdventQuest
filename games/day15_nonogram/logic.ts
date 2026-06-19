export type CellState = 'empty' | 'filled' | 'marked'; // marked = croix, pour indiquer "sûrement vide"
export type Grid = CellState[][];
export type Solution = boolean[][]; // true = doit être rempli

export interface NonogramPuzzle {
  name: string;
  size: number;
  solution: Solution;
}

/** Calcule les indices d'une ligne ou colonne à partir de la solution (séquences de cases remplies consécutives) */
export function calculateLineHints(line: boolean[]): number[] {
  const hints: number[] = [];
  let currentRun = 0;

  for (const cell of line) {
    if (cell) {
      currentRun += 1;
    } else if (currentRun > 0) {
      hints.push(currentRun);
      currentRun = 0;
    }
  }
  if (currentRun > 0) hints.push(currentRun);

  return hints.length > 0 ? hints : [0];
}

/** Calcule tous les indices de lignes pour une solution complète */
export function calculateRowHints(solution: Solution): number[][] {
  return solution.map((row) => calculateLineHints(row));
}

/** Calcule tous les indices de colonnes pour une solution complète */
export function calculateColumnHints(solution: Solution): number[][] {
  const size = solution.length;
  const columns: number[][] = [];
  for (let col = 0; col < size; col++) {
    const column = solution.map((row) => row[col]);
    columns.push(calculateLineHints(column));
  }
  return columns;
}

/** Crée une grille vide (toutes les cases à 'empty') */
export function createEmptyGrid(size: number): Grid {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => 'empty' as CellState));
}

/** Bascule l'état d'une case : empty -> filled -> marked -> empty */
export function cycleCell(currentState: CellState): CellState {
  if (currentState === 'empty') return 'filled';
  if (currentState === 'filled') return 'marked';
  return 'empty';
}

/** Vérifie si la grille actuelle (uniquement les cases 'filled') correspond exactement à la solution */
export function isPuzzleSolved(grid: Grid, solution: Solution): boolean {
  for (let row = 0; row < solution.length; row++) {
    for (let col = 0; col < solution[row].length; col++) {
      const shouldBeFilled = solution[row][col];
      const isFilled = grid[row][col] === 'filled';
      if (shouldBeFilled !== isFilled) return false;
    }
  }
  return true;
}

export function calculateNonogramScore(timeSpentSeconds: number, wrongCellsToggled: number, hintsUsed: number): number {
  const baseScore = 900;
  const timePenalty = Math.min(timeSpentSeconds * 3, 300);
  const errorPenalty = wrongCellsToggled * 15;
  const hintPenalty = hintsUsed * 80;
  return Math.max(baseScore - timePenalty - errorPenalty - hintPenalty, 100);
}