/// <reference types="jest" />
import { calculatePuzzleScore, isSolved, moveTile, neighbors, scramble, solve, SOLVED } from './logic';

describe('Taquin', () => {
  test('seules les pièces voisines de la case vide bougent', () => {
    expect(neighbors(8).sort()).toEqual([5, 7]);
    expect(moveTile(SOLVED, 7)).toEqual([1, 2, 3, 4, 5, 6, 7, 0, 8]);
    expect(moveTile(SOLVED, 0)).toBeNull();
  });

  test('un mélange n’est jamais déjà résolu et se résout en rejouant la solution', () => {
    for (let i = 0; i < 5; i++) {
      let puzzle = scramble();
      expect(isSolved(puzzle)).toBe(false);
      const path = solve(puzzle);
      expect(path.length).toBeGreaterThanOrEqual(12);
      path.forEach((tile) => {
        puzzle = moveTile(puzzle, tile)!;
        expect(puzzle).not.toBeNull();
      });
      expect(isSolved(puzzle)).toBe(true);
    }
  });

  test('la solution est la plus courte', () => {
    // Deux coups depuis la position résolue
    const twoAway = moveTile(moveTile(SOLVED, 7)!, 6)!;
    expect(solve(twoAway)).toHaveLength(2);
    expect(solve(SOLVED)).toEqual([]);
  });

  test('score', () => {
    expect(calculatePuzzleScore(20, 20, 0)).toBe(1000);
    expect(calculatePuzzleScore(30, 20, 10)).toBe(1000);
    expect(calculatePuzzleScore(999, 20, 0)).toBe(100);
  });
});
