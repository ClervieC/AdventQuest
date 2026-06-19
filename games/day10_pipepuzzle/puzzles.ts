import { PipeTile, Position } from './logic';

export interface PipePuzzle {
  grid: PipeTile[][];    // état de départ, avec rotations aléatoires (le puzzle à résoudre)
  start: Position;
  end: Position;
  gridSize: number;
}

/**
 * Puzzle 4x4 — chemin en Γ : (0,0)→(0,1)→(0,2)→(0,3)→(1,3)→(2,3)→(3,3)
 *
 * Solution (rotations cibles) :
 *   (0,0) corner rot 1  → droite + bas
 *   (0,1) straight rot 1 → gauche + droite
 *   (0,2) straight rot 1 → gauche + droite
 *   (0,3) corner rot 2  → bas + gauche
 *   (1,3) straight rot 0 → haut + bas
 *   (2,3) straight rot 0 → haut + bas
 *   (3,3) corner rot 0  → haut + droite (droite hors grille, cul-de-sac acceptable)
 *
 * État de départ : toutes les rotations sont mélangées.
 */
export const PIPE_PUZZLE_EASY: PipePuzzle = {
  gridSize: 4,
  start: { row: 0, col: 0 },
  end: { row: 3, col: 3 },
  grid: [
    [
      { type: 'corner',   rotation: 2 }, // (0,0) — mélangé, solution : rot 1
      { type: 'straight', rotation: 0 }, // (0,1) — mélangé, solution : rot 1
      { type: 'straight', rotation: 0 }, // (0,2) — mélangé, solution : rot 1
      { type: 'corner',   rotation: 0 }, // (0,3) — mélangé, solution : rot 2
    ],
    [
      { type: 'empty', rotation: 0 },
      { type: 'empty', rotation: 0 },
      { type: 'empty', rotation: 0 },
      { type: 'straight', rotation: 1 }, // (1,3) — mélangé, solution : rot 0
    ],
    [
      { type: 'empty', rotation: 0 },
      { type: 'empty', rotation: 0 },
      { type: 'empty', rotation: 0 },
      { type: 'straight', rotation: 1 }, // (2,3) — mélangé, solution : rot 0
    ],
    [
      { type: 'empty', rotation: 0 },
      { type: 'empty', rotation: 0 },
      { type: 'empty', rotation: 0 },
      { type: 'corner',   rotation: 2 }, // (3,3) — mélangé, solution : rot 0
    ],
  ],
};