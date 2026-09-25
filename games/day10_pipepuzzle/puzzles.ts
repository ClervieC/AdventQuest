import { getConnectors, isPathConnected, PipeTile, Position } from './logic';

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
// ---------- Génération aléatoire (une grille différente à chaque partie) ----------

type Dir = 0 | 1 | 2 | 3; // haut, droite, bas, gauche
const DELTAS: Record<Dir, [number, number]> = { 0: [-1, 0], 1: [0, 1], 2: [1, 0], 3: [0, -1] };
const opposite = (d: Dir) => ((d + 2) % 4) as Dir;

export interface GeneratedPipePuzzle extends PipePuzzle {
  solution: PipeTile[][]; // rotations qui connectent le chemin (utilisées par l'indice)
  path: Position[];
}

export const PIPE_SIZE_BY_DIFFICULTY = { easy: 5, medium: 6, hard: 7, very_hard: 7 } as const;

/** Rotation (0-3) pour laquelle la tuile ouvre au moins toutes les directions demandées */
function rotationFor(type: PipeTile['type'], required: Dir[]): PipeTile['rotation'] {
  for (const rotation of [0, 1, 2, 3] as const) {
    const connectors = getConnectors({ type, rotation });
    if (required.every((d) => connectors[d])) return type === 'straight' ? ((rotation % 2) as 0 | 1) : rotation;
  }
  throw new Error(`aucune rotation de ${type} pour ${required}`);
}

/** Chemin sinueux de (0,0) à (n-1,n-1) : parcours aléatoire en profondeur, en gardant les chemins assez longs */
function randomPath(size: number, random: () => number): Position[] {
  const minLength = Math.floor(size * size * 0.45);
  let best: Position[] = [];
  for (let attempt = 0; attempt < 60; attempt++) {
    const visited = new Set<string>(['0,0']);
    const path: Position[] = [{ row: 0, col: 0 }];
    const walk = (): boolean => {
      const cur = path[path.length - 1];
      if (cur.row === size - 1 && cur.col === size - 1) return true;
      const dirs = ([0, 1, 2, 3] as Dir[]).sort(() => random() - 0.5);
      for (const d of dirs) {
        const next = { row: cur.row + DELTAS[d][0], col: cur.col + DELTAS[d][1] };
        const key = `${next.row},${next.col}`;
        if (next.row < 0 || next.col < 0 || next.row >= size || next.col >= size || visited.has(key)) continue;
        visited.add(key);
        path.push(next);
        if (walk()) return true;
        path.pop();
      }
      return false;
    };
    walk();
    if (path.length > best.length) best = path.slice();
    if (best.length >= minLength) break;
  }
  return best;
}

const dirBetween = (from: Position, to: Position): Dir =>
  to.row < from.row ? 0 : to.col > from.col ? 1 : to.row > from.row ? 2 : 3;

/**
 * Génère une grille n×n : un chemin sinueux (tuyaux droits et coudes) + des tuyaux leurres, rotations mélangées.
 * Une solution existe toujours (le chemin), et la grille de départ n'est jamais déjà résolue.
 */
export function generatePipePuzzle(size: number, random: () => number = Math.random): GeneratedPipePuzzle {
  const path = randomPath(size, random);
  const onPath = new Map(path.map((p, i) => [`${p.row},${p.col}`, i]));
  const solution: PipeTile[][] = [];

  for (let row = 0; row < size; row++) {
    const line: PipeTile[] = [];
    for (let col = 0; col < size; col++) {
      const index = onPath.get(`${row},${col}`);
      if (index === undefined) {
        // Leurre : ~60 % des cases hors chemin ont un tuyau qui ne mène nulle part
        const r = random();
        const type: PipeTile['type'] = r < 0.4 ? 'empty' : r < 0.65 ? 'straight' : r < 0.9 ? 'corner' : 'tjunction';
        line.push({ type, rotation: 0 });
        continue;
      }
      const here = path[index];
      const dirs: Dir[] = [];
      if (index > 0) dirs.push(dirBetween(here, path[index - 1]));
      if (index < path.length - 1) dirs.push(dirBetween(here, path[index + 1]));
      // Départ / arrivée : un seul voisin sur le chemin, on prend un tuyau droit dans cet axe
      const type: PipeTile['type'] = dirs.length === 2 && dirs[0] !== opposite(dirs[1]) ? 'corner' : 'straight';
      line.push({ type, rotation: rotationFor(type, dirs) });
    }
    solution.push(line);
  }

  const start = path[0];
  const end = path[path.length - 1];
  const scramble = (): PipeTile[][] =>
    solution.map((line) =>
      line.map((tile) => {
        if (tile.type === 'empty') return { ...tile };
        const max = tile.type === 'straight' ? 2 : 4;
        return { ...tile, rotation: Math.floor(random() * max) as PipeTile['rotation'] };
      })
    );
  let grid = scramble();
  for (let i = 0; i < 20 && isPathConnected(grid, start, end); i++) grid = scramble();

  return { gridSize: size, start, end, grid, solution, path };
}
