import {
    calculateDrawingScore,
    findNearestPoint,
    isDrawingComplete,
    isNearPoint,
    isNextValidPoint,
    Point,
} from './logic';

describe('isNextValidPoint', () => {
  test('le point 1 est valide quand aucun point n\'a encore été validé', () => {
    expect(isNextValidPoint(0, 1)).toBe(true);
  });

  test('le point 3 est valide après avoir validé le point 2', () => {
    expect(isNextValidPoint(2, 3)).toBe(true);
  });

  test('sauter un point (ex: 2 -> 4) est invalide', () => {
    expect(isNextValidPoint(2, 4)).toBe(false);
  });

  test('revenir en arrière est invalide', () => {
    expect(isNextValidPoint(3, 2)).toBe(false);
  });
});

describe('isDrawingComplete', () => {
  test('pas complet si des points restent', () => {
    expect(isDrawingComplete(5, 8)).toBe(false);
  });

  test('complet quand le dernier point correspond au total', () => {
    expect(isDrawingComplete(8, 8)).toBe(true);
  });
});

describe('isNearPoint', () => {
  const point: Point = { id: 1, x: 50, y: 50 };

  test('détecte un toucher exactement sur le point', () => {
    expect(isNearPoint(50, 50, point)).toBe(true);
  });

  test('détecte un toucher proche (dans la tolérance par défaut)', () => {
    expect(isNearPoint(53, 52, point)).toBe(true);
  });

  test('rejette un toucher trop loin', () => {
    expect(isNearPoint(70, 70, point)).toBe(false);
  });

  test('respecte une tolérance personnalisée', () => {
    expect(isNearPoint(58, 50, point, 10)).toBe(true);
    expect(isNearPoint(58, 50, point, 5)).toBe(false);
  });
});

describe('findNearestPoint', () => {
  const points: Point[] = [
    { id: 1, x: 10, y: 10 },
    { id: 2, x: 50, y: 50 },
    { id: 3, x: 90, y: 90 },
  ];

  test('trouve le point le plus proche parmi plusieurs candidats potentiels', () => {
    const result = findNearestPoint(52, 48, points);
    expect(result?.id).toBe(2);
  });

  test('retourne null si aucun point n\'est dans la tolérance', () => {
    const result = findNearestPoint(30, 30, points, 5);
    expect(result).toBeNull();
  });
});

describe('calculateDrawingScore', () => {
  test('score parfait : rapide, sans erreur', () => {
    expect(calculateDrawingScore(5, 0)).toBe(775); // 800 - 25
  });

  test('pénalité de temps plafonnée à 300', () => {
    expect(calculateDrawingScore(200, 0)).toBe(500); // 800 - 300 (plafond)
  });

  test('chaque erreur coûte 30 points', () => {
    expect(calculateDrawingScore(5, 3)).toBe(685); // 800 - 25 - 90
  });

  test('le score ne descend jamais sous 100', () => {
    expect(calculateDrawingScore(9999, 99)).toBe(100);
  });
});