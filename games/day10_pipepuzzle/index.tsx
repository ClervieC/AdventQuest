import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GameComponentProps } from '../../components/GameWrapper/types';
import { playSfx } from '../../services/sfx';
import { calculatePipeScore, connectedFrom, isPathConnected, PipeTile, rotateTile } from './logic';
import { generatePipePuzzle, PIPE_SIZE_BY_DIFFICULTY } from './puzzles';

const PIPE_SYMBOLS: Record<string, string> = {
  straight: '┃',
  corner: '┗',
  tjunction: '┻',
  cross: '╋',
  empty: '·',
};

export function PipePuzzleGame({ onGameEnd, hintsAvailable, onUseHint, difficulty = 'easy' }: GameComponentProps) {
  // Nouvelle grille à chaque partie, plus grande selon la difficulté
  const [puzzle] = useState(() => generatePipePuzzle(PIPE_SIZE_BY_DIFFICULTY[difficulty]));
  const [grid, setGrid] = useState<PipeTile[][]>(() => puzzle.grid.map((row) => row.map((t) => ({ ...t }))));
  const { width } = useWindowDimensions();
  const cellSize = Math.min(64, Math.floor((Math.min(width, 520) - 48) / puzzle.gridSize));
  const flowing = connectedFrom(grid, puzzle.start);
  const rotationsCountRef = useRef(0);
  const hintsUsedRef = useRef(0);

  const handleTilePress = (row: number, col: number) => {
    if (grid[row][col].type === 'empty') return; // rien à tourner

    const newGrid = grid.map((r) => r.map((t) => ({ ...t })));
    newGrid[row][col] = rotateTile(newGrid[row][col]);
    playSfx('rotate');
    setGrid(newGrid);
    rotationsCountRef.current += 1;

    if (isPathConnected(newGrid, puzzle.start, puzzle.end)) {
      const score = calculatePipeScore(rotationsCountRef.current, hintsUsedRef.current);
      onGameEnd({ success: true, score });
    }
  };

  // Indice : place dans la bonne position une tuile du chemin qui est encore mal tournée
  const handleHint = () => {
    if (hintsAvailable === 0) return;
    const wrong = puzzle.path.filter(({ row, col }) => grid[row][col].rotation !== puzzle.solution[row][col].rotation);
    if (wrong.length === 0) return;
    const { row, col } = wrong[Math.floor(Math.random() * wrong.length)];
    onUseHint();
    hintsUsedRef.current += 1;
    playSfx('place');
    const newGrid = grid.map((r) => r.map((t) => ({ ...t })));
    newGrid[row][col] = { ...puzzle.solution[row][col] };
    setGrid(newGrid);
    if (isPathConnected(newGrid, puzzle.start, puzzle.end)) {
      onGameEnd({ success: true, score: calculatePipeScore(rotationsCountRef.current, hintsUsedRef.current) });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connecte la Source à la Sortie</Text>
      <Text style={styles.subtitle}>Touche un tuyau pour le tourner · les tuyaux reliés à la Source s’allument en vert</Text>

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
                    { width: cellSize, height: cellSize },
                    isStart && styles.cellStart,
                    isEnd && styles.cellEnd,
                  ]}
                >
                  <Text
                    style={[
                      styles.cellSymbol,
                      { fontSize: Math.round(cellSize * 0.45), transform: [{ rotate: `${tile.rotation * 90}deg` }] },
                      flowing.has(`${rowIndex},${colIndex}`) && tile.type !== 'empty' && styles.cellSymbolFlowing,
                    ]}
                  >
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
  },
  subtitle: {
    fontSize: 12,
    color: '#b7c8da',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
    paddingHorizontal: 12,
  },
  grid: {
    borderWidth: 1,
    borderColor: '#3a5a82',
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
    borderColor: '#3a5a82',
    backgroundColor: '#16233a',
  },
  cellStart: {
    backgroundColor: '#12301f',
  },
  cellEnd: {
    backgroundColor: '#2a2208',
  },
  cellSymbol: {
    fontSize: 28,
    color: '#a78bfa',
  },
  // Tuyaux déjà reliés à la source : le flux avance
  cellSymbolFlowing: {
    color: '#34d399',
  },
  cellLabel: {
    position: 'absolute',
    bottom: 2,
    fontSize: 7,
    color: '#b7c8da',
  },
  hintButton: {
    marginTop: 28,
    backgroundColor: '#2a2208',
    borderColor: '#6b5410',
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