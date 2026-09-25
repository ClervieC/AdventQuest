// Cherche des donnes de Solitaire qui ont une solution (vérifiée par le solveur) et les enregistre.
// Le jeu tire ensuite une donne dans cette liste : chaque partie a forcément une solution.
// Usage : npm run generate:solitaire
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createDeck, createSeededRandom, dealNewGame, shuffleDeck } from '../games/day11_solitaire/logic';
import { solve } from '../games/day11_solitaire/solver';

const TARGET = 300;
const MAX_NODES = 150000;
const seeds: number[] = [];
let tried = 0;
const started = Date.now();

for (let seed = 1; seeds.length < TARGET; seed++) {
  tried++;
  const game = dealNewGame(shuffleDeck(createDeck(), createSeededRandom(seed)));
  if (solve(game, MAX_NODES).solved) seeds.push(seed);
}

const seconds = ((Date.now() - started) / 1000).toFixed(1);
const file = `// Généré par scripts/find-solitaire-seeds.ts (npm run generate:solitaire) — ne pas modifier à la main.
// Graines de donnes dont le solveur a trouvé une solution : ${seeds.length} sur ${tried} essayées (${Math.round((seeds.length / tried) * 100)} %).
export const SOLVABLE_SEEDS: number[] = [
${seeds.map((s) => '  ' + s + ',').join('\n')}
];
`;
writeFileSync(join(__dirname, '..', 'games', 'day11_solitaire', 'solvableSeeds.ts'), file);
console.log(`${seeds.length} donnes avec solution sur ${tried} essayées (${Math.round((seeds.length / tried) * 100)} %), en ${seconds} s`);
