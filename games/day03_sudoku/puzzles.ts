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

const BOX = 3;
const ALL_DIGITS = 0b1111111110; // bits 1 à 9

/**
 * Compte les solutions d'une grille (0 = case vide), en s'arrêtant à `limit`.
 * Masques de bits par ligne / colonne / carré + on remplit toujours la case la plus contrainte : rapide.
 */
export function countSolutions(grid: number[][], limit = 2): number {
  const cells = grid.map((row) => [...row]);
  const rows = Array(GRID_SIZE).fill(0);
  const cols = Array(GRID_SIZE).fill(0);
  const boxes = Array(GRID_SIZE).fill(0);
  const boxOf = (r: number, c: number) => Math.floor(r / BOX) * BOX + Math.floor(c / BOX);
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const v = cells[r][c];
      if (!v) continue;
      const bit = 1 << v;
      if ((rows[r] | cols[c] | boxes[boxOf(r, c)]) & bit) return 0; // grille déjà contradictoire
      rows[r] |= bit;
      cols[c] |= bit;
      boxes[boxOf(r, c)] |= bit;
    }
  }

  let count = 0;
  const search = (): void => {
    // Case vide avec le moins de chiffres possibles
    let bestR = -1;
    let bestC = -1;
    let bestMask = 0;
    let bestCount = 10;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (cells[r][c]) continue;
        const mask = ALL_DIGITS & ~(rows[r] | cols[c] | boxes[boxOf(r, c)]);
        let n = 0;
        for (let m = mask; m; m &= m - 1) n++;
        if (n < bestCount) {
          bestR = r;
          bestC = c;
          bestMask = mask;
          bestCount = n;
          if (n <= 1) break;
        }
      }
      if (bestCount <= 1) break;
    }
    if (bestR === -1) {
      count++;
      return;
    }
    const b = boxOf(bestR, bestC);
    for (let v = 1; v <= 9 && count < limit; v++) {
      const bit = 1 << v;
      if (!(bestMask & bit)) continue;
      cells[bestR][bestC] = v;
      rows[bestR] |= bit;
      cols[bestC] |= bit;
      boxes[b] |= bit;
      search();
      cells[bestR][bestC] = 0;
      rows[bestR] &= ~bit;
      cols[bestC] &= ~bit;
      boxes[b] &= ~bit;
    }
  };
  search();
  return count;
}

/**
 * Retire jusqu'à N cellules d'une grille complète pour créer le puzzle, en gardant une SEULE solution :
 * une case n'est vidée que si la grille reste à solution unique. Le puzzle se résout donc par déduction,
 * sans jamais devoir deviner (même en très difficile).
 */
function createPuzzleFromSolution(solution: number[][], cellsToRemove: number): Grid {
  const grid = solution.map((row) => [...row]);
  const positions: [number, number][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      positions.push([r, c]);
    }
  }
  let removed = 0;
  for (const [r, c] of shuffle(positions)) {
    if (removed >= cellsToRemove) break;
    const value = grid[r][c];
    grid[r][c] = 0;
    if (countSolutions(grid, 2) === 1) removed++;
    else grid[r][c] = value; // deux solutions possibles : on garde ce chiffre
  }
  return grid.map((row) => row.map((v) => (v === 0 ? null : v)));
}

export type SudokuDifficulty = 'easy' | 'medium' | 'hard' | 'very_hard';

/** Nombre de cases RETIRÉES (donc vides) selon la difficulté — sur 81 cases au total */
const CELLS_TO_REMOVE: Record<SudokuDifficulty, number> = {
  easy: 30,        // ~51 cases pré-remplies — beaucoup d'aide visuelle
  medium: 40,       // ~41 cases pré-remplies
  hard: 50,         // ~31 cases pré-remplies
  very_hard: 56,    // ~25 cases pré-remplies — très peu d'indices de départ (mais une seule solution)
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