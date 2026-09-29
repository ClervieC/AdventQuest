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
  isFull: boolean; // le serpent remplit toute la grille : plus de place pour une pomme, partie parfaite
}

// Pas de chrono : on joue jusqu'à se mordre la queue. Il faut au moins MIN_APPLES pommes pour gagner le fragment,
// chaque pomme accélère le serpent (de 240 ms à 80 ms par case, atteint à 20 pommes).
export const MIN_APPLES = 15;
export const TICK_SLOW_MS = 240;
export const TICK_FAST_MS = 80;
const TICK_SPEEDUP_PER_APPLE = 8;

/** Délai entre deux pas du serpent selon le nombre de pommes mangées */
export function getTickInterval(applesEaten: number): number {
  return Math.max(TICK_FAST_MS, TICK_SLOW_MS - applesEaten * TICK_SPEEDUP_PER_APPLE);
}

/** Fragment gagné avec au moins MIN_APPLES pommes */
export function isSnakeSuccess(applesEaten: number): boolean {
  return applesEaten >= MIN_APPLES;
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
  if (state.isDead || state.isFull) return state;

  const newHead = getNextHeadPosition(state.snake[0], state.direction, state.gridSize);
  const ateApple = isEatingApple(newHead, state.apple);

  const newSnake = ateApple
    ? [newHead, ...state.snake]
    : [newHead, ...state.snake.slice(0, -1)];

  const isDead = newSnake.slice(1).some(
    (seg) => seg.row === newHead.row && seg.col === newHead.col
  );

  // Grille pleine : plus aucune case libre pour une nouvelle pomme (sinon la recherche tournerait à l'infini)
  const isFull = !isDead && newSnake.length >= state.gridSize * state.gridSize;

  return {
    ...state,
    snake: newSnake,
    apple: ateApple && !isFull ? generateApplePosition(newSnake, state.gridSize) : state.apple,
    score: ateApple ? state.score + 1 : state.score,
    isDead,
    isFull,
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
    isFull: false,
  };
}

// 100 points par pomme jusqu'au minimum, puis 40 par pomme en bonus (≈ 1 000 de bonus pour une très longue partie)
export const APPLE_POINTS = 100;
export const BONUS_APPLE_POINTS = 40;

/** Score final transmis au GameWrapper */
export function calculateFinalScore(applesEaten: number): number {
  return Math.min(applesEaten, MIN_APPLES) * APPLE_POINTS + snakeBonusPoints(applesEaten);
}

/** Part du score gagnée après le minimum de pommes (bonus, non plafonné) */
export function snakeBonusPoints(applesEaten: number): number {
  return Math.max(0, applesEaten - MIN_APPLES) * BONUS_APPLE_POINTS;
}
/**
 * File des virages demandés entre deux pas du serpent (au plus 2, pour enchaîner un virage rapide en « U »).
 * Chaque virage est comparé au dernier de la file (ou à la direction réellement suivie) : jamais de demi-tour
 * direct, même avec deux appuis très rapides entre deux pas (↑ puis ← puis ↓ quand on va vers le haut).
 */
export function queueTurn(queue: Direction[], currentDirection: Direction, turn: Direction, maxQueued = 2): Direction[] {
  const last = queue.length > 0 ? queue[queue.length - 1] : currentDirection;
  if (turn === last || isOppositeDirection(last, turn) || queue.length >= maxQueued) return queue;
  return [...queue, turn];
}
