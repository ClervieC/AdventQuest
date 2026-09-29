/// <reference types="jest" />
import { BASE_SCORE_CAP, capScore, DAY_SCORE_INFO } from './scoring';

describe('Plafond de score du calendrier', () => {
  test('une partie sous le plafond garde son score', () => {
    expect(capScore(1500)).toEqual({ total: 1500, base: 1500, bonus: 0, capped: false });
  });
  test('la partie normale est plafonnée à 2 000', () => {
    expect(capScore(5400)).toEqual({ total: BASE_SCORE_CAP, base: BASE_SCORE_CAP, bonus: 0, capped: true });
  });
  test('le bonus s’ajoute par-dessus le plafond, sans limite', () => {
    // 3 000 en partie normale (plafonnée à 2 000) + 4 500 de temps additionnel
    expect(capScore(7500, 4500)).toEqual({ total: 6500, base: 2000, bonus: 4500, capped: true });
  });
  test('un bonus incohérent (plus grand que le score, négatif) est corrigé', () => {
    expect(capScore(300, 900).total).toBe(300);
    expect(capScore(300, -50).total).toBe(300);
  });
});

describe('Maximum de points affiché pour chaque jour', () => {
  test('les 24 jours ont un maximum, jamais au-dessus du plafond', () => {
    for (let day = 1; day <= 24; day++) {
      const info = DAY_SCORE_INFO[day];
      expect(info).toBeDefined();
      expect(info.baseMax).toBeGreaterThan(0);
      expect(info.baseMax).toBeLessThanOrEqual(BASE_SCORE_CAP);
    }
  });
});
