import {
    calculateSudokuScore,
    Grid,
    isGridComplete,
    isGridValid,
    isSolved,
    isValidPlacement,
    revealRandomCell,
} from './logic';

// Grille 9x9 complète et valide, utilisée comme référence dans tous les tests
const VALID_SOLVED_GRID: Grid = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

describe('Sudoku 9x9 - isValidPlacement', () => {
  test('rejette un doublon sur la même ligne', () => {
    const grid = VALID_SOLVED_GRID.map((row) => [...row]);
    grid[0][8] = null;
    expect(isValidPlacement(grid, 0, 8, 5, 9)).toBe(false); // 5 déjà en (0,0)
  });

  test('rejette un doublon sur la même colonne', () => {
    const grid = VALID_SOLVED_GRID.map((row) => [...row]);
    grid[8][0] = null;
    expect(isValidPlacement(grid, 8, 0, 5, 9)).toBe(false); // 5 déjà en (0,0)
  });

  test('rejette un doublon dans le même bloc 3x3', () => {
    const grid = VALID_SOLVED_GRID.map((row) => [...row]);
    grid[1][1] = null;
    expect(isValidPlacement(grid, 1, 1, 5, 9)).toBe(false); // 5 déjà en (0,0)
  });

  test('accepte un placement valide', () => {
    const grid = VALID_SOLVED_GRID.map((row) => [...row]);
    grid[0][0] = null;
    expect(isValidPlacement(grid, 0, 0, 5, 9)).toBe(true);
  });
});

describe('Sudoku 9x9 - isGridComplete', () => {
  test('grille avec des cases vides retourne false', () => {
    const grid = VALID_SOLVED_GRID.map((row) => [...row]);
    grid[4][4] = null;
    expect(isGridComplete(grid)).toBe(false);
  });

  test('grille entièrement remplie retourne true', () => {
    expect(isGridComplete(VALID_SOLVED_GRID)).toBe(true);
  });
});

describe('Sudoku 9x9 - isGridValid', () => {
  test('grille sans aucun doublon est valide', () => {
    expect(isGridValid(VALID_SOLVED_GRID, 9)).toBe(true);
  });

  test('grille avec un doublon sur une ligne est invalide', () => {
    const grid = VALID_SOLVED_GRID.map((row) => [...row]);
    grid[0][7] = grid[0][0]; // doublon volontaire
    expect(isGridValid(grid, 9)).toBe(false);
  });
});

describe('Sudoku 9x9 - isSolved', () => {
  test('grille valide ET complète = résolue', () => {
    expect(isSolved(VALID_SOLVED_GRID, 9)).toBe(true);
  });

  test('grille complète mais avec une erreur = pas résolue', () => {
    const grid = VALID_SOLVED_GRID.map((row) => [...row]);
    grid[8][8] = grid[8][7]; // doublon volontaire sur la dernière ligne
    expect(isSolved(grid, 9)).toBe(false);
  });

  test("grille incomplète = pas résolue, même si pas d'erreur", () => {
    const grid = VALID_SOLVED_GRID.map((row) => [...row]);
    grid[0][0] = null;
    expect(isSolved(grid, 9)).toBe(false);
  });
});

describe('Sudoku 9x9 - calculateSudokuScore', () => {
  test('score parfait : rapide, sans hint, difficulté medium', () => {
    expect(calculateSudokuScore(10, 0, 'medium')).toBe(1490); // 1500 - 10 - 0
  });

  test('pénalité de temps plafonnée selon la difficulté (easy)', () => {
    expect(calculateSudokuScore(99999, 0, 'easy')).toBe(900); // 1500 - 600 - 0
  });

  test('pénalité de temps plafonnée selon la difficulté (hard)', () => {
    expect(calculateSudokuScore(99999, 0, 'hard')).toBe(500); // 1500 - 1000 - 0
  });

  test('chaque hint coûte 100 points', () => {
    expect(calculateSudokuScore(10, 3, 'medium')).toBe(1190); // 1500 - 10 - 300
  });

  test('le score ne descend jamais sous 100', () => {
    expect(calculateSudokuScore(99999, 99, 'hard')).toBe(100);
  });
});

describe('Sudoku 9x9 - revealRandomCell', () => {
  test('révèle une cellule vide avec la bonne valeur', () => {
    const grid = VALID_SOLVED_GRID.map((row) => [...row]);
    grid[0][0] = null;
    expect(revealRandomCell(grid, VALID_SOLVED_GRID)).toEqual({ row: 0, col: 0, value: 5 });
  });

  test('retourne null si la grille est déjà complète', () => {
    expect(revealRandomCell(VALID_SOLVED_GRID, VALID_SOLVED_GRID)).toBeNull();
  });
});