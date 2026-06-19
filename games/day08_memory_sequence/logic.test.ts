import {
    calculateSequenceScore,
    checkPlayerInput,
    extendSequence,
    generateSequence,
    hasWon,
    SymbolIndex,
} from './logic';

describe('generateSequence', () => {
  test('génère une séquence de la bonne longueur', () => {
    const sequence = generateSequence(5);
    expect(sequence).toHaveLength(5);
  });

  test('génère uniquement des valeurs entre 0 et 3', () => {
    const sequence = generateSequence(20); // grand échantillon pour couvrir les cas
    sequence.forEach((symbol) => {
      expect(symbol).toBeGreaterThanOrEqual(0);
      expect(symbol).toBeLessThanOrEqual(3);
    });
  });

  test('séquence de longueur 0 retourne un tableau vide', () => {
    expect(generateSequence(0)).toEqual([]);
  });
});

describe('extendSequence', () => {
  test('ajoute exactement un élément à la séquence', () => {
    const original: SymbolIndex[] = [0, 1, 2];
    const extended = extendSequence(original);
    expect(extended).toHaveLength(4);
  });

  test('garde les éléments originaux intacts au début', () => {
    const original: SymbolIndex[] = [0, 1, 2];
    const extended = extendSequence(original);
    expect(extended.slice(0, 3)).toEqual(original);
  });

  test('ne modifie pas le tableau original (immutabilité)', () => {
    const original: SymbolIndex[] = [0, 1, 2];
    extendSequence(original);
    expect(original).toEqual([0, 1, 2]); // toujours intact après l'appel
  });
});

describe('checkPlayerInput', () => {
  const expected: SymbolIndex[] = [0, 1, 2, 3];

  test('input vide est toujours "correct_so_far"', () => {
    expect(checkPlayerInput(expected, [])).toBe('correct_so_far');
  });

  test('input partiel correct retourne "correct_so_far"', () => {
    expect(checkPlayerInput(expected, [0, 1])).toBe('correct_so_far');
  });

  test('input incorrect dès la première erreur retourne "wrong"', () => {
    expect(checkPlayerInput(expected, [0, 2])).toBe('wrong'); // 2 au lieu de 1
  });

  test('erreur en milieu de séquence retourne "wrong"', () => {
    expect(checkPlayerInput(expected, [0, 1, 1, 3])).toBe('wrong');
  });

  test('input complet et correct retourne "complete"', () => {
    expect(checkPlayerInput(expected, [0, 1, 2, 3])).toBe('complete');
  });
});

describe('calculateSequenceScore', () => {
  test('score de base sans hint', () => {
    expect(calculateSequenceScore(5, 0)).toBe(750); // 5 * 150
  });

  test('chaque hint retire 80 points', () => {
    expect(calculateSequenceScore(5, 2)).toBe(590); // 750 - 160
  });

  test('le score ne descend jamais sous 50', () => {
    expect(calculateSequenceScore(1, 10)).toBe(50);
  });
});

describe('hasWon', () => {
  test('pas encore gagné si en dessous du seuil', () => {
    expect(hasWon(4, 5)).toBe(false);
  });

  test('gagné exactement au seuil', () => {
    expect(hasWon(5, 5)).toBe(true);
  });

  test('gagné si au-dessus du seuil (cas limite improbable mais sûr)', () => {
    expect(hasWon(6, 5)).toBe(true);
  });
});