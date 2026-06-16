import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GameComponentProps } from '../../components/GameWrapper/types';
import { calculateSudokuScore, Grid, isSolved, revealRandomCell, SudokuPuzzle } from './logic';
import { generateSudokuPuzzle, SudokuDifficulty } from './puzzles';

interface SudokuGameProps extends Omit<GameComponentProps, 'difficulty'> {
  difficulty?: SudokuDifficulty;
}

export function SudokuGame({ onGameEnd, hintsAvailable, onUseHint, difficulty = 'easy' }: SudokuGameProps) {
  const [puzzle, setPuzzle] = useState<SudokuPuzzle>(() => generateSudokuPuzzle(difficulty));
  const [grid, setGrid] = useState<Grid>(() => puzzle.initialGrid.map((row) => [...row]));
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [hintsUsedThisGame, setHintsUsedThisGame] = useState(0);
  const startTimeRef = useRef(Date.now());

  const isOriginalCell = (row: number, col: number) => puzzle.initialGrid[row][col] !== null;

  const handleCellPress = (row: number, col: number) => {
    if (isOriginalCell(row, col)) return;
    setSelectedCell({ row, col });
  };

  const checkAndFinish = (newGrid: Grid, hintsUsed: number) => {
    if (isSolved(newGrid, puzzle.gridSize)) {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const score = calculateSudokuScore(timeSpent, hintsUsed);
      onGameEnd({ success: true, score });
    }
  };

  const handleNumberPress = (value: number) => {
    if (!selectedCell) return;
    const newGrid = grid.map((row) => [...row]);
    newGrid[selectedCell.row][selectedCell.col] = value;
    setGrid(newGrid);
    checkAndFinish(newGrid, hintsUsedThisGame);
  };

  const handleClearCell = () => {
    if (!selectedCell) return;
    const newGrid = grid.map((row) => [...row]);
    newGrid[selectedCell.row][selectedCell.col] = null;
    setGrid(newGrid);
  };

  const handleHint = () => {
    if (hintsAvailable === 0) return;
    const revealed = revealRandomCell(grid, puzzle.solution);
    if (!revealed) return;

    onUseHint();
    const newHintsUsed = hintsUsedThisGame + 1;
    setHintsUsedThisGame(newHintsUsed);

    const newGrid = grid.map((row) => [...row]);
    newGrid[revealed.row][revealed.col] = revealed.value;
    setGrid(newGrid);
    checkAndFinish(newGrid, newHintsUsed);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Sudoku 9×9</Text>

      <View style={styles.grid}>
        {grid.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => {
              const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
              const isOriginal = isOriginalCell(rowIndex, colIndex);
              const isThickRight = colIndex === 2 || colIndex === 5;
              const isThickBottom = rowIndex === 2 || rowIndex === 5;

              return (
                <Pressable
                  key={colIndex}
                  onPress={() => handleCellPress(rowIndex, colIndex)}
                  style={[
                    styles.cell,
                    isOriginal && styles.cellOriginal,
                    isSelected && styles.cellSelected,
                    isThickRight && styles.thickRightBorder,
                    isThickBottom && styles.thickBottomBorder,
                  ]}
                >
                  <Text style={[styles.cellText, isOriginal && styles.cellTextOriginal]}>
                    {cell ?? ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.numberPad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <Pressable key={num} style={styles.numberButton} onPress={() => handleNumberPress(num)}>
            <Text style={styles.numberButtonText}>{num}</Text>
          </Pressable>
        ))}
        <Pressable style={styles.numberButton} onPress={handleClearCell}>
          <Text style={styles.numberButtonText}>✕</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.hintButton, hintsAvailable === 0 && styles.hintButtonDisabled]}
        onPress={handleHint}
        disabled={hintsAvailable === 0}
      >
        <Text style={styles.hintButtonText}>💡 Révéler une case</Text>
      </Pressable>
    </ScrollView>
  );
}

const CELL_SIZE = 36; // plus petit qu'en 4x4 pour que 9 colonnes tiennent à l'écran

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  grid: {
    borderWidth: 2,
    borderColor: '#7c3aed',
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#1a3050',
    backgroundColor: '#0f1d2e',
  },
  cellOriginal: {
    backgroundColor: '#162540',
  },
  cellSelected: {
    backgroundColor: '#2d1b54',
    borderColor: '#7c3aed',
    borderWidth: 1.5,
  },
  thickRightBorder: {
    borderRightWidth: 2,
    borderRightColor: '#7c3aed',
  },
  thickBottomBorder: {
    borderBottomWidth: 2,
    borderBottomColor: '#7c3aed',
  },
  cellText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c4b5fd',
  },
  cellTextOriginal: {
    color: '#7a9ab8',
  },
  numberPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 20,
    justifyContent: 'center',
    maxWidth: 320,
  },
  numberButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#1a2e44',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  hintButton: {
    marginTop: 20,
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