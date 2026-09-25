/// <reference types="jest" />
import { isPathConnected, rotateTile } from './logic';
import { generatePipePuzzle, PIPE_SIZE_BY_DIFFICULTY } from './puzzles';

// Générateur pseudo-aléatoire reproductible pour les tests
function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('Pipe Puzzle - génération', () => {
  test.each([5, 6, 7])('grille %i×%i : 100 grilles toutes résolubles et jamais résolues au départ', (size) => {
    for (let seed = 1; seed <= 100; seed++) {
      const puzzle = generatePipePuzzle(size, seeded(seed * size));
      expect(puzzle.grid).toHaveLength(size);
      expect(isPathConnected(puzzle.solution, puzzle.start, puzzle.end)).toBe(true);
      expect(isPathConnected(puzzle.grid, puzzle.start, puzzle.end)).toBe(false);
      expect(puzzle.start).toEqual({ row: 0, col: 0 });
      expect(puzzle.end).toEqual({ row: size - 1, col: size - 1 });
    }
  });

  test('le chemin est sinueux (bien plus long que le trajet direct)', () => {
    const lengths = Array.from({ length: 30 }, (_, i) => generatePipePuzzle(6, seeded(i + 1)).path.length);
    const average = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    expect(average).toBeGreaterThan(6 * 2 - 1 + 4); // trajet direct = 11 cases
  });

  test('la solution est atteignable en tournant les tuiles (mêmes types, rotations accessibles)', () => {
    const puzzle = generatePipePuzzle(6, seeded(7));
    puzzle.grid.forEach((line, r) =>
      line.forEach((tile, c) => {
        const target = puzzle.solution[r][c];
        expect(tile.type).toBe(target.type);
        let t = tile;
        let reached = t.rotation === target.rotation;
        for (let i = 0; i < 4 && !reached; i++) {
          t = rotateTile(t);
          reached = t.rotation === target.rotation;
        }
        expect(reached).toBe(true);
      })
    );
  });

  test('la taille dépend de la difficulté', () => {
    expect(PIPE_SIZE_BY_DIFFICULTY.easy).toBeLessThan(PIPE_SIZE_BY_DIFFICULTY.hard);
  });

  test('deux parties ne donnent pas la même grille', () => {
    const a = JSON.stringify(generatePipePuzzle(6, seeded(1)).solution);
    const b = JSON.stringify(generatePipePuzzle(6, seeded(2)).solution);
    expect(a).not.toBe(b);
  });
});
