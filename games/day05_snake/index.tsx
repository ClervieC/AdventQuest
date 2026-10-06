import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, SharedValue, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ControlChoice, DirectionPad } from '../../components/DirectionPad';
import { GameComponentProps } from '../../components/GameWrapper/types';
import { useGameKeys } from '../../hooks/use-game-keys';
import { playSfx } from '../../services/sfx';
import {
    advanceSnake,
    calculateFinalScore,
    createInitialState,
    crossesEdge,
    Direction,
    getTickInterval,
    isSnakeSuccess,
    MIN_APPLES,
    queueTurn,
    SnakeState,
    snakeBonusPoints,
    VisualPosition,
} from './logic';
import { useI18n } from '../../services/i18n';

const GRID_SIZE = 10;
const ARROW_DIRECTIONS: Record<string, Direction> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
const CELL_PIXEL_SIZE = 28;

// Avant de lancer : avec la croix directionnelle ou en glissant (glisser depuis le bord peut ramener à la page
// précédente du navigateur sur certains téléphones)
export function SnakeGame(props: GameComponentProps) {
  const [directionPad, setDirectionPad] = useState<boolean | null>(null);
  if (directionPad === null) return <ControlChoice onChoose={setDirectionPad} />;
  return <SnakeBoard {...props} directionPad={directionPad} />;
}

// Pas de chrono : la partie dure tant que la guirlande ne se mord pas la queue.
// Au moins MIN_APPLES pommes pour gagner le fragment ; chaque pomme accélère (voir logic.ts).
function SnakeBoard({ onGameEnd, directionPad }: GameComponentProps & { directionPad: boolean }) {
  const { tr } = useI18n();
  // État de la partie : la référence est mise à jour à l'instant même du pas (pas au rendu suivant), sinon un appui
  // arrivé juste après un pas était comparé à l'ancienne direction et pouvait être rejeté comme un demi-tour
  const stateRef = useRef<SnakeState>(createInitialState(GRID_SIZE));
  const [gameState, setGameState] = useState<SnakeState>(stateRef.current);
  // Virages demandés en attente : un par pas du serpent (voir queueTurn)
  const turnsRef = useRef<Direction[]>([]);
  // Glissement fluide d'une case à l'autre : départ de chaque anneau + avancement du pas (0 → 1)
  const fromRef = useRef<VisualPosition[]>(stateRef.current.snake);
  const [fromPositions, setFromPositions] = useState<VisualPosition[]>(fromRef.current);
  const progress = useSharedValue(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onGameEndRef = useRef(onGameEnd);
  onGameEndRef.current = onGameEnd;

  // Un pas du serpent. Appelé par le minuteur, ou tout de suite quand on tourne (voir changeDirection)
  const step = useCallback(() => {
    const previous = stateRef.current;
    if (previous.isDead || previous.isFull) return;
    const [next, ...rest] = turnsRef.current;
    turnsRef.current = rest;

    // Le glissement suivant part exactement des cases où le serpent vient d'arriver : toujours de case en case,
    // jamais en diagonale
    fromRef.current = previous.snake;
    const nextState = advanceSnake({ ...previous, direction: next ?? previous.direction });
    stateRef.current = nextState;
    setGameState(nextState);
    setFromPositions(fromRef.current);

    const interval = getTickInterval(nextState.score);
    progress.value = 0;
    progress.value = withTiming(1, { duration: interval, easing: Easing.linear });

    if (timerRef.current) clearTimeout(timerRef.current);
    if (nextState.isDead || nextState.isFull) {
      // Pommes au-delà du minimum = bonus (non plafonné)
      onGameEndRef.current({
        success: isSnakeSuccess(nextState.score),
        score: calculateFinalScore(nextState.score),
        bonus: snakeBonusPoints(nextState.score),
      });
      return;
    }
    // Rythme régulier : le pas suivant est programmé à partir de celui-ci (plus de minuteur recréé à chaque pomme)
    timerRef.current = setTimeout(step, interval);
  }, [progress]);

  useEffect(() => {
    timerRef.current = setTimeout(step, getTickInterval(0));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [step]);

  // Bruitage quand le serpent mange une pomme (le score augmente), fanfare à l'objectif
  const lastScoreRef = useRef(gameState.score);
  useEffect(() => {
    if (gameState.score > lastScoreRef.current) playSfx(gameState.score === MIN_APPLES ? 'victory' : 'eat');
    lastScoreRef.current = gameState.score;
  }, [gameState.score]);

  const changeDirection = useCallback(
    (newDirection: Direction) => {
      const state = stateRef.current;
      if (state.isDead || state.isFull) return;
      // Jamais de demi-tour, même avec plusieurs appuis rapides entre deux pas. Comparé à la direction mise à jour
      // à l'instant du pas (stateRef) : plus d'appui rejeté par erreur. Jusqu'à 3 virages gardés en attente.
      turnsRef.current = queueTurn(turnsRef.current, state.direction, newDirection, 3);
    },
    []
  );

  // Sur ordi : les flèches changent de direction
  useGameKeys((key) => {
    const direction = ARROW_DIRECTIONS[key];
    if (!direction) return false;
    changeDirection(direction);
  });

  // Détection de swipe pour changer de direction
  const panGesture = Gesture.Pan().runOnJS(true).onEnd((event) => {
    const { translationX, translationY } = event;
    // Un simple toucher (sur une flèche par exemple) n'est pas un glissé
    if (Math.abs(translationX) < 20 && Math.abs(translationY) < 20) return;
    if (Math.abs(translationX) > Math.abs(translationY)) {
      changeDirection(translationX > 0 ? 'right' : 'left');
    } else {
      changeDirection(translationY > 0 ? 'down' : 'up');
    }
  });

  const content = (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.score}>
          🍎 {gameState.score}
          {gameState.score < MIN_APPLES ? ` / ${MIN_APPLES}` : ''}
        </Text>
        {gameState.score >= MIN_APPLES && <Text style={styles.bonus}>{tr('🎉 Objectif atteint · bonus !', '🎉 Goal reached · bonus!')}</Text>}
      </View>

      <View style={[styles.grid, { width: GRID_SIZE * CELL_PIXEL_SIZE, height: GRID_SIZE * CELL_PIXEL_SIZE }]}>
        {/* Pomme */}
        <View style={[styles.cell, { left: gameState.apple.col * CELL_PIXEL_SIZE, top: gameState.apple.row * CELL_PIXEL_SIZE }]}>
          <Text style={styles.appleEmoji}>🍎</Text>
        </View>
        <SnakeBody snake={gameState.snake} from={fromPositions} direction={gameState.direction} progress={progress} />
      </View>

      {directionPad && <DirectionPad onPress={changeDirection} />}

      <Text style={styles.hint}>
        {directionPad
          ? tr(
              `Flèches pour diriger. Au moins ${MIN_APPLES} pommes, puis continue tant que tu ne te mords pas la queue : ça accélère !`,
              `Arrows to steer. At least ${MIN_APPLES} apples, then keep going until you bite your tail: it speeds up!`
            )
          : tr(
              `Glisse pour diriger. Au moins ${MIN_APPLES} pommes, puis continue tant que tu ne te mords pas la queue : ça accélère !`,
              `Swipe to steer. At least ${MIN_APPLES} apples, then keep going until you bite your tail: it speeds up!`
            )}
      </Text>
    </View>
  );
  // Avec la croix, pas de glisser du tout : aucun risque de revenir à la page précédente
  return directionPad ? content : <GestureDetector gesture={panGesture}>{content}</GestureDetector>;
}

// Serpent dessiné : anneaux verts qui glissent d'une case à l'autre (pas de saut case par case), qui s'affinent
// vers la queue, et une tête avec des yeux qui regardent dans la direction du mouvement et une petite langue
const BODY_COLORS = ['#22c55e', '#34d399'];
const EYE_POSITIONS: Record<Direction, [number, number][]> = {
  right: [[0.62, 0.26], [0.62, 0.74]],
  left: [[0.38, 0.26], [0.38, 0.74]],
  up: [[0.26, 0.38], [0.74, 0.38]],
  down: [[0.26, 0.62], [0.74, 0.62]],
};
const PUPIL_SHIFT: Record<Direction, [number, number]> = { right: [1.5, 0], left: [-1.5, 0], up: [0, -1.5], down: [0, 1.5] };

const midpoint = (a: VisualPosition, b: VisualPosition): VisualPosition => ({ row: (a.row + b.row) / 2, col: (a.col + b.col) / 2 });

function SnakeBody({
  snake,
  from,
  direction,
  progress,
}: {
  snake: SnakeState['snake'];
  from: VisualPosition[];
  direction: Direction;
  progress: SharedValue<number>;
}) {
  const cell = CELL_PIXEL_SIZE;
  const count = snake.length;
  // Épaisseur de chaque anneau : pleine près de la tête, 60 % au bout de la queue
  const thickness = (index: number) => Math.round(cell * (0.86 - (count > 1 ? (0.3 * index) / (count - 1) : 0)));
  // Départ de chaque anneau (s'il traverse un bord, il saute directement à sa case)
  const startOf = (i: number) => {
    const start = from[i] ?? snake[i];
    return crossesEdge(start, snake[i]) ? snake[i] : start;
  };

  return (
    <>
      {/* Joints entre deux anneaux voisins : un rond au milieu, qui glisse avec eux (pas quand le serpent traverse un bord) */}
      {snake.slice(1).map((segment, i) => {
        const previous = snake[i];
        if (Math.abs(previous.row - segment.row) + Math.abs(previous.col - segment.col) !== 1) return null;
        const fromA = startOf(i);
        const fromB = startOf(i + 1);
        const joinedBefore = Math.abs(fromA.row - fromB.row) + Math.abs(fromA.col - fromB.col) <= 1.01;
        const target = midpoint(previous, segment);
        return (
          <MovingPiece
            key={`joint-${i}`}
            from={joinedBefore ? midpoint(fromA, fromB) : target}
            to={target}
            progress={progress}
            size={thickness(i + 1)}
            color={BODY_COLORS[(i + 1) % 2]}
          />
        );
      })}
      {/* Anneaux du corps, de la queue vers la tête (la tête passe par-dessus). Quand la guirlande vient de manger,
          le nouveau morceau apparaît au bout de la queue en grossissant */}
      {snake
        .map((segment, index) => ({ segment, index }))
        .reverse()
        .map(({ segment, index }) =>
          index === 0 ? null : (
            <MovingPiece
              key={`seg-${index}`}
              from={startOf(index)}
              to={segment}
              progress={progress}
              size={thickness(index)}
              color={BODY_COLORS[index % 2]}
              appearing={index >= from.length}
            />
          )
        )}
      <SnakeHead from={startOf(0)} to={snake[0]} direction={direction} progress={progress} />
    </>
  );
}

/** Rond du corps qui glisse de `from` à `to` pendant le pas (animé sans re-rendu React) */
function MovingPiece({
  from,
  to,
  progress,
  size,
  color,
  appearing = false,
}: {
  from: VisualPosition;
  to: VisualPosition;
  progress: SharedValue<number>;
  size: number;
  color: string;
  appearing?: boolean; // morceau tout juste ajouté au bout de la queue : il grossit pendant le pas
}) {
  const offset = (CELL_PIXEL_SIZE - size) / 2;
  const animated = useAnimatedStyle(() => ({
    transform: [
      { translateX: (from.col + (to.col - from.col) * progress.value) * CELL_PIXEL_SIZE + offset },
      { translateY: (from.row + (to.row - from.row) * progress.value) * CELL_PIXEL_SIZE + offset },
      { scale: appearing ? 0.2 + 0.8 * progress.value : 1 },
    ],
  }));
  return (
    <Animated.View
      style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size, borderRadius: size / 2, backgroundColor: color }, animated]}
    />
  );
}

function SnakeHead({
  from,
  to,
  direction,
  progress,
}: {
  from: VisualPosition;
  to: VisualPosition;
  direction: Direction;
  progress: SharedValue<number>;
}) {
  const cell = CELL_PIXEL_SIZE;
  const [dx, dy] = PUPIL_SHIFT[direction];
  const tongueHorizontal = direction === 'left' || direction === 'right';
  const animated = useAnimatedStyle(() => ({
    transform: [
      { translateX: (from.col + (to.col - from.col) * progress.value) * cell },
      { translateY: (from.row + (to.row - from.row) * progress.value) * cell },
    ],
  }));
  return (
    <Animated.View style={[styles.cell, { left: 0, top: 0 }, animated]}>
      {/* Langue fourchue, qui dépasse devant la tête */}
      <View
        style={[
          styles.tongue,
          tongueHorizontal ? { width: 9, height: 3 } : { width: 3, height: 9 },
          direction === 'right' && { left: cell - 3, top: cell / 2 - 1.5 },
          direction === 'left' && { left: -6, top: cell / 2 - 1.5 },
          direction === 'up' && { top: -6, left: cell / 2 - 1.5 },
          direction === 'down' && { top: cell - 3, left: cell / 2 - 1.5 },
        ]}
      />
      <View style={styles.head} />
      {EYE_POSITIONS[direction].map(([x, y], i) => (
        <View key={i} style={[styles.eye, { left: x * cell - 4, top: y * cell - 4 }]}>
          <View style={[styles.pupil, { transform: [{ translateX: dx }, { translateY: dy }] }]} />
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 16,
    marginBottom: 16,
  },
  score: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  bonus: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fbbf24',
  },
  grid: {
    backgroundColor: '#16233a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a5a82',
    position: 'relative',
    overflow: 'hidden',
  },
  cell: {
    position: 'absolute',
    width: CELL_PIXEL_SIZE,
    height: CELL_PIXEL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleEmoji: {
    fontSize: CELL_PIXEL_SIZE * 0.78,
    lineHeight: CELL_PIXEL_SIZE,
  },
  head: {
    width: CELL_PIXEL_SIZE,
    height: CELL_PIXEL_SIZE,
    borderRadius: CELL_PIXEL_SIZE / 2.4,
    backgroundColor: '#16a34a',
    borderWidth: 2,
    borderColor: '#15803d',
  },
  eye: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pupil: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0f172a',
  },
  tongue: {
    position: 'absolute',
    backgroundColor: '#ef4444',
    borderRadius: 1.5,
  },
  hint: {
    fontSize: 11,
    color: '#8ea6c0',
    marginTop: 16,
    textAlign: 'center',
    maxWidth: 300,
  },
});