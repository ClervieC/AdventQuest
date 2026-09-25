/// <reference types="jest" />
import { applyMove, Card, findFoundationFor, findHintMove, GameState, Rank, Suit } from './logic';

const card = (suit: Suit, rank: number, faceUp = true): Card => ({ suit, rank: rank as Rank, faceUp, id: `${suit}-${rank}` });
const emptyState = (overrides: Partial<GameState> = {}): GameState => ({
  columns: [[], [], [], [], [], [], []],
  foundations: [[], [], [], []],
  stock: [],
  waste: [],
  ...overrides,
});
const cols = (...columns: Card[][]) => [...columns, ...Array(7 - columns.length).fill([])];

describe('Solitaire - applyMove', () => {
  test('déplacer une carte sur une colonne valide (couleur opposée, rang -1)', () => {
    const state = emptyState({ columns: cols([card('spades', 8)], [card('hearts', 7)]) });
    const next = applyMove(state, { type: 'column', columnIndex: 1, cardIndex: 0 }, { type: 'column', index: 0 });
    expect(next?.columns[0].map((c) => c.id)).toEqual(['spades-8', 'hearts-7']);
    expect(next?.columns[1]).toEqual([]);
  });

  test('coup interdit : même couleur → null, état inchangé', () => {
    const state = emptyState({ columns: cols([card('spades', 8)], [card('clubs', 7)]) });
    expect(applyMove(state, { type: 'column', columnIndex: 1, cardIndex: 0 }, { type: 'column', index: 0 })).toBeNull();
  });

  test('déposer sur sa propre colonne ne fait rien', () => {
    const state = emptyState({ columns: cols([card('spades', 8), card('hearts', 7)]) });
    expect(applyMove(state, { type: 'column', columnIndex: 0, cardIndex: 1 }, { type: 'column', index: 0 })).toBeNull();
  });

  test('déplacer une séquence entière et retourner la carte découverte', () => {
    const state = emptyState({
      columns: cols([card('clubs', 2, false), card('hearts', 9), card('spades', 8)], [card('clubs', 10)]),
    });
    const next = applyMove(state, { type: 'column', columnIndex: 0, cardIndex: 1 }, { type: 'column', index: 1 });
    expect(next?.columns[1].map((c) => c.id)).toEqual(['clubs-10', 'hearts-9', 'spades-8']);
    expect(next?.columns[0]).toEqual([card('clubs', 2, true)]); // la carte cachée est retournée
  });

  test('seul un Roi peut aller sur une colonne vide', () => {
    const state = emptyState({ columns: cols([], [card('hearts', 13)], [card('hearts', 12)]) });
    expect(applyMove(state, { type: 'column', columnIndex: 1, cardIndex: 0 }, { type: 'column', index: 0 })).not.toBeNull();
    expect(applyMove(state, { type: 'column', columnIndex: 2, cardIndex: 0 }, { type: 'column', index: 0 })).toBeNull();
  });

  test('défausse → fondation (As sur fondation vide)', () => {
    const state = emptyState({ waste: [card('clubs', 5), card('diamonds', 1)] });
    const next = applyMove(state, { type: 'waste' }, { type: 'foundation', index: 2 });
    expect(next?.foundations[2].map((c) => c.id)).toEqual(['diamonds-1']);
    expect(next?.waste.map((c) => c.id)).toEqual(['clubs-5']);
  });

  test('une séquence de plusieurs cartes ne peut pas aller en fondation', () => {
    const state = emptyState({
      columns: cols([card('hearts', 2), card('spades', 1)]),
      foundations: [[card('hearts', 1)], [], [], []],
    });
    expect(applyMove(state, { type: 'column', columnIndex: 0, cardIndex: 0 }, { type: 'foundation', index: 0 })).toBeNull();
  });

  test('impossible de déplacer une carte face cachée', () => {
    const state = emptyState({ columns: cols([card('hearts', 13, false)], []) });
    expect(applyMove(state, { type: 'column', columnIndex: 0, cardIndex: 0 }, { type: 'column', index: 1 })).toBeNull();
  });

  test('défausse vide : rien à déplacer', () => {
    expect(applyMove(emptyState(), { type: 'waste' }, { type: 'foundation', index: 0 })).toBeNull();
  });
});

describe('Solitaire - fondation automatique', () => {
  test('trouve la fondation qui accepte la carte', () => {
    const state = emptyState({ foundations: [[], [card('spades', 1)], [], []] });
    expect(findFoundationFor(state, card('spades', 2))).toBe(1);
    expect(findFoundationFor(state, card('hearts', 1))).toBe(0); // premier emplacement vide
    expect(findFoundationFor(state, card('hearts', 5))).toBe(-1);
  });
});

describe('Solitaire - indice', () => {
  test('priorité 1 : une carte qui peut monter en fondation', () => {
    const state = emptyState({
      columns: cols([card('clubs', 9)], [card('hearts', 1)]),
      waste: [card('diamonds', 8)],
    });
    expect(findHintMove(state)).toEqual({ source: { type: 'column', columnIndex: 1, cardIndex: 0 }, target: { type: 'foundation', index: 0 } });
  });

  test('priorité 2 : un déplacement qui découvre une carte cachée', () => {
    const state = emptyState({
      columns: cols([card('spades', 4, false), card('hearts', 9)], [card('clubs', 10)]),
      waste: [card('spades', 8)],
    });
    expect(findHintMove(state)).toEqual({ source: { type: 'column', columnIndex: 0, cardIndex: 1 }, target: { type: 'column', index: 1 } });
  });

  test('ne propose pas de promener un Roi seul d’une colonne vide à l’autre', () => {
    const state = emptyState({ columns: cols([card('hearts', 13)], []), stock: [card('clubs', 3, false)] });
    expect(findHintMove(state)).toEqual({ draw: true });
  });

  test('priorité 3 : la défausse vers une colonne', () => {
    const state = emptyState({ columns: cols([card('clubs', 10)]), waste: [card('hearts', 9)] });
    expect(findHintMove(state)).toEqual({ source: { type: 'waste' }, target: { type: 'column', index: 0 } });
  });

  test('sinon : piocher, et rien du tout quand la pioche et la défausse sont vides', () => {
    expect(findHintMove(emptyState({ stock: [card('clubs', 3, false)] }))).toEqual({ draw: true });
    expect(findHintMove(emptyState())).toBeNull();
  });

  test('chaque indice proposé est un coup réellement jouable', () => {
    const state = emptyState({
      columns: cols([card('spades', 4, false), card('hearts', 9)], [card('clubs', 10)], [card('diamonds', 1)]),
      waste: [card('spades', 8)],
    });
    const hint = findHintMove(state);
    expect(hint && 'source' in hint ? applyMove(state, hint.source, hint.target) : 'draw').not.toBeNull();
  });
});
