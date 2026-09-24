/// <reference types="jest" />
import { calculateColumnHints, calculateLineHints, calculateRowHints, NonogramPuzzle } from './logic';
import { NONOGRAM_PUZZLES_EASY, NONOGRAM_PUZZLES_HARD, NONOGRAM_TREE } from './puzzles';

// Toutes les lignes possibles de longueur `size` qui respectent les indices donnés
function linePlacements(hints: number[], size: number): boolean[][] {
  const results: boolean[][] = [];
  const target = JSON.stringify(hints);
  for (let mask = 0; mask < 1 << size; mask++) {
    const line = Array.from({ length: size }, (_, i) => ((mask >> i) & 1) === 1);
    if (JSON.stringify(calculateLineHints(line)) === target) results.push(line);
  }
  return results;
}

// Compte les grilles qui respectent tous les indices (on s'arrête à 2 : "plus d'une")
function countSolutions(puzzle: NonogramPuzzle): number {
  const rowHints = calculateRowHints(puzzle.solution);
  const colHints = JSON.stringify(calculateColumnHints(puzzle.solution));
  const options = rowHints.map((hints) => linePlacements(hints, puzzle.size));
  let count = 0;
  const rows: boolean[][] = [];
  const search = (r: number) => {
    if (count > 1) return;
    if (r === puzzle.size) {
      if (JSON.stringify(calculateColumnHints(rows)) === colHints) count++;
      return;
    }
    for (const line of options[r]) {
      rows.push(line);
      search(r + 1);
      rows.pop();
    }
  };
  search(0);
  return count;
}

describe('Nonogram - dessins', () => {
  test('le sapin de Noël a les bons indices (étoile, 3 étages, tronc)', () => {
    expect(calculateRowHints(NONOGRAM_TREE.solution)).toEqual([[1], [3], [5], [3], [5], [7], [1]]);
    expect(calculateColumnHints(NONOGRAM_TREE.solution)).toEqual([[1], [1, 2], [5], [7], [5], [1, 2], [1]]);
  });

  test.each([...NONOGRAM_PUZZLES_EASY, ...NONOGRAM_PUZZLES_HARD].map((p) => [p.name, p] as const))(
    '« %s » est une grille carrée avec une seule solution',
    (_name, puzzle) => {
      expect(puzzle.solution).toHaveLength(puzzle.size);
      puzzle.solution.forEach((row) => expect(row).toHaveLength(puzzle.size));
      expect(countSolutions(puzzle)).toBe(1);
    }
  );
});
