export type Cell = number | null;
export type Grid = Cell[][];

export interface SudokuPuzzle {
  initialGrid: Grid;   // la grille de départ (avec trous à remplir)
  solution: Grid;       // la solution complète, pour vérification
  gridSize: number;     // 9 pour cette version
}

/** Vérifie si placer `value` à (row, col) respecte les règles ligne/colonne/bloc */
export function isValidPlacement(
  grid: Grid,
  row: number,
  col: number,
  value: number,
  gridSize: number
): boolean {
  // Ligne
  for (let c = 0; c < gridSize; c++) {
    if (c !== col && grid[row][c] === value) return false;
  }
  // Colonne
  for (let r = 0; r < gridSize; r++) {
    if (r !== row && grid[r][col] === value) return false;
  }
  // Bloc (pour une grille 9x9, blocs 3x3)
  const blockSize = Math.sqrt(gridSize);
  const blockRow = Math.floor(row / blockSize) * blockSize;
  const blockCol = Math.floor(col / blockSize) * blockSize;
  for (let r = blockRow; r < blockRow + blockSize; r++) {
    for (let c = blockCol; c < blockCol + blockSize; c++) {
      if ((r !== row || c !== col) && grid[r][c] === value) return false;
    }
  }
  return true;
}

/** La grille est-elle entièrement remplie (sans case vide) ? */
export function isGridComplete(grid: Grid): boolean {
  return grid.every((row) => row.every((cell) => cell !== null));
}

/** La grille remplie respecte-t-elle toutes les règles (pas de doublon) ? */
export function isGridValid(grid: Grid, gridSize: number): boolean {
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const value = grid[row][col];
      if (value !== null && !isValidPlacement(grid, row, col, value, gridSize)) {
        return false;
      }
    }
  }
  return true;
}

/** Combine complétude + validité : la grille est-elle gagnée ? */
export function isSolved(grid: Grid, gridSize: number): boolean {
  return isGridComplete(grid) && isGridValid(grid, gridSize);
}

/** Calcule le score selon le temps pris, le nombre de hints et la difficulté */
export function calculateSudokuScore(
  timeSpentSeconds: number,
  hintsUsed: number,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): number {
  const baseScore = 1500; // grille 9x9 = base plus haute que la version 4x4
  const timePenaltyCap: Record<'easy' | 'medium' | 'hard', number> = {
    easy: 600,
    medium: 800,
    hard: 1000,
  };
  const timePenalty = Math.min(timeSpentSeconds, timePenaltyCap[difficulty]);
  const hintPenalty = hintsUsed * 100;
  return Math.max(baseScore - timePenalty - hintPenalty, 100); // jamais sous 100
}

/** Révèle une case aléatoire encore vide, pour le système de hints */
export function revealRandomCell(
  grid: Grid,
  solution: Grid
): { row: number; col: number; value: number } | null {
  const emptyCells: { row: number; col: number }[] = [];
  grid.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell === null) emptyCells.push({ row: r, col: c });
    });
  });

  if (emptyCells.length === 0) return null;

  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  return {
    row: randomCell.row,
    col: randomCell.col,
    value: solution[randomCell.row][randomCell.col] as number,
  };
}