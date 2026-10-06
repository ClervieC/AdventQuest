/// <reference types="jest" />
import { BONUS_MAX_POINTS, DAY_SCORE_INFO, dayPoints, WIN_MAX_POINTS, WIN_MIN_POINTS } from './scoring';

describe('Barème du calendrier', () => {
  test('jour gagné : de 1 000 (performance minimale) à 2 000 (performance maximale)', () => {
    expect(dayPoints(1, 0, 0, true).total).toBe(WIN_MIN_POINTS);
    expect(dayPoints(1, 2000, 0, true).total).toBe(WIN_MAX_POINTS);
    expect(dayPoints(1, 1200, 0, true).total).toBe(1600); // quiz 6/10
  });

  test('tous les jeux pèsent pareil : même performance = mêmes points, quelle que soit l’échelle du jeu', () => {
    // Relier les points (max 800) et quiz (max 2 000) à 50 % de performance
    expect(dayPoints(6, 400, 0, true).total).toBe(dayPoints(1, 1000, 0, true).total);
  });

  test('un score au-dessus du maximum prévu ne dépasse pas 2 000', () => {
    expect(dayPoints(9, 5400, 0, true).base).toBe(WIN_MAX_POINTS);
  });

  test('bonus plafonné à +1 000', () => {
    // Stack : 2 000 de partie + 1 000 de bonus (bonus maximum) puis bien au-delà
    expect(dayPoints(2, 3000, 1000, true)).toMatchObject({ base: 2000, bonus: BONUS_MAX_POINTS, total: 3000 });
    expect(dayPoints(2, 9000, 7000, true).bonus).toBe(BONUS_MAX_POINTS);
    expect(dayPoints(2, 2500, 500, true).bonus).toBe(500);
  });

  test('pas de bonus sur un jeu qui n’en a pas', () => {
    expect(dayPoints(3, 1500, 300, true).bonus).toBe(0);
  });

  test('jour raté : 0 point (rien de perdu, rien de gagné), jamais de bonus', () => {
    expect(dayPoints(4, 0, 0, false).total).toBe(0);
    expect(dayPoints(4, 2000, 0, false).total).toBe(0);
    expect(dayPoints(7, 900, 400, false)).toMatchObject({ total: 0, bonus: 0 });
  });

  test('un bonus incohérent (plus grand que le score, négatif) est corrigé', () => {
    expect(dayPoints(2, 300, 900, true).total).toBeLessThanOrEqual(WIN_MAX_POINTS + BONUS_MAX_POINTS);
    expect(dayPoints(2, 300, -50, true).bonus).toBe(0);
  });
});

describe('Valeur de chaque jour', () => {
  test('les 24 jours ont un meilleur score de référence', () => {
    for (let day = 1; day <= 24; day++) {
      const info = DAY_SCORE_INFO[day];
      expect(info).toBeDefined();
      expect(info.baseMax).toBeGreaterThan(0);
      // Un jour avec bonus dit ce qui en rapporte, et inversement
      expect(Boolean(info.bonus)).toBe(Boolean(info.bonusFull));
    }
  });
});
