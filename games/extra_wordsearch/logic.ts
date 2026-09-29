// Mots mêlés de Noël : des mots cachés dans une grille de lettres, en ligne droite.
// On sélectionne un mot en glissant de sa première à sa dernière lettre.

export interface Cell {
  row: number;
  col: number;
}

export interface PlacedWord {
  word: string;
  cells: Cell[];
}

export interface WordSearch {
  size: number;
  grid: string[][];
  words: PlacedWord[];
}

export interface WordSearchSettings {
  size: number;
  wordCount: number;
  backwards: boolean; // mots aussi à l'envers (droite→gauche, bas→haut...)
  timeLimitSeconds: number;
}

export const WORDSEARCH_SETTINGS: Record<string, WordSearchSettings> = {
  easy: { size: 8, wordCount: 5, backwards: false, timeLimitSeconds: 180 },
  medium: { size: 9, wordCount: 6, backwards: false, timeLimitSeconds: 170 },
  hard: { size: 10, wordCount: 7, backwards: true, timeLimitSeconds: 170 },
  very_hard: { size: 10, wordCount: 7, backwards: true, timeLimitSeconds: 160 },
};

// Sans accents : les lettres de la grille sont en majuscules simples
export const WORDS = {
  fr: ['NOEL', 'SAPIN', 'RENNE', 'LUTIN', 'NEIGE', 'ETOILE', 'CADEAU', 'BOUGIE', 'HIVER', 'TRAINEAU', 'CLOCHE', 'FLOCON', 'BUCHE', 'JOUET', 'GIVRE'],
  en: ['SANTA', 'SLEIGH', 'REINDEER', 'SNOW', 'ELF', 'GIFT', 'STAR', 'CANDLE', 'HOLLY', 'WINTER', 'BELL', 'TREE', 'COOKIE', 'STOCKING', 'FROST'],
};

const FORWARD: [number, number][] = [[0, 1], [1, 0], [1, 1], [-1, 1]];
const BACKWARD: [number, number][] = [[0, -1], [-1, 0], [-1, -1], [1, -1]];
const ALPHABET = 'ABCDEFGHIJKLMNOPRSTUVE'; // lettres de remplissage (E doublé : plus naturel)

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Crée une grille : `wordCount` mots de la liste, placés au hasard (ils peuvent partager une lettre commune) */
export function createWordSearch(
  words: string[],
  settings: Pick<WordSearchSettings, 'size' | 'wordCount' | 'backwards'>,
  random: () => number = Math.random
): WordSearch {
  const { size, wordCount, backwards } = settings;
  const directions = backwards ? [...FORWARD, ...BACKWARD] : FORWARD;
  const candidates = shuffle(words.filter((w) => w.length <= size), random);

  for (let attempt = 0; attempt < 50; attempt++) {
    const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(''));
    const placed: PlacedWord[] = [];
    for (const word of candidates) {
      if (placed.length >= wordCount) break;
      const cells = tryPlace(grid, word, directions, random);
      if (cells) placed.push({ word, cells });
    }
    if (placed.length < wordCount) continue;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!grid[r][c]) grid[r][c] = ALPHABET[Math.floor(random() * ALPHABET.length)];
      }
    }
    return { size, grid, words: placed };
  }
  throw new Error('Impossible de placer les mots');
}

function tryPlace(grid: string[][], word: string, directions: [number, number][], random: () => number): Cell[] | null {
  const size = grid.length;
  for (let attempt = 0; attempt < 200; attempt++) {
    const [dr, dc] = directions[Math.floor(random() * directions.length)];
    const row = Math.floor(random() * size);
    const col = Math.floor(random() * size);
    const cells: Cell[] = [];
    let ok = true;
    for (let i = 0; i < word.length; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (r < 0 || r >= size || c < 0 || c >= size || (grid[r][c] && grid[r][c] !== word[i])) {
        ok = false;
        break;
      }
      cells.push({ row: r, col: c });
    }
    if (!ok) continue;
    cells.forEach((cell, i) => (grid[cell.row][cell.col] = word[i]));
    return cells;
  }
  return null;
}

/** Cases d'une ligne droite (horizontale, verticale ou diagonale) entre deux cases ; null si pas en ligne droite */
export function lineCells(start: Cell, end: Cell): Cell[] | null {
  const dr = Math.sign(end.row - start.row);
  const dc = Math.sign(end.col - start.col);
  const lengthR = Math.abs(end.row - start.row);
  const lengthC = Math.abs(end.col - start.col);
  if (lengthR !== 0 && lengthC !== 0 && lengthR !== lengthC) return null;
  const steps = Math.max(lengthR, lengthC);
  return Array.from({ length: steps + 1 }, (_, i) => ({ row: start.row + dr * i, col: start.col + dc * i }));
}

const sameCells = (a: Cell[], b: Cell[]) => a.length === b.length && a.every((cell, i) => cell.row === b[i].row && cell.col === b[i].col);

/** Le mot sélectionné (dans un sens ou dans l'autre), ou null */
export function findSelectedWord(puzzle: WordSearch, start: Cell, end: Cell): PlacedWord | null {
  const cells = lineCells(start, end);
  if (!cells) return null;
  const reversed = [...cells].reverse();
  return puzzle.words.find((w) => sameCells(w.cells, cells) || sameCells(w.cells, reversed)) ?? null;
}

/** Score : 100 par mot + 5 par seconde restante */
export function calculateWordSearchScore(wordsFound: number, secondsLeft: number): number {
  return wordsFound * 100 + secondsLeft * 5;
}
