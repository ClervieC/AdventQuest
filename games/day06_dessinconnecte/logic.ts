export interface Point {
  id: number;       // ordre attendu (1, 2, 3, ...)
  x: number;         // position relative 0-100 (pourcentage de la zone de dessin)
  y: number;
}

export interface Drawing {
  name: string;
  points: Point[];   // déjà triés par id croissant
}

/**
 * Vérifie si toucher le point `attemptedId` est valide compte tenu
 * du dernier point déjà validé (`lastValidatedId`).
 * Le tout premier point valide a `lastValidatedId = 0`.
 */
export function isNextValidPoint(lastValidatedId: number, attemptedId: number): boolean {
  return attemptedId === lastValidatedId + 1;
}

/** Le dessin est-il terminé (tous les points validés) ? */
export function isDrawingComplete(lastValidatedId: number, totalPoints: number): boolean {
  return lastValidatedId >= totalPoints;
}

/**
 * Détecte si une position (x, y) touchée est suffisamment proche d'un point donné.
 * `tolerance` est exprimée dans la même unité que les coordonnées (0-100).
 */
export function isNearPoint(touchX: number, touchY: number, point: Point, tolerance: number = 6): boolean {
  const distance = Math.sqrt((touchX - point.x) ** 2 + (touchY - point.y) ** 2);
  return distance <= tolerance;
}

/** Trouve le point le plus proche d'une position touchée, parmi une liste de points, s'il y en a un dans la tolérance */
export function findNearestPoint(touchX: number, touchY: number, points: Point[], tolerance: number = 6): Point | null {
  let nearest: Point | null = null;
  let nearestDistance = Infinity;

  for (const point of points) {
    const distance = Math.sqrt((touchX - point.x) ** 2 + (touchY - point.y) ** 2);
    if (distance <= tolerance && distance < nearestDistance) {
      nearest = point;
      nearestDistance = distance;
    }
  }

  return nearest;
}

/** Calcule le score selon le temps pris et les erreurs commises (tentatives sur le mauvais point) */
export function calculateDrawingScore(timeSpentSeconds: number, wrongAttempts: number): number {
  const baseScore = 800;
  const timePenalty = Math.min(timeSpentSeconds * 5, 300);
  const errorPenalty = wrongAttempts * 30;
  return Math.max(baseScore - timePenalty - errorPenalty, 100);
}