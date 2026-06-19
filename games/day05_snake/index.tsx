import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { GameComponentProps } from '../../components/GameWrapper/types';
import {
    advanceSnake,
    calculateFinalScore,
    createInitialState,
    Direction,
    isOppositeDirection,
    SnakeState,
} from './logic';

const GRID_SIZE = 10;
const TICK_SLOW_MS = 240;
const TICK_FAST_MS = 80;
const GAME_DURATION_SECONDS = 45;
const CELL_PIXEL_SIZE = 28;

function getTickInterval(timeLeft: number): number {
  const ratio = timeLeft / GAME_DURATION_SECONDS;
  return Math.round(TICK_FAST_MS + (TICK_SLOW_MS - TICK_FAST_MS) * ratio);
}

export function SnakeGame({ onGameEnd }: GameComponentProps) {
  const [gameState, setGameState] = useState<SnakeState>(() => createInitialState(GRID_SIZE));
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SECONDS);
  const directionRef = useRef<Direction>('right');
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  useEffect(() => {
    const id = setInterval(() => {
      setGameState((prev) => advanceSnake({ ...prev, direction: directionRef.current }));
    }, getTickInterval(timeLeft));

    return () => clearInterval(id);
  }, [timeLeft]);

  // Mort par collision avec soi-même
  useEffect(() => {
    if (gameState.isDead) {
      const finalScore = calculateFinalScore(gameState.score);
      onGameEnd({ success: gameState.score > 0, score: finalScore });
    }
  }, [gameState.isDead]);

  // Timer de fin de partie
  useEffect(() => {
    const countdown = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          const finalScore = calculateFinalScore(gameStateRef.current.score);
          onGameEnd({ success: gameStateRef.current.score > 0, score: finalScore });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [onGameEnd]);

  const changeDirection = useCallback((newDirection: Direction) => {
    if (isOppositeDirection(directionRef.current, newDirection)) return; // empêche le demi-tour
    directionRef.current = newDirection;
  }, []);

  // Détection de swipe pour changer de direction
  const panGesture = Gesture.Pan().runOnJS(true).onEnd((event) => {
    const { translationX, translationY } = event;
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
          <Text style={styles.score}>🍎 {gameState.score}</Text>
          <Text style={styles.timer}>⏱ {timeLeft}s</Text>
        </View>

        <View style={[styles.grid, { width: GRID_SIZE * CELL_PIXEL_SIZE, height: GRID_SIZE * CELL_PIXEL_SIZE }]}>
          {/* Pomme */}
          <View
            style={[
              styles.apple,
              {
                left: gameState.apple.col * CELL_PIXEL_SIZE,
                top: gameState.apple.row * CELL_PIXEL_SIZE,
              },
            ]}
          />
          {/* Corps du serpent */}
          {gameState.snake.map((segment, index) => (
            <View
              key={index}
              style={[
                styles.snakeSegment,
                index === 0 && styles.snakeHead,
                {
                  left: segment.col * CELL_PIXEL_SIZE,
                  top: segment.row * CELL_PIXEL_SIZE,
                },
              ]}
            />
          ))}
        </View>

        <Text style={styles.hint}>Glisse ton doigt pour diriger le serpent</Text>
      </View>
    </GestureDetector>
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
    gap: 24,
    marginBottom: 16,
  },
  score: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  timer: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f59e0b',
  },
  grid: {
    backgroundColor: '#0f1d2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a3050',
    position: 'relative',
    overflow: 'hidden',
  },
  apple: {
    position: 'absolute',
    width: CELL_PIXEL_SIZE - 4,
    height: CELL_PIXEL_SIZE - 4,
    margin: 2,
    borderRadius: 6,
    backgroundColor: '#ef4444',
  },
  snakeSegment: {
    position: 'absolute',
    width: CELL_PIXEL_SIZE - 2,
    height: CELL_PIXEL_SIZE - 2,
    margin: 1,
    borderRadius: 4,
    backgroundColor: '#34d399',
  },
  snakeHead: {
    backgroundColor: '#10b981',
  },
  hint: {
    fontSize: 11,
    color: '#3a5a7a',
    marginTop: 16,
  },
});