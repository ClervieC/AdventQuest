/// <reference types="jest" />
import { calculatePairsScore, createDeck, isComplete, PAIRS_SETTINGS, SYMBOLS } from './logic';

describe('Paires', () => {
  test('chaque symbole apparaît exactement deux fois', () => {
    const deck = createDeck(8);
    expect(deck).toHaveLength(16);
    const counts = new Map<string, number>();
    deck.forEach((card) => counts.set(card.symbol, (counts.get(card.symbol) ?? 0) + 1));
    expect([...counts.values()].every((n) => n === 2)).toBe(true);
    expect(new Set(deck.map((c) => c.id)).size).toBe(16);
  });
  test('assez de symboles pour toutes les difficultés, et une grille complète', () => {
    Object.values(PAIRS_SETTINGS).forEach((s) => {
      expect(SYMBOLS.length).toBeGreaterThanOrEqual(s.pairs);
      expect((s.pairs * 2) % s.columns).toBe(0);
    });
  });
  test('la partie est finie quand toutes les paires sont trouvées', () => {
    const deck = createDeck(2);
    expect(isComplete(deck)).toBe(false);
    expect(isComplete(deck.map((c) => ({ ...c, matched: true })))).toBe(true);
  });
  test('score : erreurs pénalisées, temps restant récompensé, plancher à 100', () => {
    expect(calculatePairsScore(0, 0)).toBe(1000);
    expect(calculatePairsScore(4, 10)).toBe(950);
    expect(calculatePairsScore(100, 0)).toBe(100);
  });
});
