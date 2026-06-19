import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GameComponentProps } from '../../components/GameWrapper/types';
import {
    calculateColumnHints,
    calculateNonogramScore,
    calculateRowHints,
    createEmptyGrid,
    cycleCell,
    Grid,
    isPuzzleSolved
} from './logic';
import { getRandomNonogram } from './puzzles';

export function NonogramGame({ onGameEnd, hintsAvailable, onUseHint, difficulty }: GameComponentProps) {
  const puzzleDifficulty = difficulty === 'hard' || difficulty === 'very_hard' ? 'hard' : 'easy';
  const [puzzle] = useState(() => getRandomNonogram(puzzleDifficulty));
  const [grid, setGrid] = useState<Grid>(() => createEmptyGrid(puzzle.size));
  const startTimeRef = useRef(Date.now());
  const wrongTogglesRef = useRef(0);
  const hintsUsedRef = useRef(0);

  const rowHints = calculateRowHints(puzzle.solution);
  const columnHints = calculateColumnHints(puzzle.solution);

  const handleCellPress = (row: number, col: number) => {
    const newGrid = grid.map((r) => [...r]);
    const previousState = newGrid[row][col];
    const newState = cycleCell(previousState);
    newGrid[row][col] = newState;

    // Compte une "erreur" si on remplit une case qui ne devrait pas l'être
    if (newState === 'filled' && !puzzle.solution[row][col]) {
      wrongTogglesRef.current += 1;
    }

    setGrid(newGrid);

    if (isPuzzleSolved(newGrid, puzzle.solution)) {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const score = calculateNonogramScore(timeSpent, wrongTogglesRef.current, hintsUsedRef.current);
      setTimeout(() => onGameEnd({ success: true, score }), 400);
    }
  };

  const handleHint = () => {
    if (hintsAvailable === 0) return;
    onUseHint();
    hintsUsedRef.current += 1;

    // Révèle une case correcte aléatoire pas encore correctement remplie
    const candidates: { row: number; col: number }[] = [];
    puzzle.solution.forEach((row, r) => {
      row.forEach((shouldFill, c) => {
        if (shouldFill && grid[r][c] !== 'filled') {
          candidates.push({ row: r, col: c });
        }
      });
    });

    if (candidates.length === 0) return;
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    const newGrid = grid.map((r) => [...r]);
    newGrid[target.row][target.col] = 'filled';
    setGrid(newGrid);

    if (isPuzzleSolved(newGrid, puzzle.solution)) {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const score = calculateNonogramScore(timeSpent, wrongTogglesRef.current, hintsUsedRef.current);
      setTimeout(() => onGameEnd({ success: true, score }), 400);
    }
  };

  const cellSize = puzzle.size > 5 ? 32 : 40;
  const maxRowHintWidth = Math.max(...rowHints.map((h) => h.length)) * 16;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{puzzle.name}</Text>

      <View style={styles.gridWrapper}>
        {/* Indices de colonnes en haut */}
        <View style={[styles.cornerSpacer, { width: maxRowHintWidth }]} />
        <View style={styles.columnHintsRow}>
          {columnHints.map((hints, col) => (
            <View key={col} style={[styles.columnHintCell, { width: cellSize }]}>
              {hints.map((h, i) => (
                <Text key={i} style={styles.hintText}>{h}</Text>
              ))}
            </View>
          ))}
        </View>
      </View>

      {grid.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.gridRow}>
          <View style={[styles.rowHintCell, { width: maxRowHintWidth }]}>
            <Text style={styles.hintText}>{rowHints[rowIndex].join(' ')}</Text>
          </View>
          {row.map((cellState, colIndex) => (
            <Pressable
              key={colIndex}
              onPress={() => handleCellPress(rowIndex, colIndex)}
              style={[
                styles.cell,
                { width: cellSize, height: cellSize },
                cellState === 'filled' && styles.cellFilled,
                cellState === 'marked' && styles.cellMarked,
              ]}
            >
              {cellState === 'marked' && <Text style={styles.markedText}>✕</Text>}
            </Pressable>
          ))}
        </View>
      ))}

      <Pressable
        style={[styles.hintButton, hintsAvailable === 0 && styles.hintButtonDisabled]}
        onPress={handleHint}
        disabled={hintsAvailable === 0}
      >
        <Text style={styles.hintButtonText}>💡 Révéler une case</Text>
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
    marginBottom: 16,
  },
  gridWrapper: {
    flexDirection: 'row',
  },
  cornerSpacer: {},
  columnHintsRow: {
    flexDirection: 'row',
  },
  columnHintCell: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  gridRow: {
    flexDirection: 'row',
  },
  rowHintCell: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  hintText: {
    fontSize: 11,
    color: '#7a9ab8',
  },
  cell: {
    backgroundColor: '#0f1d2e',
    borderWidth: 0.5,
    borderColor: '#1a3050',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellFilled: {
    backgroundColor: '#a78bfa',
  },
  cellMarked: {
    backgroundColor: '#0f1d2e',
  },
  markedText: {
    color: '#3a5a7a',
    fontSize: 14,
  },
  hintButton: {
    marginTop: 24,
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