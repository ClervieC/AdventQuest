import {
    areConnected,
    calculatePipeScore,
    getConnectors,
    isPathConnected,
    PipeTile,
    rotateTile,
} from './logic';
import { PIPE_PUZZLE_EASY } from './puzzles';

describe('getConnectors', () => {
  test('une tuile droite (rotation 0) connecte haut et bas', () => {
    const tile: PipeTile = { type: 'straight', rotation: 0 };
    expect(getConnectors(tile)).toEqual([true, false, true, false]);
  });

  test('une tuile droite tournée une fois connecte gauche et droite', () => {
    const tile: PipeTile = { type: 'straight', rotation: 1 };
    expect(getConnectors(tile)).toEqual([false, true, false, true]);
  });

  test('une croix connecte toujours les 4 directions, peu importe la rotation', () => {
    const tile: PipeTile = { type: 'cross', rotation: 2 };
    expect(getConnectors(tile)).toEqual([true, true, true, true]);
  });

  test('une tuile vide ne connecte jamais rien', () => {
    const tile: PipeTile = { type: 'empty', rotation: 0 };
    expect(getConnectors(tile)).toEqual([false, false, false, false]);
  });
});

describe('rotateTile', () => {
  test('incrémente la rotation de 1', () => {
    const tile: PipeTile = { type: 'corner', rotation: 0 };
    expect(rotateTile(tile).rotation).toBe(1);
  });

  test('boucle de 3 vers 0', () => {
    const tile: PipeTile = { type: 'corner', rotation: 3 };
    expect(rotateTile(tile).rotation).toBe(0);
  });

  test('ne modifie pas le type de tuile', () => {
    const tile: PipeTile = { type: 'tjunction', rotation: 0 };
    expect(rotateTile(tile).type).toBe('tjunction');
  });
});

describe('areConnected', () => {
  test('deux tuiles droites verticales alignées sont connectées', () => {
    const top: PipeTile = { type: 'straight', rotation: 0 };
    const bottom: PipeTile = { type: 'straight', rotation: 0 };
    // top a un connecteur "bas" (direction 2), bottom doit avoir un connecteur "haut" (direction 0)
    expect(areConnected(top, bottom, 2)).toBe(true);
  });

  test('deux tuiles non alignées ne sont pas connectées', () => {
    const top: PipeTile = { type: 'straight', rotation: 1 }; // horizontale
    const bottom: PipeTile = { type: 'straight', rotation: 0 }; // verticale
    expect(areConnected(top, bottom, 2)).toBe(false);
  });

  test('une tuile vide ne se connecte jamais à rien', () => {
    const tile: PipeTile = { type: 'cross', rotation: 0 };
    const empty: PipeTile = { type: 'empty', rotation: 0 };
    expect(areConnected(tile, empty, 1)).toBe(false);
  });
});

describe('isPathConnected', () => {
  test('un chemin simple de deux tuiles droites verticales connectées', () => {
    const grid: PipeTile[][] = [
      [{ type: 'straight', rotation: 0 }],
      [{ type: 'straight', rotation: 0 }],
    ];
    expect(isPathConnected(grid, { row: 0, col: 0 }, { row: 1, col: 0 })).toBe(true);
  });

  test('un chemin bloqué (tuiles non alignées) retourne false', () => {
    const grid: PipeTile[][] = [
      [{ type: 'straight', rotation: 1 }], // horizontale, ne connecte pas vers le bas
      [{ type: 'straight', rotation: 0 }],
    ];
    expect(isPathConnected(grid, { row: 0, col: 0 }, { row: 1, col: 0 })).toBe(false);
  });

  test('même position de départ et arrivée est toujours "connectée"', () => {
    const grid: PipeTile[][] = [[{ type: 'cross', rotation: 0 }]];
    expect(isPathConnected(grid, { row: 0, col: 0 }, { row: 0, col: 0 })).toBe(true);
  });
});

describe('PIPE_PUZZLE_EASY - validation de la grille pré-conçue', () => {
  test('un chemin résolu doit exister avec les bonnes rotations (à corriger si ce test échoue)', () => {
    // On reconstruit la grille avec les rotations qu'on PENSE être la solution,
    // pour valider notre composition manuelle avant de l'utiliser dans le jeu.
    const solvedGrid: PipeTile[][] = [
      [
        { type: 'corner', rotation: 1 }, // connecte droite-bas
        { type: 'straight', rotation: 1 }, // horizontale
        { type: 'corner', rotation: 2 }, // connecte gauche-bas
        { type: 'empty', rotation: 0 },
      ],
      [
        { type: 'empty', rotation: 0 },
        { type: 'empty', rotation: 0 },
        { type: 'straight', rotation: 0 }, // verticale
        { type: 'empty', rotation: 0 },
      ],
      [
        { type: 'empty', rotation: 0 },
        { type: 'empty', rotation: 0 },
        { type: 'straight', rotation: 0 },
        { type: 'empty', rotation: 0 },
      ],
      [
        { type: 'empty', rotation: 0 },
        { type: 'empty', rotation: 0 },
        { type: 'corner', rotation: 0 }, // connecte haut-droite... à ajuster
        { type: 'straight', rotation: 1 },
      ],
    ];

    const result = isPathConnected(solvedGrid, PIPE_PUZZLE_EASY.start, PIPE_PUZZLE_EASY.end);

    // ⚠️ Si ce test échoue, NE PAS l'ignorer : ça veut dire que la grille "solvedGrid"
    // ci-dessus doit être ajustée manuellement jusqu'à obtenir `true`.
    // C'est exactement le rôle de ce test : nous empêcher de livrer un puzzle impossible.
    expect(result).toBe(true);
  });
});

describe('calculatePipeScore', () => {
  test('score parfait avec peu de rotations et sans hint', () => {
    expect(calculatePipeScore(5, 0)).toBe(1000);
  });

  test('pénalité au-delà de 8 rotations', () => {
    expect(calculatePipeScore(12, 0)).toBe(920); // 1000 - (4*20)
  });

  test('chaque hint coûte 100 points', () => {
    expect(calculatePipeScore(5, 2)).toBe(800);
  });

  test('le score ne descend jamais sous 150', () => {
    expect(calculatePipeScore(999, 99)).toBe(150);
  });
});