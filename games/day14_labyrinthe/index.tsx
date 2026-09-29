import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { GameComponentProps } from '../../components/GameWrapper/types';
import { useGameKeys } from '../../hooks/use-game-keys';
import { playSfx } from '../../services/sfx';
import {
    calculateMazeScore,
    Direction,
    generateMaze,
    isAtExit,
    Maze,
    placeTorches,
    Position,
    shortestPathLength,
    slidePath,
} from './logic';
import { useI18n } from '../../services/i18n';

// Labyrinthe 11×11 dans le noir : la torche n'éclaire que les cases autour du joueur (les cases déjà vues
// restent en pénombre) et se consume. Des torches à ramasser redonnent du temps. Torche éteinte = perdu.
const MAZE_SIZE = 11;
const TORCH_START_MS = 75000;
const TORCH_PICKUP_MS = 10000;
const TORCH_PICKUPS = 3;
const TORCH_MIN_DISTANCE = 8; // les torches sont à au moins 8 cases de couloir du départ
const LOW_TORCH_MS = 15000; // en dessous, la torche faiblit : on voit moins loin
const LIGHT_RADIUS = 2.3; // en cases
const LOW_LIGHT_RADIUS = 1.5;
const TIME_BONUS_PER_SECOND = 5;
const MAX_CELL_SIZE = 30;
const WALL_THICKNESS = 2;

const ARROW_DIRECTIONS: Record<string, Direction> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };

const keyOf = (p: Position) => `${p.row},${p.col}`;

/** Cases éclairées autour d'une position (la lumière passe au-dessus des murs, comme une lueur) */
function litAround(center: Position, radius: number): string[] {
  const keys: string[] = [];
  const reach = Math.ceil(radius);
  for (let row = center.row - reach; row <= center.row + reach; row++) {
    for (let col = center.col - reach; col <= center.col + reach; col++) {
      if (row < 0 || col < 0 || row >= MAZE_SIZE || col >= MAZE_SIZE) continue;
      if (Math.hypot(row - center.row, col - center.col) <= radius) keys.push(keyOf({ row, col }));
    }
  }
  return keys;
}

export function LabyrintheGame({ onGameEnd }: GameComponentProps) {
  const { tr } = useI18n();
  const cellSize = Math.min(MAX_CELL_SIZE, Math.floor((useWindowDimensions().width - 40) / MAZE_SIZE));
  const [maze] = useState<Maze>(() => generateMaze(MAZE_SIZE));
  const [optimalMoves] = useState(() => shortestPathLength(maze));
  const [torches, setTorches] = useState<Position[]>(() => placeTorches(maze, TORCH_PICKUPS, TORCH_MIN_DISTANCE));
  const [playerPosition, setPlayerPosition] = useState<Position>({ row: 0, col: 0 });
  const [explored, setExplored] = useState<Set<string>>(() => new Set(litAround({ row: 0, col: 0 }, LIGHT_RADIUS)));
  const [timeLeft, setTimeLeft] = useState(TORCH_START_MS);
  const movesCountRef = useRef(0);
  const positionRef = useRef(playerPosition);
  positionRef.current = playerPosition;
  const torchesRef = useRef(torches);
  torchesRef.current = torches;
  const deadlineRef = useRef(Date.now() + TORCH_START_MS);
  const endedRef = useRef(false);

  const lowLight = timeLeft <= LOW_TORCH_MS;
  const radius = lowLight ? LOW_LIGHT_RADIUS : LIGHT_RADIUS;

  // La torche se consume : fin de partie quand elle s'éteint
  useEffect(() => {
    const timer = setInterval(() => {
      if (endedRef.current) return;
      const left = Math.max(0, deadlineRef.current - Date.now());
      setTimeLeft(left);
      if (left <= 0) {
        endedRef.current = true;
        playSfx('failure');
        onGameEnd({ success: false, score: 0 });
      }
    }, 200);
    return () => clearInterval(timer);
  }, [onGameEnd]);

  const handleMove = useCallback(
    (direction: Direction) => {
      if (endedRef.current) return;
      // Un glissement avance jusqu'au mur, au prochain croisement ou à la sortie
      const path = slidePath(maze, positionRef.current, direction);
      if (path.length === 0) {
        playSfx('bump');
        return;
      }
      const newPosition = path[path.length - 1];
      movesCountRef.current += path.length;
      positionRef.current = newPosition;
      setPlayerPosition(newPosition);

      // Tout le trajet est éclairé au passage, et les torches croisées sont ramassées
      const lightRadius = deadlineRef.current - Date.now() <= LOW_TORCH_MS ? LOW_LIGHT_RADIUS : LIGHT_RADIUS;
      setExplored((current) => {
        const next = new Set(current);
        path.forEach((cell) => litAround(cell, lightRadius).forEach((key) => next.add(key)));
        return next;
      });
      const crossed = new Set(path.map(keyOf));
      const picked = torchesRef.current.filter((torch) => crossed.has(keyOf(torch)));
      if (picked.length > 0) {
        deadlineRef.current += picked.length * TORCH_PICKUP_MS;
        setTimeLeft(Math.max(0, deadlineRef.current - Date.now()));
        setTorches(torchesRef.current.filter((torch) => !crossed.has(keyOf(torch))));
        playSfx('correct');
      } else {
        playSfx('tap');
      }

      if (isAtExit(newPosition, MAZE_SIZE)) {
        endedRef.current = true;
        const secondsLeft = Math.ceil(Math.max(0, deadlineRef.current - Date.now()) / 1000);
        const score = calculateMazeScore(movesCountRef.current, MAZE_SIZE, optimalMoves) + secondsLeft * TIME_BONUS_PER_SECOND;
        setTimeout(() => onGameEnd({ success: true, score }), 300); // petit délai pour voir l'arrivée
      }
    },
    [maze, optimalMoves, onGameEnd]
  );

  const panGesture = Gesture.Pan().runOnJS(true).onEnd((event) => {
    const { translationX, translationY } = event;
    const threshold = 20; // évite de déclencher sur un tap accidentel
    if (Math.abs(translationX) < threshold && Math.abs(translationY) < threshold) return;

    if (Math.abs(translationX) > Math.abs(translationY)) {
      handleMove(translationX > 0 ? 'right' : 'left');
    } else {
      handleMove(translationY > 0 ? 'down' : 'up');
    }
  });

  // Sur ordi : les flèches font glisser jusqu'au prochain croisement
  useGameKeys((key, event) => {
    const direction = ARROW_DIRECTIONS[key];
    if (!direction) return false;
    if (event.repeat) return;
    handleMove(direction);
  });

  const lit = new Set(litAround(playerPosition, radius));
  const seconds = Math.ceil(timeLeft / 1000);
  const boardSize = MAZE_SIZE * cellSize;

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        <View style={[styles.torchRow, { width: boardSize }]}>
          <Text style={[styles.torchText, lowLight && styles.torchTextLow]}>
            🔥 {seconds} s{lowLight ? tr(' · la torche faiblit !', ' · the torch is fading!') : ''}
          </Text>
          <Text style={styles.torchPickups}>{tr(`Torches à trouver : ${torches.length}`, `Torches to find: ${torches.length}`)}</Text>
        </View>
        <View style={[styles.torchTrack, { width: boardSize }]}>
          <View style={[styles.torchFill, lowLight && styles.torchFillLow, { width: `${Math.min(1, timeLeft / TORCH_START_MS) * 100}%` }]} />
        </View>

        <View style={[styles.mazeContainer, { width: boardSize, height: boardSize }]}>
          {maze.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <View
                key={`${rowIndex}-${colIndex}`}
                style={[
                  styles.cell,
                  {
                    width: cellSize,
                    height: cellSize,
                    left: colIndex * cellSize,
                    top: rowIndex * cellSize,
                    borderTopWidth: cell.walls.top ? WALL_THICKNESS : 0,
                    borderRightWidth: cell.walls.right ? WALL_THICKNESS : 0,
                    borderBottomWidth: cell.walls.bottom ? WALL_THICKNESS : 0,
                    borderLeftWidth: cell.walls.left ? WALL_THICKNESS : 0,
                  },
                ]}
              />
            ))
          )}

          {/* Torches à ramasser : visibles seulement dans une zone déjà éclairée */}
          {torches
            .filter((torch) => explored.has(keyOf(torch)) || lit.has(keyOf(torch)))
            .map((torch) => (
              <View key={keyOf(torch)} style={[styles.item, { width: cellSize, height: cellSize, left: torch.col * cellSize, top: torch.row * cellSize }]}>
                <Text style={{ fontSize: cellSize * 0.55 }}>🔥</Text>
              </View>
            ))}

          {/* Brouillard : noir complet sur l'inconnu, pénombre sur ce qui a déjà été vu */}
          {maze.map((row, rowIndex) =>
            row.map((_, colIndex) => {
              const key = `${rowIndex},${colIndex}`;
              if (lit.has(key)) return null;
              return (
                <View
                  key={`fog-${key}`}
                  pointerEvents="none"
                  style={[
                    styles.fog,
                    {
                      width: cellSize + 1,
                      height: cellSize + 1,
                      left: colIndex * cellSize,
                      top: rowIndex * cellSize,
                      opacity: explored.has(key) ? 0.62 : 1,
                    },
                  ]}
                />
              );
            })
          )}

          {/* Sortie : toujours visible, pour savoir où aller */}
          <View style={[styles.item, { width: cellSize, height: cellSize, left: (MAZE_SIZE - 1) * cellSize, top: (MAZE_SIZE - 1) * cellSize }]}>
            <Text style={{ fontSize: cellSize * 0.6 }}>🎁</Text>
          </View>

          {/* Joueur, avec le halo de sa torche */}
          <View
            pointerEvents="none"
            style={[
              styles.glow,
              {
                width: cellSize * radius * 2,
                height: cellSize * radius * 2,
                borderRadius: cellSize * radius,
                left: (playerPosition.col + 0.5 - radius) * cellSize,
                top: (playerPosition.row + 0.5 - radius) * cellSize,
              },
            ]}
          />
          <View
            style={[
              styles.player,
              {
                width: cellSize - 10,
                height: cellSize - 10,
                left: playerPosition.col * cellSize,
                top: playerPosition.row * cellSize,
              },
            ]}
          />
        </View>

        <Text style={styles.hint}>
          {tr(
            'Glisse pour avancer jusqu’au prochain croisement. Trouve le 🎁 avant que la torche s’éteigne, ramasse les 🔥 pour +10 s.',
            'Swipe to move to the next junction. Reach the 🎁 before the torch goes out, grab the 🔥 for +10 s.'
          )}
        </Text>
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
  torchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  torchText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fbbf24',
  },
  torchTextLow: {
    color: '#f87171',
  },
  torchPickups: {
    fontSize: 11,
    color: '#b7c8da',
  },
  torchTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16233a',
    overflow: 'hidden',
    marginBottom: 12,
  },
  torchFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
  },
  torchFillLow: {
    backgroundColor: '#ef4444',
  },
  hint: {
    fontSize: 11,
    color: '#8ea6c0',
    marginTop: 14,
    textAlign: 'center',
    maxWidth: 340,
  },
  mazeContainer: {
    position: 'relative',
    backgroundColor: '#0c1521',
    overflow: 'hidden',
    borderRadius: 4,
  },
  cell: {
    position: 'absolute',
    borderColor: '#8ea6c0',
  },
  fog: {
    position: 'absolute',
    backgroundColor: '#03060b',
  },
  item: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    backgroundColor: 'rgba(251, 191, 36, 0.10)',
  },
  player: {
    position: 'absolute',
    margin: 5,
    borderRadius: 8,
    backgroundColor: '#a78bfa',
  },
});
