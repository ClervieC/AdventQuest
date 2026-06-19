import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GameComponentProps } from '../../components/GameWrapper/types';
import { calculatePipeScore, isPathConnected, PipeTile, rotateTile } from './logic';
import { PIPE_PUZZLE_EASY } from './puzzles';

const PIPE_SYMBOLS: Record<string, string> = {
  straight: '┃',
  corner: '┗',
  tjunction: '┻',
  cross: '╋',
  empty: '·',
};

export function PipePuzzleGame({ onGameEnd, hintsAvailable, onUseHint }: GameComponentProps) {
  const puzzle = PIPE_PUZZLE_EASY;
  const [grid, setGrid] = useState<PipeTile[][]>(() => puzzle.grid.map((row) => row.map((t) => ({ ...t }))));
  const rotationsCountRef = useRef(0);
  const hintsUsedRef = useRef(0);

  const handleTilePress = (row: number, col: number) => {
    if (grid[row][col].type === 'empty') return; // rien à tourner

    const newGrid = grid.map((r) => r.map((t) => ({ ...t })));
    newGrid[row][col] = rotateTile(newGrid[row][col]);
    setGrid(newGrid);
    rotationsCountRef.current += 1;

    if (isPathConnected(newGrid, puzzle.start, puzzle.end)) {
      const score = calculatePipeScore(rotationsCountRef.current, hintsUsedRef.current);
      onGameEnd({ success: true, score });
    }
  };

  const handleHint = () => {
    if (hintsAvailable === 0) return;
    onUseHint();
    hintsUsedRef.current += 1;
    // Hint simple : indique visuellement la case de départ et d'arrivée (déjà visibles ici,
    // donc pour ce jeu le hint pourrait plutôt révéler la bonne rotation d'une tuile au hasard.
    // Implémentation simplifiée pour le MVP : on ne fait que décompter le hint pour l'instant.
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connecte le flux magique</Text>

      <View style={styles.grid}>
        {grid.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((tile, colIndex) => {
              const isStart = puzzle.start.row === rowIndex && puzzle.start.col === colIndex;
              const isEnd = puzzle.end.row === rowIndex && puzzle.end.col === colIndex;

              return (
                <Pressable
                  key={colIndex}
                  onPress={() => handleTilePress(rowIndex, colIndex)}
                  style={[
                    styles.cell,
                    isStart && styles.cellStart,
                    isEnd && styles.cellEnd,
                  ]}
                >
                  <Text style={[styles.cellSymbol, { transform: [{ rotate: `${tile.rotation * 90}deg` }] }]}>
                    {PIPE_SYMBOLS[tile.type]}
                  </Text>
                  {isStart && <Text style={styles.cellLabel}>Source</Text>}
                  {isEnd && <Text style={styles.cellLabel}>Sortie</Text>}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <Pressable
        style={[styles.hintButton, hintsAvailable === 0 && styles.hintButtonDisabled]}
        onPress={handleHint}
        disabled={hintsAvailable === 0}
      >
        <Text style={styles.hintButtonText}>💡 Indice</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 24,
  },
  grid: {
    borderWidth: 1,
    borderColor: '#1a3050',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#1a3050',
    backgroundColor: '#0f1d2e',
  },
  cellStart: {
    backgroundColor: '#0d2218',
  },
  cellEnd: {
    backgroundColor: '#1a1500',
  },
  cellSymbol: {
    fontSize: 28,
    color: '#a78bfa',
  },
  cellLabel: {
    position: 'absolute',
    bottom: 2,
    fontSize: 7,
    color: '#7a9ab8',
  },
  hintButton: {
    marginTop: 28,
    backgroundColor: '#1a1500',
    borderColor: '#3d3000',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  hintButtonDisabled: {
    opacity: 0.3,
  },
  hintButtonText: {
    color: '#f59e0b',
    fontSize: 12,
  },
});