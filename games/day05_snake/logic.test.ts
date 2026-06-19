import {
    advanceSnake,
    calculateFinalScore,
    createInitialState,
    generateApplePosition,
    getNextHeadPosition,
    isEatingApple,
    isOppositeDirection,
    SnakeState,
} from './logic';

describe('getNextHeadPosition', () => {
  test('se déplace vers le haut correctement', () => {
    expect(getNextHeadPosition({ row: 5, col: 5 }, 'up', 10)).toEqual({ row: 4, col: 5 });
  });

  test('se déplace vers le bas correctement', () => {
    expect(getNextHeadPosition({ row: 5, col: 5 }, 'down', 10)).toEqual({ row: 6, col: 5 });
  });

  test('se déplace vers la gauche correctement', () => {
    expect(getNextHeadPosition({ row: 5, col: 5 }, 'left', 10)).toEqual({ row: 5, col: 4 });
  });

  test('se déplace vers la droite correctement', () => {
    expect(getNextHeadPosition({ row: 5, col: 5 }, 'right', 10)).toEqual({ row: 5, col: 6 });
  });

  test('traverse le mur du haut vers le bas (règle clé : pas de mort)', () => {
    expect(getNextHeadPosition({ row: 0, col: 5 }, 'up', 10)).toEqual({ row: 9, col: 5 });
  });

  test('traverse le mur de droite vers la gauche', () => {
    expect(getNextHeadPosition({ row: 5, col: 9 }, 'right', 10)).toEqual({ row: 5, col: 0 });
  });

  test('traverse le mur du bas vers le haut', () => {
    expect(getNextHeadPosition({ row: 9, col: 5 }, 'down', 10)).toEqual({ row: 0, col: 5 });
  });

  test('traverse le mur de gauche vers la droite', () => {
    expect(getNextHeadPosition({ row: 5, col: 0 }, 'left', 10)).toEqual({ row: 5, col: 9 });
  });
});

describe('isOppositeDirection', () => {
  test('détecte up/down comme opposés', () => {
    expect(isOppositeDirection('up', 'down')).toBe(true);
    expect(isOppositeDirection('down', 'up')).toBe(true);
  });

  test('détecte left/right comme opposés', () => {
    expect(isOppositeDirection('left', 'right')).toBe(true);
    expect(isOppositeDirection('right', 'left')).toBe(true);
  });

  test('directions perpendiculaires ne sont pas opposées', () => {
    expect(isOppositeDirection('up', 'left')).toBe(false);
    expect(isOppositeDirection('right', 'down')).toBe(false);
  });

  test('même direction n\'est pas "opposée" à elle-même', () => {
    expect(isOppositeDirection('up', 'up')).toBe(false);
  });
});

describe('generateApplePosition', () => {
  test('ne génère jamais une pomme sur le serpent', () => {
    const snake = [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }];
    // on teste plusieurs fois car c'est aléatoire
    for (let i = 0; i < 30; i++) {
      const apple = generateApplePosition(snake, 5);
      const onSnake = snake.some((s) => s.row === apple.row && s.col === apple.col);
      expect(onSnake).toBe(false);
    }
  });

  test('génère une position dans les limites de la grille', () => {
    const apple = generateApplePosition([], 10);
    expect(apple.row).toBeGreaterThanOrEqual(0);
    expect(apple.row).toBeLessThan(10);
    expect(apple.col).toBeGreaterThanOrEqual(0);
    expect(apple.col).toBeLessThan(10);
  });
});

describe('isEatingApple', () => {
  test('détecte correctement quand la tête est sur la pomme', () => {
    expect(isEatingApple({ row: 3, col: 3 }, { row: 3, col: 3 })).toBe(true);
  });

  test('retourne false si pas sur la pomme', () => {
    expect(isEatingApple({ row: 3, col: 3 }, { row: 3, col: 4 })).toBe(false);
  });
});

describe('advanceSnake', () => {
  test('le serpent avance sans manger : garde la même longueur', () => {
    const state: SnakeState = {
      snake: [{ row: 5, col: 5 }, { row: 5, col: 4 }, { row: 5, col: 3 }],
      direction: 'right',
      apple: { row: 0, col: 0 },
      score: 0,
      gridSize: 10,
      isDead: false,
    };
    const next = advanceSnake(state);
    expect(next.snake).toHaveLength(3);
    expect(next.snake[0]).toEqual({ row: 5, col: 6 });
    expect(next.score).toBe(0);
    expect(next.isDead).toBe(false);
  });

  test('manger une pomme allonge le serpent et incrémente le score', () => {
    const state: SnakeState = {
      snake: [{ row: 5, col: 5 }, { row: 5, col: 4 }],
      direction: 'right',
      apple: { row: 5, col: 6 },
      score: 0,
      gridSize: 10,
      isDead: false,
    };
    const next = advanceSnake(state);
    expect(next.snake).toHaveLength(3);
    expect(next.score).toBe(1);
  });

  test('manger une pomme génère une nouvelle position de pomme valide', () => {
    const state: SnakeState = {
      snake: [{ row: 5, col: 5 }],
      direction: 'right',
      apple: { row: 5, col: 6 },
      score: 0,
      gridSize: 10,
      isDead: false,
    };
    const next = advanceSnake(state);
    expect(next.apple.row).toBeGreaterThanOrEqual(0);
    expect(next.apple.col).toBeGreaterThanOrEqual(0);
  });

  test('traverser le mur ne casse rien', () => {
    const state: SnakeState = {
      snake: [{ row: 0, col: 5 }, { row: 1, col: 5 }],
      direction: 'up',
      apple: { row: 9, col: 9 },
      score: 0,
      gridSize: 10,
      isDead: false,
    };
    const next = advanceSnake(state);
    expect(next.snake[0]).toEqual({ row: 9, col: 5 });
    expect(next.snake).toHaveLength(2);
    expect(next.isDead).toBe(false);
  });

  test('collision avec soi-même passe isDead à true', () => {
    // La tête (5,5) va en (5,6) qui est le 2e segment du corps.
    // La queue (6,5) est retirée, mais (5,6) reste dans le corps — c'est une vraie collision.
    const state: SnakeState = {
      snake: [
        { row: 5, col: 5 }, // tête → ira en (5,6)
        { row: 5, col: 6 }, // restera dans le corps après le mouvement
        { row: 5, col: 7 },
        { row: 6, col: 7 },
        { row: 6, col: 6 },
        { row: 6, col: 5 }, // queue, sera retirée
      ],
      direction: 'right',
      apple: { row: 0, col: 0 },
      score: 2,
      gridSize: 10,
      isDead: false,
    };
    const next = advanceSnake(state);
    expect(next.isDead).toBe(true);
  });

  test('ne bouge plus quand isDead est déjà true', () => {
    const state: SnakeState = {
      snake: [{ row: 5, col: 5 }, { row: 5, col: 4 }],
      direction: 'right',
      apple: { row: 0, col: 0 },
      score: 1,
      gridSize: 10,
      isDead: true,
    };
    const next = advanceSnake(state);
    expect(next).toBe(state); // même référence, aucun changement
  });
});

describe('createInitialState', () => {
  test('crée un serpent de longueur 1 au centre de la grille', () => {
    const state = createInitialState(10);
    expect(state.snake).toHaveLength(1);
    expect(state.snake[0]).toEqual({ row: 5, col: 5 });
  });

  test('le score initial est 0', () => {
    expect(createInitialState(10).score).toBe(0);
  });

  test('la pomme initiale n\'est pas sur le serpent', () => {
    const state = createInitialState(10);
    const onSnake = state.snake.some(
      (s) => s.row === state.apple.row && s.col === state.apple.col
    );
    expect(onSnake).toBe(false);
  });
});

describe('calculateFinalScore', () => {
  test('0 pomme = 0 point', () => {
    expect(calculateFinalScore(0)).toBe(0);
  });

  test('chaque pomme vaut 100 points', () => {
    expect(calculateFinalScore(7)).toBe(700);
  });
});