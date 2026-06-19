import { Drawing } from './logic';

/** Étoile à 5 branches — 10 points alternant pointes et creux dans l'ordre de tracé */
export const DRAWING_STAR: Drawing = {
  name: 'Étoile magique',
  points: [
    { id:  1, x: 50, y: 10 }, // pointe haut
    { id:  2, x: 60, y: 36 }, // creux haut-droite
    { id:  3, x: 88, y: 38 }, // pointe droite-haut
    { id:  4, x: 66, y: 55 }, // creux droite-bas
    { id:  5, x: 74, y: 82 }, // pointe droite-bas
    { id:  6, x: 50, y: 67 }, // creux bas
    { id:  7, x: 26, y: 82 }, // pointe gauche-bas
    { id:  8, x: 34, y: 55 }, // creux gauche-bas
    { id:  9, x: 12, y: 38 }, // pointe gauche-haut
    { id: 10, x: 40, y: 36 }, // creux haut-gauche
  ],
};

export const ALL_DRAWINGS: Drawing[] = [DRAWING_STAR];

export function getRandomDrawing(): Drawing {
  return ALL_DRAWINGS[Math.floor(Math.random() * ALL_DRAWINGS.length)];
}