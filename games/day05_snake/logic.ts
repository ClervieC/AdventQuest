export type Direction = 'up' | 'down' | 'left' | 'right';
export interface Position {
  row: number;
  col: number;
}

export interface SnakeState {
  snake: Position[];      // snake[0] = la tête
  direction: Direction;
  apple: Position;
  score: number;
  gridSize: number;
  isDead: boolean;
}

/** Calcule la prochaine position de la tête selon la direction, en traversant les murs (wrap-around) */
export function getNextHeadPosition(head: Position, direction: Direction, gridSize: number): Position {
  let { row, col } = head;

  switch (direction) {
    case 'up':
      row -= 1;
      break;
    case 'down':
      row += 1;
      break;
    case 'left':
      col -= 1;
      break;
    case 'right':
      col += 1;
      break;
  }

  // Traverse les murs au lieu de mourir (règle clé de ce Snake)
  row = (row + gridSize) % gridSize;
  col = (col + gridSize) % gridSize;

  return { row, col };
}

/** Empêche un demi-tour instantané sur soi-même (ex: aller à droite puis immédiatement à gauche) */
export function isOppositeDirection(current: Direction, attempted: Direction): boolean {
  const opposites: Record<Direction, Direction> = {
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left',
  };
  return opposites[current] === attempted;
}

/** Génère une position de pomme aléatoire qui n'est pas déjà occupée par le serpent */
export function generateApplePosition(snake: Position[], gridSize: number): Position {
  let position: Position;
  do {
    position = {
      row: Math.floor(Math.random() * gridSize),
      col: Math.floor(Math.random() * gridSize),
    };
  } while (snake.some((segment) => segment.row === position.row && segment.col === position.col));
  return position;
}

/** Vérifie si la nouvelle position de tête correspond à la pomme */
export function isEatingApple(newHead: Position, apple: Position): boolean {
  return newHead.row === apple.row && newHead.col === apple.col;
}

export function advanceSnake(state: SnakeState): SnakeState {
  if (state.isDead) return state;

  const newHead = getNextHeadPosition(state.snake[0], state.direction, state.gridSize);
  const ateApple = isEatingApple(newHead, state.apple);

  const newSnake = ateApple
    ? [newHead, ...state.snake]
    : [newHead, ...state.snake.slice(0, -1)];

  const isDead = newSnake.slice(1).some(
    (seg) => seg.row === newHead.row && seg.col === newHead.col
  );

  return {
    ...state,
    snake: newSnake,
    apple: ateApple ? generateApplePosition(newSnake, state.gridSize) : state.apple,
    score: ateApple ? state.score + 1 : state.score,
    isDead,
  };
}

/** Crée l'état initial du jeu */
export function createInitialState(gridSize: number): SnakeState {
  const startSnake: Position[] = [{ row: Math.floor(gridSize / 2), col: Math.floor(gridSize / 2) }];
  return {
    snake: startSnake,
    direction: 'right',
    apple: generateApplePosition(startSnake, gridSize),
    score: 0,
    gridSize,
    isDead: false,
  };
}

/** Calcule le score final transmis au GameWrapper (pommes mangées = score direct) */
export function calculateFinalScore(applesEaten: number): number {
  return applesEaten * 100;
}