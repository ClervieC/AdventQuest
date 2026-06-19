// Connecteurs dans l'ordre : [haut, droite, bas, gauche]
export type Connectors = [boolean, boolean, boolean, boolean];

export type PipeType = 'straight' | 'corner' | 'tjunction' | 'cross' | 'empty';

export interface PipeTile {
  type: PipeType;
  rotation: 0 | 1 | 2 | 3; // nombre de rotations de 90° appliquées
}

export interface Position {
  row: number;
  col: number;
}

/** Connecteurs de base (rotation 0) pour chaque type de tuile */
const BASE_CONNECTORS: Record<PipeType, Connectors> = {
  straight: [true, false, true, false],   // vertical : haut-bas
  corner: [true, true, false, false],      // haut-droite
  tjunction: [true, true, true, false],    // haut-droite-bas (pas gauche)
  cross: [true, true, true, true],
  empty: [false, false, false, false],
};

/** Applique N rotations de 90° (sens horaire) à un tableau de connecteurs */
function rotateConnectors(connectors: Connectors, rotations: number): Connectors {
  let result = [...connectors] as Connectors;
  for (let i = 0; i < rotations; i++) {
    // décalage cyclique vers la droite : [h,d,b,g] -> [g,h,d,b]
    result = [result[3], result[0], result[1], result[2]];
  }
  return result;
}

export function getConnectors(tile: PipeTile): Connectors {
  const base = BASE_CONNECTORS[tile.type];
  return rotateConnectors(base, tile.rotation);
}

/** Fait tourner une tuile de 90° supplémentaire (boucle après 3 -> 0).
 *  Les straight sont symétriques à 180° : on alterne juste entre 0 et 1. */
export function rotateTile(tile: PipeTile): PipeTile {
  if (tile.type === 'straight') {
    return { ...tile, rotation: tile.rotation === 0 ? 1 : 0 };
  }
  return { ...tile, rotation: ((tile.rotation + 1) % 4) as 0 | 1 | 2 | 3 };
}

/**
 * Vérifie si deux tuiles adjacentes sont connectées dans une direction donnée.
 * direction : direction depuis `from` vers `to` (0=haut, 1=droite, 2=bas, 3=gauche)
 */
export function areConnected(fromTile: PipeTile, toTile: PipeTile, direction: 0 | 1 | 2 | 3): boolean {
  const fromConnectors = getConnectors(fromTile);
  const toConnectors = getConnectors(toTile);
  const oppositeDirection = ((direction + 2) % 4) as 0 | 1 | 2 | 3;
  return fromConnectors[direction] && toConnectors[oppositeDirection];
}

/** Décale une position d'une case dans la direction donnée */
function moveInDirection(pos: Position, direction: 0 | 1 | 2 | 3): Position {
  switch (direction) {
    case 0: return { row: pos.row - 1, col: pos.col }; // haut
    case 1: return { row: pos.row, col: pos.col + 1 }; // droite
    case 2: return { row: pos.row + 1, col: pos.col }; // bas
    case 3: return { row: pos.row, col: pos.col - 1 }; // gauche
  }
}

/**
 * Vérifie si un chemin connecté existe entre `start` et `end` via BFS,
 * en suivant uniquement les connexions valides entre tuiles adjacentes.
 */
export function isPathConnected(
  grid: PipeTile[][],
  start: Position,
  end: Position
): boolean {
  const rows = grid.length;
  const cols = grid[0].length;
  const visited = new Set<string>();
  const queue: Position[] = [start];
  visited.add(`${start.row},${start.col}`);

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.row === end.row && current.col === end.col) {
      return true;
    }

    for (let direction = 0 as 0 | 1 | 2 | 3; direction <= 3; direction++) {
      const next = moveInDirection(current, direction);
      if (next.row < 0 || next.row >= rows || next.col < 0 || next.col >= cols) continue;

      const key = `${next.row},${next.col}`;
      if (visited.has(key)) continue;

      const currentTile = grid[current.row][current.col];
      const nextTile = grid[next.row][next.col];

      if (areConnected(currentTile, nextTile, direction)) {
        visited.add(key);
        queue.push(next);
      }
    }
  }

  return false;
}

export function calculatePipeScore(rotationsCount: number, hintsUsed: number): number {
  const baseScore = 1000;
  const rotationPenalty = Math.max(0, rotationsCount - 8) * 20; // au-delà de 8 rotations, pénalité
  const hintPenalty = hintsUsed * 100;
  return Math.max(baseScore - rotationPenalty - hintPenalty, 150);
}