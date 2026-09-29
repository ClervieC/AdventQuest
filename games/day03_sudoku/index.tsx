import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GameComponentProps } from '../../components/GameWrapper/types';
import { NewGameButton } from '../../components/NewGameButton';
import { useGameKeys } from '../../hooks/use-game-keys';
import { useGameSaveLoad, useGameSaveWriter } from '../../services/gameSave';
import { playSfx } from '../../services/sfx';
import {
  calculateSudokuScore,
  clearNotesAfterPlacement,
  completedNumbers,
  emptyNotes,
  Grid,
  Notes,
  isSolved,
  revealRandomCell,
  SudokuPuzzle,
  toggleNote,
} from './logic';
import { generateSudokuPuzzle, SudokuDifficulty } from './puzzles';
import { useI18n } from '../../services/i18n';

interface SudokuGameProps extends GameComponentProps {
  difficulty?: SudokuDifficulty;
}

/** Partie en cours sauvegardée : on la retrouve en revenant sur le jour */
interface SudokuSave {
  puzzle: SudokuPuzzle;
  grid: Grid;
  notes: Notes;
  hintsUsed: number;
  elapsedSeconds: number;
}

const ARROW_DELTAS: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };

export function SudokuGame(props: SudokuGameProps) {
  const saveId = props.saveId ?? `sudoku-${props.difficulty ?? 'easy'}`;
  const load = useGameSaveLoad<SudokuSave>(saveId);
  // Incrémenté à chaque « Nouvelle partie » : recrée la grille à neuf
  const [round, setRound] = useState(0);

  if (load.status === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#a78bfa" />
      </View>
    );
  }
  return (
    <SudokuBoard
      key={round}
      {...props}
      saveId={saveId}
      saved={round === 0 ? load.saved : null}
      onNewGame={() => setRound((r) => r + 1)}
    />
  );
}

function SudokuBoard({
  onGameEnd,
  hintsAvailable,
  onUseHint,
  difficulty = 'easy',
  saveId,
  saved,
  onNewGame,
}: SudokuGameProps & { saveId: string; saved: SudokuSave | null; onNewGame: () => void }) {
  const { tr } = useI18n();
  const [puzzle] = useState<SudokuPuzzle>(() => saved?.puzzle ?? generateSudokuPuzzle(difficulty));
  const [grid, setGrid] = useState<Grid>(() => saved?.grid ?? puzzle.initialGrid.map((row) => [...row]));
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [hintsUsedThisGame, setHintsUsedThisGame] = useState(saved?.hintsUsed ?? 0);
  // Mode notes : les chiffres s'écrivent en petit comme solutions possibles de la case
  const [notesMode, setNotesMode] = useState(false);
  const [notes, setNotes] = useState<Notes>(() => saved?.notes ?? emptyNotes(puzzle.gridSize));
  // Le chrono reprend là où il s'était arrêté (le temps passé hors du jeu ne compte pas)
  const startTimeRef = useRef(Date.now() - (saved?.elapsedSeconds ?? 0) * 1000);
  const finishedRef = useRef(false);
  const saver = useGameSaveWriter<SudokuSave>(saveId);

  // Sauvegarde à chaque changement de la grille ou des notes
  useEffect(() => {
    if (finishedRef.current) return;
    const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
    saver.write({ puzzle, grid, notes, hintsUsed: hintsUsedThisGame, elapsedSeconds });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, notes, hintsUsedThisGame]);

  const handleNewGame = () => {
    saver.clear();
    onNewGame();
  };

  const finished = completedNumbers(grid, puzzle.gridSize);

  const isOriginalCell = (row: number, col: number) => puzzle.initialGrid[row][col] !== null;

  const handleCellPress = (row: number, col: number) => {
    if (isOriginalCell(row, col)) return;
    setSelectedCell({ row, col });
  };

  const checkAndFinish = (newGrid: Grid, hintsUsed: number) => {
    if (isSolved(newGrid, puzzle.gridSize)) {
      // Grille gagnée : plus de sauvegarde, la prochaine fois ce sera une nouvelle grille
      finishedRef.current = true;
      saver.clear();
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const score = calculateSudokuScore(timeSpent, hintsUsed);
      onGameEnd({ success: true, score });
    }
  };

  const handleNumberPress = (value: number) => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    if (notesMode) {
      // Une note n'a de sens que dans une case encore vide
      if (grid[row][col] !== null) return;
      playSfx('tap');
      setNotes(toggleNote(notes, row, col, value));
      return;
    }
    const newGrid = grid.map((r) => [...r]);
    newGrid[row][col] = value;
    playSfx('place');
    setGrid(newGrid);
    setNotes(clearNotesAfterPlacement(notes, row, col, value, puzzle.gridSize));
    checkAndFinish(newGrid, hintsUsedThisGame);
  };

  const handleClearCell = () => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    playSfx('tap');
    if (grid[row][col] === null) {
      // Case déjà vide : on efface ses notes
      setNotes(notes.map((cells, r) => cells.map((cell, c) => (r === row && c === col ? [] : cell))));
      return;
    }
    const newGrid = grid.map((r) => [...r]);
    newGrid[row][col] = null;
    setGrid(newGrid);
  };

  // Sur ordi : flèches pour se déplacer, 1-9 pour écrire, Retour arrière / Suppr / 0 pour effacer, N pour les notes
  useGameKeys((key) => {
    const delta = ARROW_DELTAS[key];
    if (delta) {
      moveSelection(delta[0], delta[1]);
      return;
    }
    const value = parseInt(key, 10);
    if (value >= 1 && value <= 9) {
      handleNumberPress(value);
      return;
    }
    if (key === 'Backspace' || key === 'Delete' || key === '0') {
      handleClearCell();
      return;
    }
    if (key.toLowerCase() === 'n') {
      setNotesMode((on) => !on);
      return;
    }
    return false;
  });

  // Déplace la case choisie dans une direction, en sautant les cases de départ (non modifiables)
  const moveSelection = (dRow: number, dCol: number) => {
    const size = puzzle.gridSize;
    let row = selectedCell?.row ?? 0;
    let col = selectedCell?.col ?? -dCol; // sans sélection : on part du bord
    if (!selectedCell && dCol === 0) row = dRow > 0 ? -1 : size;
    for (let step = 0; step < size; step++) {
      row += dRow;
      col += dCol;
      if (row < 0 || row >= size || col < 0 || col >= size) return;
      if (!isOriginalCell(row, col)) {
        setSelectedCell({ row, col });
        return;
      }
    }
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
    setNotes(clearNotesAfterPlacement(notes, revealed.row, revealed.col, revealed.value, puzzle.gridSize));
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
                  {cell === null && notes[rowIndex][colIndex].length > 0 ? (
                    <View style={styles.notesGrid}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <Text key={n} style={styles.noteText}>
                          {notes[rowIndex][colIndex].includes(n) ? n : ''}
                        </Text>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.cellText, isOriginal && styles.cellTextOriginal]}>
                      {cell ?? ''}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {/* Notes et indice sur une seule ligne : activer les notes ne décale rien vers le bas */}
      <View style={styles.toolsRow}>
        <Pressable
          style={[styles.notesToggle, notesMode && styles.notesToggleOn]}
          onPress={() => setNotesMode((on) => !on)}
          accessibilityRole="switch"
          accessibilityState={{ checked: notesMode }}
        >
          <Text style={[styles.notesToggleText, notesMode && styles.notesToggleTextOn]}>
            {notesMode ? tr('✏️ Notes : oui', '✏️ Notes: on') : tr('✏️ Notes : non', '✏️ Notes: off')}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.hintButton, hintsAvailable === 0 && styles.hintButtonDisabled]}
          onPress={handleHint}
          disabled={hintsAvailable === 0}
        >
          <Text style={styles.hintButtonText}>{tr('💡 Révéler une case', '💡 Reveal a square')}</Text>
        </Pressable>
      </View>

      <View style={[styles.numberPad, notesMode && styles.numberPadNotes]}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          // Chiffre posé 9 fois : grisé pour voir d'un coup d'œil lesquels sont finis
          const done = finished.has(num);
          return (
            <Pressable
              key={num}
              style={[styles.numberButton, done && styles.numberButtonDone]}
              onPress={() => handleNumberPress(num)}
              accessibilityLabel={done ? tr(`${num}, déjà posé 9 fois`, `${num}, already placed 9 times`) : tr(`Poser ${num}`, `Place ${num}`)}
            >
              <Text style={[styles.numberButtonText, done && styles.numberButtonTextDone]}>{num}</Text>
            </Pressable>
          );
        })}
        <Pressable style={styles.numberButton} onPress={handleClearCell}>
          <Text style={styles.numberButtonText}>✕</Text>
        </Pressable>
      </View>

      {/* Même place pour les deux textes : la page garde la même hauteur */}
      <Text style={[styles.savedNote, notesMode && styles.notesHelp]}>
        {notesMode
          ? tr('✏️ Les chiffres s’écrivent en petit, comme solutions possibles de la case.', '✏️ Numbers are written small, as possible answers for the square.')
          : tr('Ta grille est sauvegardée : tu peux quitter et revenir plus tard.', 'Your grid is saved: you can leave and come back later.')}
      </Text>
      <NewGameButton onConfirm={handleNewGame} />
    </ScrollView>
  );
}

const CELL_SIZE = 36; // plus petit qu'en 4x4 pour que 9 colonnes tiennent à l'écran

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedNote: {
    marginTop: 12,
    marginBottom: 8,
    minHeight: 30,
    paddingHorizontal: 24,
    fontSize: 11,
    color: '#8ea6c0',
    textAlign: 'center',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },
  toolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
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
  notesGrid: {
    width: CELL_SIZE - 2,
    height: CELL_SIZE - 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  noteText: {
    width: (CELL_SIZE - 2) / 3,
    height: (CELL_SIZE - 2) / 3,
    fontSize: 8,
    lineHeight: (CELL_SIZE - 2) / 3,
    textAlign: 'center',
    color: '#fbbf24',
    fontWeight: '600',
  },
  notesToggle: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3a5a82',
    backgroundColor: '#16233a',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  notesToggleOn: {
    backgroundColor: '#3a2e08',
    borderColor: '#fbbf24',
  },
  notesToggleText: {
    color: '#b7c8da',
    fontSize: 13,
    fontWeight: '600',
  },
  notesToggleTextOn: {
    color: '#fbbf24',
  },
  notesHelp: {
    color: '#fbbf24',
  },
  // Bordure toujours présente (transparente hors mode notes) : le pavé garde la même taille
  numberPadNotes: {
    borderColor: '#fbbf24',
  },
  numberPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    justifyContent: 'center',
    maxWidth: 336,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    borderStyle: 'dashed',
    padding: 7,
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
    backgroundColor: '#2a2208',
    borderColor: '#6b5410',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  hintButtonDisabled: {
    opacity: 0.3,
  },
  hintButtonText: {
    color: '#f59e0b',
    fontSize: 12,
  },
});