import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { GameComponentProps } from '../../components/GameWrapper/types';
import { useI18n } from '../../services/i18n';
import { playSfx } from '../../services/sfx';
import { Board, Cell, createBoard, findValidMove, isAdjacent, playSwap, SIZE, TREATS } from './logic';

// 25 échanges pour atteindre le score objectif ; une fois atteint, les échanges restants rapportent des points bonus
const MOVES = 25;
const TARGET: Record<string, number> = { easy: 500, medium: 700, hard: 850, very_hard: 950 };
const FLASH_MS = 260;
// Onglet Jeux : des niveaux. 20 échanges par niveau pour marquer 400 points, puis 250 de plus à chaque niveau.
// Niveau réussi = nouvelle grille ; la partie s'arrête quand un niveau n'est pas réussi à temps.
const ARCADE_MOVES = 20;
const arcadeTarget = (level: number) => 400 + 250 * (level - 1);
const HINT_MS = 2500;

const sameCell = (a: Cell | null, b: Cell | null) => !!a && !!b && a.row === b.row && a.col === b.col;

export function Match3Game({ onGameEnd, hintsAvailable, onUseHint, difficulty = 'easy', arcade = false }: GameComponentProps) {
  const { tr } = useI18n();
  const [level, setLevel] = useState(1);
  const levelStartRef = useRef(0); // score au début du niveau en cours
  const target = arcade ? arcadeTarget(level) : TARGET[difficulty] ?? 700;
  const moves = arcade ? ARCADE_MOVES : MOVES;
  const cellSize = Math.min(48, Math.floor((useWindowDimensions().width - 40) / SIZE));
  const [board, setBoard] = useState<Board>(() => createBoard());
  const [selected, setSelected] = useState<Cell | null>(null);
  const [flash, setFlash] = useState<Set<string>>(new Set());
  const [hint, setHint] = useState<[Cell, Cell] | null>(null);
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(moves);
  const [message, setMessage] = useState<string | null>(null);
  const boardRef = useRef(board);
  boardRef.current = board;
  const busyRef = useRef(false);
  const endedRef = useRef(false);
  const scoreRef = useRef(0);
  const movesRef = useRef(moves);
  const selectedRef = useRef<Cell | null>(null);
  selectedRef.current = selected;
  const dragStartRef = useRef<Cell | null>(null);

  const finish = (success: boolean) => {
    if (endedRef.current) return;
    endedRef.current = true;
    onGameEnd({ success, score: scoreRef.current });
  };

  const attempt = (a: Cell, b: Cell) => {
    if (busyRef.current || endedRef.current) return;
    setSelected(null);
    const result = playSwap(boardRef.current, a, b);
    if (!result) {
      playSfx('bump');
      return;
    }
    busyRef.current = true;
    setHint(null);
    // Échange visible, les friandises alignées clignotent, puis tout retombe
    setBoard(result.swapped);
    setFlash(new Set(result.firstCleared.map((c) => `${c.row},${c.col}`)));
    playSfx(result.chains > 1 ? 'victory' : 'correct');
    setTimeout(() => {
      const before = scoreRef.current;
      scoreRef.current += result.gained;
      movesRef.current -= 1;
      boardRef.current = result.board;
      setBoard(result.board);
      setFlash(new Set());
      setScore(scoreRef.current);
      setMovesLeft(movesRef.current);
      setMessage(
        result.chains > 1
          ? tr(`Réaction en chaîne ×${result.chains} ! +${result.gained}`, `Chain reaction ×${result.chains}! +${result.gained}`)
          : result.reshuffled
          ? tr('Plus de coup possible : on remélange !', 'No moves left: reshuffling!')
          : null
      );
      const levelScore = scoreRef.current - levelStartRef.current;
      if (arcade && levelScore >= target) {
        // Niveau réussi : nouvelle grille, échanges remis à neuf, objectif plus haut
        playSfx('fragment');
        setTimeout(() => {
          const next = createBoard();
          levelStartRef.current = scoreRef.current;
          movesRef.current = ARCADE_MOVES;
          boardRef.current = next;
          setBoard(next);
          setMovesLeft(ARCADE_MOVES);
          setLevel((n) => n + 1);
          setMessage(tr('🎉 Niveau réussi ! Nouvelle grille, objectif plus haut.', '🎉 Level cleared! New board, higher target.'));
          busyRef.current = false;
        }, 500);
        return;
      }
      if (!arcade && before < target && scoreRef.current >= target) playSfx('fragment');
      busyRef.current = false;
      if (movesRef.current <= 0) setTimeout(() => finish(arcade || scoreRef.current >= target), 400);
    }, FLASH_MS);
  };

  const cellAt = (x: number, y: number): Cell | null => {
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    return row >= 0 && row < SIZE && col >= 0 && col < SIZE ? { row, col } : null;
  };

  // Toucher : sélectionner, puis toucher une friandise voisine pour échanger
  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd((event, success) => {
      if (!success) return;
      const cell = cellAt(event.x, event.y);
      if (!cell) return;
      const current = selectedRef.current;
      if (current && isAdjacent(current, cell)) attempt(current, cell);
      else setSelected(sameCell(current, cell) ? null : cell);
    });

  // Glisser : échange avec la voisine dans la direction du geste
  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(12)
    .onBegin((event) => {
      dragStartRef.current = cellAt(event.x, event.y);
    })
    .onEnd((event) => {
      const start = dragStartRef.current;
      if (!start) return;
      const { translationX: x, translationY: y } = event;
      const target =
        Math.abs(x) > Math.abs(y) ? { row: start.row, col: start.col + (x > 0 ? 1 : -1) } : { row: start.row + (y > 0 ? 1 : -1), col: start.col };
      if (target.row >= 0 && target.row < SIZE && target.col >= 0 && target.col < SIZE) attempt(start, target);
    });

  const handleHint = () => {
    if (hintsAvailable === 0 || endedRef.current) return;
    const move = findValidMove(boardRef.current);
    if (!move) return;
    onUseHint();
    setHint(move);
    setTimeout(() => setHint(null), HINT_MS);
  };

  const levelScore = score - levelStartRef.current;
  const reached = !arcade && score >= target;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {arcade && <Text style={styles.level}>{tr(`Niveau ${level}`, `Level ${level}`)}</Text>}
        <Text style={styles.score}>{score} pts</Text>
        <Text style={styles.moves}>{tr(`${movesLeft} échanges`, `${movesLeft} swaps`)}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, reached && styles.progressDone, { width: `${Math.min(1, levelScore / target) * 100}%` }]} />
      </View>
      <Text style={[styles.goal, reached && styles.goalReached]}>
        {arcade
          ? tr(`Niveau ${level} : ${levelScore} / ${target} points`, `Level ${level}: ${levelScore} / ${target} points`)
          : reached
          ? tr('🎉 Objectif atteint : chaque échange rapporte des points bonus !', '🎉 Goal reached: every swap now earns bonus points!')
          : tr(`Objectif : ${target} points`, `Goal: ${target} points`)}
      </Text>

      <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
        <View style={[styles.board, { width: cellSize * SIZE, height: cellSize * SIZE }]}>
          {board.map((row, r) =>
            row.map((kind, c) => {
              const key = `${r},${c}`;
              const isSelected = selected?.row === r && selected?.col === c;
              const isHint = !!hint && (sameCell(hint[0], { row: r, col: c }) || sameCell(hint[1], { row: r, col: c }));
              return (
                <View
                  key={key}
                  style={[
                    styles.cell,
                    { left: c * cellSize, top: r * cellSize, width: cellSize, height: cellSize },
                    isSelected && styles.cellSelected,
                    isHint && styles.cellHint,
                    flash.has(key) && styles.cellFlash,
                  ]}
                >
                  <Text style={{ fontSize: cellSize * 0.6 }}>{TREATS[kind]}</Text>
                </View>
              );
            })
          )}
        </View>
      </GestureDetector>

      <Text style={styles.message}>{message ?? tr('Comme Candy Crush : échange deux friandises voisines pour en aligner 3 ou plus.', 'Like Candy Crush: swap two neighbouring treats to line up 3 or more.')}</Text>

      <View style={styles.buttons}>
        <Pressable style={[styles.hintButton, hintsAvailable === 0 && styles.disabled]} onPress={handleHint} disabled={hintsAvailable === 0}>
          <Text style={styles.hintButtonText}>{tr('💡 Montrer un échange', '💡 Show a swap')}</Text>
        </Pressable>
        {reached && (
          <Pressable style={styles.stopButton} onPress={() => finish(true)}>
            <Text style={styles.stopButtonText}>{tr('✓ Terminer', '✓ Finish')}</Text>
          </Pressable>
        )}
      </View>
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
    gap: 20,
    alignItems: 'baseline',
  },
  score: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  level: {
    fontSize: 15,
    fontWeight: '800',
    color: '#a78bfa',
  },
  moves: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f59e0b',
  },
  progressTrack: {
    width: 260,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16233a',
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#a78bfa',
  },
  progressDone: {
    backgroundColor: '#fbbf24',
  },
  goal: {
    fontSize: 12,
    color: '#b7c8da',
    marginTop: 6,
    marginBottom: 12,
    textAlign: 'center',
  },
  goalReached: {
    color: '#fbbf24',
    fontWeight: '700',
  },
  board: {
    backgroundColor: '#0f1b2d',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2c4262',
  },
  cell: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  cellSelected: {
    backgroundColor: '#3d2a78',
    borderWidth: 2,
    borderColor: '#a78bfa',
  },
  cellHint: {
    backgroundColor: '#3a2e08',
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  cellFlash: {
    backgroundColor: '#fde68a',
  },
  message: {
    fontSize: 12,
    color: '#8ea6c0',
    marginTop: 12,
    textAlign: 'center',
    maxWidth: 320,
    minHeight: 32,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  hintButton: {
    backgroundColor: '#2a2208',
    borderColor: '#6b5410',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  hintButtonText: {
    color: '#f59e0b',
    fontSize: 12,
  },
  disabled: {
    opacity: 0.3,
  },
  stopButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
