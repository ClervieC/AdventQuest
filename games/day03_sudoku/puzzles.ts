import { Grid, isValidPlacement, SudokuPuzzle } from './logic';

const GRID_SIZE = 9;

/** Mélange un tableau (Fisher-Yates) */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Génère une grille 9x9 complète et valide via backtracking */
function generateCompleteSolution(): number[][] {
  const grid: number[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));

  function fillCell(position: number): boolean {
    if (position === GRID_SIZE * GRID_SIZE) return true; // grille complète

    const row = Math.floor(position / GRID_SIZE);
    const col = position % GRID_SIZE;

    const candidates = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    for (const value of candidates) {
      // on réutilise isValidPlacement avec une grille temporaire en null/number
      const gridAsNullable: Grid = grid.map((r) => r.map((c) => (c === 0 ? null : c)));
      if (isValidPlacement(gridAsNullable, row, col, value, GRID_SIZE)) {
        grid[row][col] = value;
        if (fillCell(position + 1)) return true;
        grid[row][col] = 0; // backtrack
      }
    }
    return false;
  }

  fillCell(0);
  return grid;
}

/** Retire N cellules d'une grille complète pour créer le puzzle à résoudre */
function createPuzzleFromSolution(solution: number[][], cellsToRemove: number): Grid {
  const grid: Grid = solution.map((row) => [...row]);
  const positions: [number, number][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      positions.push([r, c]);
    }
  }
  const shuffled = shuffle(positions);
  for (let i = 0; i < cellsToRemove; i++) {
    const [r, c] = shuffled[i];
    grid[r][c] = null;
  }
  return grid;
}

export type SudokuDifficulty = 'easy' | 'medium' | 'hard' | 'very_hard';

/** Nombre de cases RETIRÉES (donc vides) selon la difficulté — sur 81 cases au total */
const CELLS_TO_REMOVE: Record<SudokuDifficulty, number> = {
  easy: 30,        // ~51 cases pré-remplies — beaucoup d'aide visuelle
  medium: 40,       // ~41 cases pré-remplies
  hard: 50,         // ~31 cases pré-remplies
  very_hard: 58,    // ~23 cases pré-remplies — très peu d'indices de départ
};

export function generateSudokuPuzzle(difficulty: SudokuDifficulty = 'easy'): SudokuPuzzle {
  const solution = generateCompleteSolution();
  const cellsToRemove = CELLS_TO_REMOVE[difficulty];
  return {
    gridSize: GRID_SIZE,
    solution,
    initialGrid: createPuzzleFromSolution(solution, cellsToRemove),
  };
}