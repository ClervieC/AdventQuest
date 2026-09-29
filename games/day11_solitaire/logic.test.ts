import {
    calculateSolitaireScore,
    canPlaceOnColumn,
    canPlaceOnFoundation,
    Card,
    drawFromStock,
    flipTopCardIfNeeded,
    GameState,
    getMovableCards,
    isGameWon,
    isStuck,
} from './logic';

function makeCard(suit: Card['suit'], rank: Card['rank'], faceUp = true): Card {
  return { suit, rank, faceUp, id: `${suit}-${rank}` };
}

describe('canPlaceOnColumn', () => {
  test('un Roi peut être posé sur une colonne vide', () => {
    expect(canPlaceOnColumn(makeCard('hearts', 13), [])).toBe(true);
  });

  test('une carte non-Roi ne peut PAS être posée sur une colonne vide', () => {
    expect(canPlaceOnColumn(makeCard('hearts', 5), [])).toBe(false);
  });

  test('couleur opposée + rang inférieur de 1 = valide', () => {
    const column = [makeCard('spades', 8)]; // noir, 8
    expect(canPlaceOnColumn(makeCard('hearts', 7), column)).toBe(true); // rouge, 7
  });

  test('même couleur = invalide même si le rang est bon', () => {
    const column = [makeCard('spades', 8)];
    expect(canPlaceOnColumn(makeCard('clubs', 7), column)).toBe(false); // noir sur noir
  });

  test('rang non consécutif = invalide', () => {
    const column = [makeCard('spades', 8)];
    expect(canPlaceOnColumn(makeCard('hearts', 5), column)).toBe(false);
  });

  test('ne peut pas poser sur une carte face cachée', () => {
    const column = [makeCard('spades', 8, false)];
    expect(canPlaceOnColumn(makeCard('hearts', 7), column)).toBe(false);
  });
});

describe('canPlaceOnFoundation', () => {
  test('un As peut commencer une fondation vide', () => {
    expect(canPlaceOnFoundation(makeCard('hearts', 1), [])).toBe(true);
  });

  test('une carte non-As ne peut pas commencer une fondation', () => {
    expect(canPlaceOnFoundation(makeCard('hearts', 5), [])).toBe(false);
  });

  test('même couleur + rang immédiatement supérieur = valide', () => {
    const foundation = [makeCard('hearts', 1), makeCard('hearts', 2)];
    expect(canPlaceOnFoundation(makeCard('hearts', 3), foundation)).toBe(true);
  });

  test('couleur différente = invalide', () => {
    const foundation = [makeCard('hearts', 1), makeCard('hearts', 2)];
    expect(canPlaceOnFoundation(makeCard('diamonds', 3), foundation)).toBe(false);
  });

  test('rang non consécutif = invalide', () => {
    const foundation = [makeCard('hearts', 1)];
    expect(canPlaceOnFoundation(makeCard('hearts', 5), foundation)).toBe(false);
  });
});

describe('getMovableCards', () => {
  test('une seule carte face visible en haut peut être déplacée', () => {
    const column = [makeCard('hearts', 10, false), makeCard('spades', 9)];
    const result = getMovableCards(column, 1);
    expect(result).toHaveLength(1);
  });

  test('une séquence valide de plusieurs cartes peut être déplacée ensemble', () => {
    const column = [
      makeCard('hearts', 10, false),
      makeCard('spades', 9),  // noir
      makeCard('hearts', 8),  // rouge, suit
    ];
    const result = getMovableCards(column, 1);
    expect(result).toHaveLength(2);
  });

  test('une séquence invalide (couleurs identiques) ne peut pas être déplacée ensemble', () => {
    const column = [
      makeCard('hearts', 10, false),
      makeCard('spades', 9),
      makeCard('clubs', 8), // noir sur noir, séquence invalide
    ];
    const result = getMovableCards(column, 1);
    expect(result).toBeNull();
  });

  test('ne peut pas déplacer une carte face cachée', () => {
    const column = [makeCard('hearts', 10, false), makeCard('spades', 9, false)];
    const result = getMovableCards(column, 1);
    expect(result).toBeNull();
  });
});

describe('flipTopCardIfNeeded', () => {
  test('retourne la carte du dessus si elle était face cachée', () => {
    const column = [makeCard('hearts', 5, false)];
    const result = flipTopCardIfNeeded(column);
    expect(result[0].faceUp).toBe(true);
  });

  test('ne change rien si la carte est déjà face visible', () => {
    const column = [makeCard('hearts', 5, true)];
    const result = flipTopCardIfNeeded(column);
    expect(result[0].faceUp).toBe(true);
  });

  test('colonne vide ne plante pas', () => {
    expect(flipTopCardIfNeeded([])).toEqual([]);
  });
});

describe('drawFromStock', () => {
  test('pioche une carte du stock vers le waste', () => {
    const state: GameState = {
      columns: [[], [], [], [], [], [], []],
      foundations: [[], [], [], []],
      stock: [makeCard('hearts', 5, false)],
      waste: [],
    };
    const result = drawFromStock(state);
    expect(result.stock).toHaveLength(0);
    expect(result.waste).toHaveLength(1);
    expect(result.waste[0].faceUp).toBe(true);
  });

  test('recycle le waste vers le stock quand le stock est vide', () => {
    const state: GameState = {
      columns: [[], [], [], [], [], [], []],
      foundations: [[], [], [], []],
      stock: [],
      waste: [makeCard('hearts', 5), makeCard('spades', 9)],
    };
    const result = drawFromStock(state);
    expect(result.stock).toHaveLength(2);
    expect(result.waste).toHaveLength(0);
    expect(result.stock.every((c) => !c.faceUp)).toBe(true);
  });
});

describe('isGameWon', () => {
  test('pas gagné si les fondations sont incomplètes', () => {
    const state: GameState = {
      columns: [],
      foundations: [[makeCard('hearts', 1)], [], [], []],
      stock: [],
      waste: [],
    };
    expect(isGameWon(state)).toBe(false);
  });

  test('gagné quand les 4 fondations ont 13 cartes chacune', () => {
    const fullFoundation = Array.from({ length: 13 }, (_, i) => makeCard('hearts', (i + 1) as any));
    const state: GameState = {
      columns: [],
      foundations: [fullFoundation, fullFoundation, fullFoundation, fullFoundation],
      stock: [],
      waste: [],
    };
    expect(isGameWon(state)).toBe(true);
  });
});

describe('calculateSolitaireScore', () => {
  test('score de base proportionnel aux cartes en fondation', () => {
    expect(calculateSolitaireScore(20, 0, 0)).toBe(500); // 20*25
  });

  test('pénalité de temps', () => {
    expect(calculateSolitaireScore(20, 50, 0)).toBe(490); // 500 - 10
  });

  test('chaque hint coûte 50 points', () => {
    expect(calculateSolitaireScore(20, 0, 2)).toBe(400); // 500 - 100
  });

  test('le score ne descend jamais sous 50', () => {
    expect(calculateSolitaireScore(0, 9999, 99)).toBe(50);
  });
});
describe('isStuck (plus aucun coup utile)', () => {
  const hidden = (suit: Card['suit'], rank: Card['rank']) => makeCard(suit, rank, false);
  const base = (columns: Card[][], reserve: Card[] = [], foundations: Card[][] = [[], [], [], []]): GameState => ({
    columns: [...columns, ...Array.from({ length: 7 - columns.length }, () => [hidden('clubs', 2), makeCard('clubs', 9)])].slice(0, 7),
    foundations,
    stock: reserve,
    waste: [],
  });

  test('bloqué : rien dans la pioche ne se pose, aucune colonne ne bouge', () => {
    const state = base([[hidden('hearts', 2), makeCard('spades', 9)]], [makeCard('hearts', 5), makeCard('diamonds', 7)]);
    expect(isStuck(state)).toBe(true);
  });

  test('pas bloqué : une carte de la pioche se pose sur une colonne (même au fond de la pioche)', () => {
    const state = base([[hidden('hearts', 2), makeCard('spades', 9)]], [makeCard('hearts', 8), makeCard('hearts', 5)]);
    expect(isStuck(state)).toBe(false);
  });

  test('pas bloqué : un As en bas de colonne peut monter en fondation', () => {
    const state = base([[hidden('hearts', 2), makeCard('diamonds', 1)]]);
    expect(isStuck(state)).toBe(false);
  });

  test('pas bloqué : déplacer une suite découvre une carte cachée', () => {
    const state = base([[hidden('hearts', 2), makeCard('hearts', 8)], [makeCard('spades', 9)]]);
    expect(isStuck(state)).toBe(false);
  });

  test('bloqué : le seul coup fait passer une suite d’une colonne à l’autre sans rien découvrir', () => {
    const state = base([[makeCard('hearts', 8)], [makeCard('spades', 9)]]);
    expect(isStuck(state)).toBe(true);
  });

  test('pas bloqué : déplacer une partie de suite dégage une carte qui monte en fondation', () => {
    // 9♥ passe sur 10♣, ce qui dégage 10♠ : il peut monter sur la fondation ♠ (As à 9)
    const spades = Array.from({ length: 9 }, (_, i) => makeCard('spades', (i + 1) as Card['rank']));
    const state = base(
      [[hidden('clubs', 4), makeCard('spades', 10), makeCard('hearts', 9)], [makeCard('clubs', 10)]],
      [],
      [spades, [], [], []]
    );
    expect(isStuck(state)).toBe(false);
  });

  test('une partie gagnée n’est pas « bloquée »', () => {
    const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const foundations = suits.map((suit) => Array.from({ length: 13 }, (_, i) => makeCard(suit, (i + 1) as Card['rank'])));
    expect(isStuck({ columns: [[], [], [], [], [], [], []], foundations, stock: [], waste: [] })).toBe(false);
  });
});
