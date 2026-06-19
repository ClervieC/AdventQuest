import {
    calculateColumnHints,
    calculateLineHints,
    calculateNonogramScore,
    calculateRowHints,
    createEmptyGrid,
    cycleCell,
    Grid,
    isPuzzleSolved,
} from './logic';
import { NONOGRAM_SNOWFLAKE } from './puzzles';

describe('calculateLineHints', () => {
  test('ligne vide retourne [0]', () => {
    expect(calculateLineHints([false, false, false])).toEqual([0]);
  });

  test('ligne entièrement remplie retourne un seul indice', () => {
    expect(calculateLineHints([true, true, true])).toEqual([3]);
  });

  test('deux blocs séparés retournent deux indices', () => {
    expect(calculateLineHints([true, true, false, true])).toEqual([2, 1]);
  });

  test('plusieurs blocs de tailles différentes', () => {
    expect(calculateLineHints([true, false, true, true, false, true])).toEqual([1, 2, 1]);
  });
});

describe('calculateRowHints et calculateColumnHints', () => {
  test('calcule correctement les indices de lignes pour une solution simple', () => {
    const solution = [
      [true, false, true],
      [true, true, true],
      [false, true, false],
    ];
    const rowHints = calculateRowHints(solution);
    expect(rowHints).toEqual([[1, 1], [3], [1]]);
  });

  test('calcule correctement les indices de colonnes pour une solution simple', () => {
    const solution = [
      [true, false, true],
      [true, true, true],
      [false, true, false],
    ];
    const colHints = calculateColumnHints(solution);
    expect(colHints).toEqual([[2], [2], [2]]);
  });
});

describe('createEmptyGrid', () => {
  test('crée une grille de la bonne taille, tout en "empty"', () => {
    const grid = createEmptyGrid(5);
    expect(grid).toHaveLength(5);
    expect(grid[0]).toHaveLength(5);
    expect(grid.every((row) => row.every((cell) => cell === 'empty'))).toBe(true);
  });
});

describe('cycleCell', () => {
  test('empty -> filled', () => {
    expect(cycleCell('empty')).toBe('filled');
  });

  test('filled -> marked', () => {
    expect(cycleCell('filled')).toBe('marked');
  });

  test('marked -> empty (boucle)', () => {
    expect(cycleCell('marked')).toBe('empty');
  });
});

describe('isPuzzleSolved', () => {
  test('grille vide n\'est pas résolue (sauf solution entièrement vide)', () => {
    const grid = createEmptyGrid(5);
    expect(isPuzzleSolved(grid, NONOGRAM_SNOWFLAKE.solution)).toBe(false);
  });

  test('grille correspondant exactement à la solution est résolue', () => {
    const grid: Grid = NONOGRAM_SNOWFLAKE.solution.map((row) =>
      row.map((cell) => (cell ? 'filled' : 'empty'))
    );
    expect(isPuzzleSolved(grid, NONOGRAM_SNOWFLAKE.solution)).toBe(true);
  });

  test('une seule case incorrecte rend la grille non résolue', () => {
    const grid: Grid = NONOGRAM_SNOWFLAKE.solution.map((row) =>
      row.map((cell) => (cell ? 'filled' : 'empty'))
    );
    grid[0][0] = 'filled'; // cette case devrait être 'empty' selon la solution
    expect(isPuzzleSolved(grid, NONOGRAM_SNOWFLAKE.solution)).toBe(false);
  });

  test('les cases "marked" (croix) ne comptent pas comme remplies', () => {
    const grid: Grid = NONOGRAM_SNOWFLAKE.solution.map((row) =>
      row.map((cell) => (cell ? 'filled' : 'marked'))
    );
    expect(isPuzzleSolved(grid, NONOGRAM_SNOWFLAKE.solution)).toBe(true); // marked = pas filled, donc OK si la solution attend false ici
  });
});

describe('calculateNonogramScore', () => {
  test('score parfait sans erreur ni hint', () => {
    expect(calculateNonogramScore(10, 0, 0)).toBe(870); // 900 - 30
  });

  test('pénalité de temps plafonnée à 300', () => {
    expect(calculateNonogramScore(200, 0, 0)).toBe(600); // 900 - 300
  });

  test('chaque erreur coûte 15 points', () => {
    expect(calculateNonogramScore(10, 4, 0)).toBe(810); // 900 - 30 - 60
  });

  test('le score ne descend jamais sous 100', () => {
    expect(calculateNonogramScore(9999, 99, 99)).toBe(100);
  });
});