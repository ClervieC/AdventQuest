/// <reference types="jest" />
import { createWordSearch, findSelectedWord, lineCells, WORDS, WORDSEARCH_SETTINGS } from './logic';

describe('Mots mêlés - grille', () => {
  test.each(Object.entries(WORDSEARCH_SETTINGS))('%s : chaque mot se lit dans la grille, toutes les cases sont remplies', (_, settings) => {
    for (const lang of ['fr', 'en'] as const) {
      const puzzle = createWordSearch(WORDS[lang], settings);
      expect(puzzle.words).toHaveLength(settings.wordCount);
      expect(new Set(puzzle.words.map((w) => w.word)).size).toBe(settings.wordCount);
      puzzle.words.forEach(({ word, cells }) => {
        expect(cells.map((c) => puzzle.grid[c.row][c.col]).join('')).toBe(word);
      });
      puzzle.grid.flat().forEach((letter) => expect(letter).toMatch(/^[A-Z]$/));
    }
  });

  test('tous les mots tiennent dans la plus petite grille et sont en majuscules sans accent', () => {
    [...WORDS.fr, ...WORDS.en].forEach((w) => {
      expect(w).toMatch(/^[A-Z]+$/);
      expect(w.length).toBeLessThanOrEqual(8);
    });
  });
});

describe('Mots mêlés - sélection', () => {
  test('ligne droite ou diagonale seulement', () => {
    expect(lineCells({ row: 0, col: 0 }, { row: 0, col: 3 })).toHaveLength(4);
    expect(lineCells({ row: 3, col: 3 }, { row: 0, col: 0 })).toHaveLength(4);
    expect(lineCells({ row: 0, col: 0 }, { row: 1, col: 3 })).toBeNull();
  });

  test('un mot se trouve dans les deux sens de sélection', () => {
    const puzzle = createWordSearch(WORDS.fr, WORDSEARCH_SETTINGS.easy);
    const { cells, word } = puzzle.words[0];
    expect(findSelectedWord(puzzle, cells[0], cells[cells.length - 1])?.word).toBe(word);
    expect(findSelectedWord(puzzle, cells[cells.length - 1], cells[0])?.word).toBe(word);
    expect(findSelectedWord(puzzle, cells[0], cells[cells.length - 2])).toBeNull();
  });
});
