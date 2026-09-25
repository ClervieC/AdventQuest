import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { GameComponentProps } from '../../components/GameWrapper/types';
import { playSfx } from '../../services/sfx';
import {
    slideMove,
    calculateMazeScore,
    Direction,
    generateMaze,
    isAtExit,
    Maze,
    Position,
} from './logic';

const MAZE_SIZE = 8;
const CELL_PIXEL_SIZE = 32;
const WALL_THICKNESS = 2;

export function LabyrintheGame({ onGameEnd }: GameComponentProps) {
  const [maze] = useState<Maze>(() => generateMaze(MAZE_SIZE));
  const [playerPosition, setPlayerPosition] = useState<Position>({ row: 0, col: 0 });
  const movesCountRef = useRef(0);
  const positionRef = useRef(playerPosition);
  positionRef.current = playerPosition;

  const handleMove = useCallback(
    (direction: Direction) => {
      // Un glissement avance jusqu'au mur, au prochain croisement ou à la sortie
      const current = positionRef.current;
      const { position: newPosition, steps } = slideMove(maze, current, direction);

      // si la position a réellement changé, on compte les cases parcourues ; sinon on a heurté un mur
      if (steps > 0) {
        movesCountRef.current += steps;
        playSfx('tap');
        positionRef.current = newPosition;
        setPlayerPosition(newPosition);

        if (isAtExit(newPosition, MAZE_SIZE)) {
          const score = calculateMazeScore(movesCountRef.current, MAZE_SIZE);
          setTimeout(() => onGameEnd({ success: true, score }), 300); // petit délai pour voir l'arrivée
        }
      } else {
        playSfx('bump');
      }
    },
    [maze, onGameEnd]
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

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        <Text style={styles.hint}>Glisse pour te déplacer jusqu&apos;à la sortie 🎁</Text>

        <View style={[styles.mazeContainer, { width: MAZE_SIZE * CELL_PIXEL_SIZE, height: MAZE_SIZE * CELL_PIXEL_SIZE }]}>
          {maze.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <View
                key={`${rowIndex}-${colIndex}`}
                style={[
                  styles.cell,
                  {
                    left: colIndex * CELL_PIXEL_SIZE,
                    top: rowIndex * CELL_PIXEL_SIZE,
                    borderTopWidth: cell.walls.top ? WALL_THICKNESS : 0,
                    borderRightWidth: cell.walls.right ? WALL_THICKNESS : 0,
                    borderBottomWidth: cell.walls.bottom ? WALL_THICKNESS : 0,
                    borderLeftWidth: cell.walls.left ? WALL_THICKNESS : 0,
                  },
                ]}
              />
            ))
          )}

          {/* Sortie */}
          <View
            style={[
              styles.exit,
              {
                left: (MAZE_SIZE - 1) * CELL_PIXEL_SIZE,
                top: (MAZE_SIZE - 1) * CELL_PIXEL_SIZE,
              },
            ]}
          >
            <Text style={styles.exitEmoji}>🎁</Text>
          </View>

          {/* Joueur */}
          <View
            style={[
              styles.player,
              {
                left: playerPosition.col * CELL_PIXEL_SIZE,
                top: playerPosition.row * CELL_PIXEL_SIZE,
              },
            ]}
          />
        </View>
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
  hint: {
    fontSize: 12,
    color: '#b7c8da',
    marginBottom: 16,
    textAlign: 'center',
  },
  mazeContainer: {
    position: 'relative',
    backgroundColor: '#0c1521',
  },
  cell: {
    position: 'absolute',
    width: CELL_PIXEL_SIZE,
    height: CELL_PIXEL_SIZE,
    borderColor: '#8ea6c0',
  },
  exit: {
    position: 'absolute',
    width: CELL_PIXEL_SIZE,
    height: CELL_PIXEL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitEmoji: {
    fontSize: 18,
  },
  player: {
    position: 'absolute',
    width: CELL_PIXEL_SIZE - 10,
    height: CELL_PIXEL_SIZE - 10,
    margin: 5,
    borderRadius: 8,
    backgroundColor: '#a78bfa',
  },
});