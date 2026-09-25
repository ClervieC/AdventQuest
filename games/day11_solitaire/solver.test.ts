/// <reference types="jest" />
import { applyMove, createDeck, createSeededRandom, dealNewGame, drawFromStock, GameState, isGameWon, MoveSource, MoveTarget, shuffleDeck } from './logic';
import { SOLVABLE_SEEDS } from './solvableSeeds';
import { solve, SolverMove } from './solver';

const dealSeed = (seed: number) => dealNewGame(shuffleDeck(createDeck(), createSeededRandom(seed)));

/**
 * Rejoue une solution du solveur avec les VRAIES règles du jeu (pioche carte par carte, applyMove...).
 * Si le solveur trichait sur les règles, la partie ne serait pas gagnée à la fin.
 */
function replay(initial: GameState, moves: SolverMove[]): GameState {
  let state = initial;
  for (const move of moves) {
    let source: MoveSource;
    if (move.from === 'talon') {
      // Piocher jusqu'à ce que la carte voulue soit sur la défausse (au plus 2 tours complets)
      const maxDraws = (state.stock.length + state.waste.length + 1) * 2;
      for (let i = 0; i < maxDraws && state.waste[state.waste.length - 1]?.id !== move.cardId; i++) {
        state = drawFromStock(state);
      }
      if (state.waste[state.waste.length - 1]?.id !== move.cardId) throw new Error(`carte ${move.cardId} introuvable dans la pioche`);
      source = { type: 'waste' };
    } else {
      source = { type: 'column', columnIndex: move.column, cardIndex: move.cardIndex };
    }
    const target: MoveTarget = move.to.type === 'foundation' ? { type: 'foundation', index: move.to.index } : { type: 'column', index: move.to.index };
    const next = applyMove(state, source, target);
    if (!next) throw new Error(`coup refusé par le jeu : ${JSON.stringify(move)}`);
    state = next;
  }
  return state;
}

describe('Solitaire - donnes à graine', () => {
  test('une même graine donne toujours la même donne', () => {
    expect(JSON.stringify(dealSeed(42))).toBe(JSON.stringify(dealSeed(42)));
    expect(JSON.stringify(dealSeed(42))).not.toBe(JSON.stringify(dealSeed(43)));
  });

  test('une donne à graine contient bien les 52 cartes', () => {
    const game = dealSeed(7);
    const ids = [...game.columns.flat(), ...game.stock].map((c) => c.id);
    expect(new Set(ids).size).toBe(52);
  });
});

describe('Solitaire - solveur', () => {
  test('les solutions trouvées se rejouent avec les vraies règles du jeu jusqu’à la victoire', () => {
    let solved = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const game = dealSeed(seed);
      const result = solve(game, 60000);
      if (!result.solved) continue;
      solved++;
      expect(isGameWon(replay(game, result.moves))).toBe(true);
    }
    expect(solved).toBeGreaterThanOrEqual(6); // la grande majorité des donnes ont une solution
  });

  test('une position sans issue est reconnue comme non résolue', () => {
    // Deux Rois cachés sous une Dame dans la même colonne, rien d'autre à jouer : impossible
    const deadEnd: GameState = {
      columns: [
        [
          { suit: 'hearts', rank: 13, faceUp: false, id: 'hearts-13' },
          { suit: 'spades', rank: 12, faceUp: true, id: 'spades-12' },
        ],
        [], [], [], [], [], [],
      ],
      foundations: [[], [], [], []],
      stock: [],
      waste: [],
    };
    expect(solve(deadEnd, 1000).solved).toBe(false);
  });
});

describe('Solitaire - donnes utilisées par le jeu', () => {
  test('la liste contient assez de donnes vérifiées, sans doublon', () => {
    expect(SOLVABLE_SEEDS.length).toBeGreaterThanOrEqual(100);
    expect(new Set(SOLVABLE_SEEDS).size).toBe(SOLVABLE_SEEDS.length);
  });

  test('des donnes de la liste, prises au hasard, ont bien une solution rejouable', () => {
    const sample = [0, 1, 2, Math.floor(SOLVABLE_SEEDS.length / 2), SOLVABLE_SEEDS.length - 1].map((i) => SOLVABLE_SEEDS[i]);
    for (const seed of sample) {
      const game = dealSeed(seed);
      const result = solve(game, 150000);
      expect(result.solved).toBe(true);
      expect(isGameWon(replay(game, result.moves))).toBe(true);
    }
  });
});
