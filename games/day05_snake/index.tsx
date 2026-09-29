import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { GameComponentProps } from '../../components/GameWrapper/types';
import { useGameKeys } from '../../hooks/use-game-keys';
import { playSfx } from '../../services/sfx';
import {
    advanceSnake,
    calculateFinalScore,
    createInitialState,
    Direction,
    getTickInterval,
    isSnakeSuccess,
    MIN_APPLES,
    queueTurn,
    SnakeState,
} from './logic';
import { useI18n } from '../../services/i18n';

const GRID_SIZE = 10;
const ARROW_DIRECTIONS: Record<string, Direction> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
const CELL_PIXEL_SIZE = 28;
const PAD_BUTTON = 58;

// Pas de chrono : la partie dure tant que la guirlande ne se mord pas la queue.
// Au moins MIN_APPLES pommes pour gagner le fragment ; chaque pomme accélère (voir logic.ts).
export function SnakeGame({ onGameEnd }: GameComponentProps) {
  const { tr } = useI18n();
  const [gameState, setGameState] = useState<SnakeState>(() => createInitialState(GRID_SIZE));
  // Virages demandés en attente : un par pas du serpent (voir queueTurn)
  const turnsRef = useRef<Direction[]>([]);
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  useEffect(() => {
    const id = setInterval(() => {
      const [next, ...rest] = turnsRef.current;
      turnsRef.current = rest;
      const direction = next ?? gameStateRef.current.direction;
      setGameState((prev) => advanceSnake({ ...prev, direction }));
    }, getTickInterval(gameState.score));

    return () => clearInterval(id);
  }, [gameState.score]);

  // Bruitage quand le serpent mange une pomme (le score augmente), fanfare à l'objectif
  const lastScoreRef = useRef(gameState.score);
  useEffect(() => {
    if (gameState.score > lastScoreRef.current) playSfx(gameState.score === MIN_APPLES ? 'victory' : 'eat');
    lastScoreRef.current = gameState.score;
  }, [gameState.score]);

  // Fin : collision avec soi-même, ou grille entièrement remplie (partie parfaite)
  useEffect(() => {
    if (gameState.isDead || gameState.isFull) {
      // Pommes au-delà du minimum = bonus (non plafonné)
      onGameEnd({
        success: isSnakeSuccess(gameState.score),
        score: calculateFinalScore(gameState.score),
        bonus: calculateFinalScore(Math.max(0, gameState.score - MIN_APPLES)),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.isDead, gameState.isFull]);

  const changeDirection = useCallback((newDirection: Direction) => {
    // Jamais de demi-tour, même avec deux appuis rapides entre deux pas
    turnsRef.current = queueTurn(turnsRef.current, gameStateRef.current.direction, newDirection);
  }, []);

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

  return (
    <GestureDetector gesture={panGesture}>
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
          <SnakeBody snake={gameState.snake} direction={gameState.direction} />
        </View>

        {/* Croix directionnelle : sur Android, glisser vers la droite depuis le bord ramène à la page précédente
            du navigateur. Les boutons réagissent dès qu'on pose le doigt (onPressIn), sans attendre qu'on le lève. */}
        <View style={styles.pad}>
          <DirectionButton direction="up" onPress={changeDirection} />
          <View style={styles.padRow}>
            <DirectionButton direction="left" onPress={changeDirection} />
            <View style={styles.padCenter} />
            <DirectionButton direction="right" onPress={changeDirection} />
          </View>
          <DirectionButton direction="down" onPress={changeDirection} />
        </View>

        <Text style={styles.hint}>
          {tr(
            `Flèches ou glisser pour diriger. Au moins ${MIN_APPLES} pommes, puis continue tant que tu ne te mords pas la queue : ça accélère !`,
            `Arrows or swipe to steer. At least ${MIN_APPLES} apples, then keep going until you bite your tail: it speeds up!`
          )}
        </Text>
      </View>
    </GestureDetector>
  );
}

const ARROWS: Record<Direction, string> = { up: '▲', down: '▼', left: '◀', right: '▶' };
const ARROW_LABELS: Record<Direction, { fr: string; en: string }> = {
  up: { fr: 'Haut', en: 'Up' },
  down: { fr: 'Bas', en: 'Down' },
  left: { fr: 'Gauche', en: 'Left' },
  right: { fr: 'Droite', en: 'Right' },
};

function DirectionButton({ direction, onPress, style }: { direction: Direction; onPress: (d: Direction) => void; style?: object }) {
  const { l } = useI18n();
  return (
    <Pressable
      onPressIn={() => onPress(direction)}
      accessibilityRole="button"
      accessibilityLabel={l(ARROW_LABELS[direction])}
      hitSlop={6}
      style={({ pressed }) => [styles.padButton, pressed && styles.padButtonPressed, style]}
    >
      <Text style={styles.padArrow}>{ARROWS[direction]}</Text>
    </Pressable>
  );
}

// Serpent dessiné : anneaux verts reliés entre eux, qui s'affinent vers la queue, et une tête avec des yeux
// qui regardent dans la direction du mouvement et une petite langue
const BODY_COLORS = ['#22c55e', '#34d399'];
const EYE_POSITIONS: Record<Direction, [number, number][]> = {
  right: [[0.62, 0.26], [0.62, 0.74]],
  left: [[0.38, 0.26], [0.38, 0.74]],
  up: [[0.26, 0.38], [0.74, 0.38]],
  down: [[0.26, 0.62], [0.74, 0.62]],
};
const PUPIL_SHIFT: Record<Direction, [number, number]> = { right: [1.5, 0], left: [-1.5, 0], up: [0, -1.5], down: [0, 1.5] };

function SnakeBody({ snake, direction }: { snake: SnakeState['snake']; direction: Direction }) {
  const cell = CELL_PIXEL_SIZE;
  const count = snake.length;
  // Épaisseur de chaque anneau : pleine près de la tête, 60 % au bout de la queue
  const thickness = (index: number) => Math.round(cell * (0.86 - (count > 1 ? (0.3 * index) / (count - 1) : 0)));

  return (
    <>
      {/* Liaisons entre deux anneaux voisins (pas quand le serpent traverse un bord) */}
      {snake.slice(1).map((segment, i) => {
        const previous = snake[i];
        const dRow = previous.row - segment.row;
        const dCol = previous.col - segment.col;
        if (Math.abs(dRow) + Math.abs(dCol) !== 1) return null;
        const size = thickness(i + 1);
        const horizontal = dRow === 0;
        return (
          <View
            key={`link-${i}`}
            style={{
              position: 'absolute',
              backgroundColor: BODY_COLORS[(i + 1) % 2],
              left: (Math.min(segment.col, previous.col) + 0.5) * cell - (horizontal ? 0 : size / 2),
              top: (Math.min(segment.row, previous.row) + 0.5) * cell - (horizontal ? size / 2 : 0),
              width: horizontal ? cell : size,
              height: horizontal ? size : cell,
            }}
          />
        );
      })}
      {/* Anneaux du corps, de la queue vers la tête (la tête passe par-dessus) */}
      {snake
        .map((segment, index) => ({ segment, index }))
        .reverse()
        .map(({ segment, index }) => {
          if (index === 0) return null;
          const size = thickness(index);
          return (
            <View
              key={`seg-${index}`}
              style={{
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: BODY_COLORS[index % 2],
                left: segment.col * cell + (cell - size) / 2,
                top: segment.row * cell + (cell - size) / 2,
              }}
            />
          );
        })}
      <SnakeHead position={snake[0]} direction={direction} />
    </>
  );
}

function SnakeHead({ position, direction }: { position: SnakeState['snake'][number]; direction: Direction }) {
  const cell = CELL_PIXEL_SIZE;
  const [dx, dy] = PUPIL_SHIFT[direction];
  const tongueHorizontal = direction === 'left' || direction === 'right';
  return (
    <View style={[styles.cell, { left: position.col * cell, top: position.row * cell }]}>
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
    </View>
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
  pad: {
    marginTop: 14,
    alignItems: 'center',
    gap: 6,
  },
  padRow: {
    flexDirection: 'row',
    gap: 6,
  },
  padCenter: {
    width: PAD_BUTTON,
    height: PAD_BUTTON,
  },
  padButton: {
    width: PAD_BUTTON,
    height: PAD_BUTTON,
    borderRadius: 16,
    backgroundColor: '#16233a',
    borderWidth: 1,
    borderColor: '#3a5a82',
    alignItems: 'center',
    justifyContent: 'center',
  },
  padButtonPressed: {
    backgroundColor: '#2e1a5c',
    borderColor: '#a78bfa',
  },
  padArrow: {
    fontSize: 22,
    color: '#c4b5fd',
  },
  hint: {
    fontSize: 11,
    color: '#8ea6c0',
    marginTop: 16,
    textAlign: 'center',
    maxWidth: 300,
  },
});