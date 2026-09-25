import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GameComponentProps } from '../../components/GameWrapper/types';
import { playSfx } from '../../services/sfx';
import {
  calculateSudokuScore,
  completedNumbers,
  Grid,
  isSolved,
  revealRandomCell,
  SudokuPuzzle,
} from './logic';
import { generateSudokuPuzzle, SudokuDifficulty } from './puzzles';

interface SudokuGameProps extends GameComponentProps {
  difficulty?: SudokuDifficulty;
}

export function SudokuGame({ onGameEnd, hintsAvailable, onUseHint, difficulty = 'easy' }: SudokuGameProps) {
  const [puzzle, setPuzzle] = useState<SudokuPuzzle>(() => generateSudokuPuzzle(difficulty));
  const [grid, setGrid] = useState<Grid>(() => puzzle.initialGrid.map((row) => [...row]));
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [hintsUsedThisGame, setHintsUsedThisGame] = useState(0);
  const startTimeRef = useRef(Date.now());

  const finished = completedNumbers(grid, puzzle.gridSize);

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
    playSfx('place');
    setGrid(newGrid);
    checkAndFinish(newGrid, hintsUsedThisGame);
  };

  const handleClearCell = () => {
    if (!selectedCell) return;
    const newGrid = grid.map((row) => [...row]);
    newGrid[selectedCell.row][selectedCell.col] = null;
    playSfx('tap');
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
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          // Chiffre posé 9 fois : grisé pour voir d'un coup d'œil lesquels sont finis
          const done = finished.has(num);
          return (
            <Pressable
              key={num}
              style={[styles.numberButton, done && styles.numberButtonDone]}
              onPress={() => handleNumberPress(num)}
              accessibilityLabel={done ? `${num}, déjà posé 9 fois` : `Poser ${num}`}
            >
              <Text style={[styles.numberButtonText, done && styles.numberButtonTextDone]}>{num}</Text>
            </Pressable>
          );
        })}
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
    borderColor: '#3a5a82',
    backgroundColor: '#16233a',
  },
  cellOriginal: {
    backgroundColor: '#243a5a',
  },
  cellSelected: {
    backgroundColor: '#3d2a78',
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
    color: '#b7c8da',
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
    backgroundColor: '#2c4262',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButtonDone: {
    backgroundColor: '#16233a',
    opacity: 0.45,
  },
  numberButtonTextDone: {
    color: '#8ea6c0',
    textDecorationLine: 'line-through',
  },
  numberButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  hintButton: {
    marginTop: 20,
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