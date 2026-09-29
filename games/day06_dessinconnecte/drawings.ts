import { Drawing } from './logic';

// Dessins d'une vingtaine de points, tracés d'un seul trait (l'ancienne étoile à 10 points était trop simple).
// Deux points sont toujours à au moins 7 unités l'un de l'autre, pour que leurs numéros restent lisibles.

/** Sapin à 5 étages + tronc : on descend le côté droit en zigzag, puis on remonte le côté gauche */
export const DRAWING_TREE: Drawing = {
  name: 'Sapin de Noël',
  nameEn: 'Christmas tree',
  points: [
    { id:  1, x: 50, y: 5 },  // cime
    { id:  2, x: 62, y: 20 },
    { id:  3, x: 55, y: 20 },
    { id:  4, x: 70, y: 36 },
    { id:  5, x: 61, y: 36 },
    { id:  6, x: 78, y: 52 },
    { id:  7, x: 67, y: 52 },
    { id:  8, x: 86, y: 68 },
    { id:  9, x: 73, y: 68 },
    { id: 10, x: 92, y: 84 },
    { id: 11, x: 58, y: 84 }, // tronc
    { id: 12, x: 58, y: 96 },
    { id: 13, x: 42, y: 96 },
    { id: 14, x: 42, y: 84 },
    { id: 15, x: 8, y: 84 },
    { id: 16, x: 27, y: 68 },
    { id: 17, x: 14, y: 68 },
    { id: 18, x: 33, y: 52 },
    { id: 19, x: 22, y: 52 },
    { id: 20, x: 39, y: 36 },
    { id: 21, x: 30, y: 36 },
    { id: 22, x: 45, y: 20 },
    { id: 23, x: 38, y: 20 },
  ],
};

/** Bonhomme de neige avec ses bras en branches : tête, bras droit, gros ventre, bras gauche, retour à la tête */
export const DRAWING_SNOWMAN: Drawing = {
  name: 'Bonhomme de neige',
  nameEn: 'Snowman',
  points: [
    { id:  1, x: 50, y: 8 },  // haut de la tête
    { id:  2, x: 59, y: 11 },
    { id:  3, x: 64, y: 19 },
    { id:  4, x: 64, y: 29 },
    { id:  5, x: 58, y: 36 }, // cou
    { id:  6, x: 62, y: 42 },
    { id:  7, x: 72, y: 53 },
    { id:  8, x: 92, y: 32 }, // main droite
    { id:  9, x: 74, y: 63 },
    { id: 10, x: 72, y: 73 },
    { id: 11, x: 65, y: 82 },
    { id: 12, x: 55, y: 86 },
    { id: 13, x: 45, y: 86 },
    { id: 14, x: 35, y: 82 },
    { id: 15, x: 28, y: 73 },
    { id: 16, x: 26, y: 63 },
    { id: 17, x: 8, y: 32 },  // main gauche
    { id: 18, x: 28, y: 53 },
    { id: 19, x: 38, y: 42 },
    { id: 20, x: 42, y: 36 }, // cou
    { id: 21, x: 35, y: 23 },
    { id: 22, x: 42, y: 10 },
  ],
};

export const ALL_DRAWINGS: Drawing[] = [DRAWING_TREE, DRAWING_SNOWMAN];

export function getRandomDrawing(): Drawing {
  return ALL_DRAWINGS[Math.floor(Math.random() * ALL_DRAWINGS.length)];
}
