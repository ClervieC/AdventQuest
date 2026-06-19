import { NonogramPuzzle } from './logic';

const F = true;
const _ = false;

/** Flocon de neige simple, 5x5 */
export const NONOGRAM_SNOWFLAKE: NonogramPuzzle = {
  name: 'Flocon de neige',
  size: 5,
  solution: [
    [_, F, _, F, _],
    [F, F, F, F, F],
    [_, F, F, F, _],
    [F, F, F, F, F],
    [_, F, _, F, _],
  ],
};

/** Étoile simple, 5x5 */
export const NONOGRAM_STAR: NonogramPuzzle = {
  name: 'Étoile magique',
  size: 5,
  solution: [
    [_, _, F, _, _],
    [_, F, F, F, _],
    [F, F, F, F, F],
    [_, F, _, F, _],
    [F, _, _, _, F],
  ],
};

/** Sapin simple, 7x7 (pour la version plus difficile du jour 23) */
export const NONOGRAM_TREE: NonogramPuzzle = {
  name: 'Sapin de Noël',
  size: 7,
  solution: [
    [_, _, _, F, _, _, _],
    [_, _, F, F, F, _, _],
    [_, _, _, F, _, _, _],
    [_, F, F, F, F, F, _],
    [_, _, _, F, _, _, _],
    [F, F, F, F, F, F, F],
    [_, _, F, F, F, _, _],
  ],
};

export const NONOGRAM_PUZZLES_EASY: NonogramPuzzle[] = [NONOGRAM_SNOWFLAKE, NONOGRAM_STAR];
export const NONOGRAM_PUZZLES_HARD: NonogramPuzzle[] = [NONOGRAM_TREE];

export function getRandomNonogram(difficulty: 'easy' | 'hard' = 'easy'): NonogramPuzzle {
  const pool = difficulty === 'hard' ? NONOGRAM_PUZZLES_HARD : NONOGRAM_PUZZLES_EASY;
  return pool[Math.floor(Math.random() * pool.length)];
}