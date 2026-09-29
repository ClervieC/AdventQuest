// Taquin 3×3 : 8 pièces d'une image de Noël et une case vide ; on fait glisser les pièces voisines de la case vide.
// Plateau = tableau de 9 cases lues ligne par ligne : 1..8 = pièces à leur place une fois résolu, 0 = case vide.

export type Puzzle = number[];

export const N = 3;
export const SOLVED: Puzzle = [1, 2, 3, 4, 5, 6, 7, 8, 0];

export function isSolved(puzzle: Puzzle): boolean {
  return puzzle.every((v, i) => v === SOLVED[i]);
}

/** Cases voisines (haut, bas, gauche, droite) d'un index */
export function neighbors(index: number): number[] {
  const row = Math.floor(index / N);
  const col = index % N;
  const result: number[] = [];
  if (row > 0) result.push(index - N);
  if (row < N - 1) result.push(index + N);
  if (col > 0) result.push(index - 1);
  if (col < N - 1) result.push(index + 1);
  return result;
}

/** Fait glisser la pièce à cet index dans la case vide, si elles sont voisines (sinon null) */
export function moveTile(puzzle: Puzzle, index: number): Puzzle | null {
  const empty = puzzle.indexOf(0);
  if (!neighbors(empty).includes(index)) return null;
  const next = [...puzzle];
  [next[empty], next[index]] = [next[index], next[empty]];
  return next;
}

/** Mélange par une suite de vrais coups depuis la position résolue : le taquin est donc toujours faisable */
export function scramble(moves = 80, random: () => number = Math.random): Puzzle {
  for (;;) {
    let puzzle = [...SOLVED];
    let previousEmpty = -1;
    for (let i = 0; i < moves; i++) {
      const empty = puzzle.indexOf(0);
      const options = neighbors(empty).filter((n) => n !== previousEmpty); // pas d'aller-retour immédiat
      const pick = options[Math.floor(random() * options.length)];
      previousEmpty = empty;
      puzzle = moveTile(puzzle, pick)!;
    }
    if (solutionLength(puzzle) >= 12) return puzzle; // assez mélangé
  }
}

function manhattan(puzzle: Puzzle): number {
  let total = 0;
  puzzle.forEach((v, i) => {
    if (v === 0) return;
    const target = v - 1;
    total += Math.abs(Math.floor(i / N) - Math.floor(target / N)) + Math.abs((i % N) - (target % N));
  });
  return total;
}

/** Plus courte solution (A*, distance de Manhattan) : liste des index de pièces à déplacer, dans l'ordre */
export function solve(start: Puzzle): number[] {
  if (isSolved(start)) return [];
  const key = (p: Puzzle) => p.join('');
  const open: { puzzle: Puzzle; g: number; f: number }[] = [{ puzzle: start, g: 0, f: manhattan(start) }];
  const cameFrom = new Map<string, { prev: string; tile: number }>();
  const best = new Map<string, number>([[key(start), 0]]);

  while (open.length > 0) {
    // File de priorité simple : l'espace des états 3×3 est petit
    let bestIndex = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[bestIndex].f) bestIndex = i;
    const { puzzle, g } = open.splice(bestIndex, 1)[0];
    const k = key(puzzle);
    if (isSolved(puzzle)) {
      const path: number[] = [];
      let current = k;
      while (cameFrom.has(current)) {
        const step = cameFrom.get(current)!;
        path.unshift(step.tile);
        current = step.prev;
      }
      return path;
    }
    if (g > (best.get(k) ?? Infinity)) continue;
    const empty = puzzle.indexOf(0);
    for (const tile of neighbors(empty)) {
      const next = moveTile(puzzle, tile)!;
      const nk = key(next);
      const ng = g + 1;
      if (ng >= (best.get(nk) ?? Infinity)) continue;
      best.set(nk, ng);
      // La pièce déplacée se retrouve à l'ancienne place du vide : on retient l'index cliqué dans `puzzle`
      cameFrom.set(nk, { prev: k, tile });
      open.push({ puzzle: next, g: ng, f: ng + manhattan(next) });
    }
  }
  return [];
}

export function solutionLength(puzzle: Puzzle): number {
  return solve(puzzle).length;
}

/** Score : 1000, −5 par coup au-delà du minimum, +5 par seconde restante (au moins 100) */
export function calculatePuzzleScore(moves: number, optimalMoves: number, secondsLeft: number): number {
  return Math.max(100, 1000 - Math.max(0, moves - optimalMoves) * 5 + secondsLeft * 5);
}
