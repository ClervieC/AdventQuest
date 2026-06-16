import { isGridComplete, isGridValid } from './logic';
import { generateSudokuPuzzle } from './puzzles';

describe('generateSudokuPuzzle', () => {
  test('la solution générée est toujours une grille 9x9 complète et valide', () => {
    const puzzle = generateSudokuPuzzle('easy');
    expect(puzzle.gridSize).toBe(9);
    expect(puzzle.solution).toHaveLength(9);
    expect(puzzle.solution[0]).toHaveLength(9);

    const solutionAsGrid = puzzle.solution.map((row) => row.map((cell) => cell));
    expect(isGridComplete(solutionAsGrid)).toBe(true);
    expect(isGridValid(solutionAsGrid, 9)).toBe(true);
  });

  test('le puzzle "easy" a beaucoup plus de cases pré-remplies que "very_hard"', () => {
    const easyPuzzle = generateSudokuPuzzle('easy');
    const hardPuzzle = generateSudokuPuzzle('very_hard');

    const countFilled = (grid: typeof easyPuzzle.initialGrid) =>
      grid.flat().filter((cell) => cell !== null).length;

    expect(countFilled(easyPuzzle.initialGrid)).toBeGreaterThan(countFilled(hardPuzzle.initialGrid));
  });

  test('toutes les cases pré-remplies du puzzle correspondent à la solution', () => {
    const puzzle = generateSudokuPuzzle('medium');
    puzzle.initialGrid.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell !== null) {
          expect(cell).toBe(puzzle.solution[r][c]);
        }
      });
    });
  });

  test('génère des grilles différentes à chaque appel (pas toujours la même)', () => {
    const puzzle1 = generateSudokuPuzzle('easy');
    const puzzle2 = generateSudokuPuzzle('easy');
    // très improbable que deux grilles générées aléatoirement soient identiques
    expect(puzzle1.solution).not.toEqual(puzzle2.solution);
  });
});