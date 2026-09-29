import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { GameComponentProps } from '../../components/GameWrapper/types';
import { useI18n } from '../../services/i18n';
import { playSfx } from '../../services/sfx';
import { calculateWordSearchScore, Cell, createWordSearch, findSelectedWord, lineCells, WORDS, WORDSEARCH_SETTINGS } from './logic';

const FOUND_COLORS = ['#34d399', '#60a5fa', '#f472b6', '#fbbf24', '#a78bfa', '#fb923c', '#2dd4bf', '#f87171'];
const HINT_MS = 3000;
const keyOf = (c: Cell) => `${c.row},${c.col}`;

// Ce composant n'est monté qu'au clic sur « Jouer » : le chrono démarre au montage
export function WordSearchGame({ onGameEnd, hintsAvailable, onUseHint, difficulty = 'easy' }: GameComponentProps) {
  const { tr, lang } = useI18n();
  const settings = WORDSEARCH_SETTINGS[difficulty] ?? WORDSEARCH_SETTINGS.medium;
  const [puzzle] = useState(() => createWordSearch(WORDS[lang], settings));
  const cellSize = Math.min(36, Math.floor((useWindowDimensions().width - 32) / puzzle.size));
  const [found, setFound] = useState<string[]>([]);
  const [selection, setSelection] = useState<Cell[]>([]);
  const [tapStart, setTapStart] = useState<Cell | null>(null);
  const [hintCell, setHintCell] = useState<Cell | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(settings.timeLimitSeconds);
  const foundRef = useRef<string[]>([]);
  const secondsRef = useRef(secondsLeft);
  secondsRef.current = secondsLeft;
  const endedRef = useRef(false);
  const dragStartRef = useRef<Cell | null>(null);
  const tapStartRef = useRef<Cell | null>(null);
  tapStartRef.current = tapStart;

  const finish = (success: boolean) => {
    if (endedRef.current) return;
    endedRef.current = true;
    onGameEnd({ success, score: calculateWordSearchScore(foundRef.current.length, success ? secondsRef.current : 0) });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (endedRef.current) return;
      setSecondsLeft((s) => {
        if (s <= 1) {
          setTimeout(() => finish(false), 0);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cellAt = (x: number, y: number): Cell | null => {
    const row = Math.floor(y / cellSize);
    const col = Math.floor(x / cellSize);
    return row >= 0 && row < puzzle.size && col >= 0 && col < puzzle.size ? { row, col } : null;
  };

  const check = (start: Cell, end: Cell) => {
    setSelection([]);
    const word = findSelectedWord(puzzle, start, end);
    if (!word || foundRef.current.includes(word.word)) {
      if ((lineCells(start, end)?.length ?? 0) > 1) playSfx('wrong');
      return;
    }
    foundRef.current = [...foundRef.current, word.word];
    setFound(foundRef.current);
    setHintCell(null);
    playSfx('correct');
    if (foundRef.current.length === puzzle.words.length) {
      playSfx('victory');
      setTimeout(() => finish(true), 600);
    }
  };

  // Glisser de la première à la dernière lettre (la ligne suit le doigt)
  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(4)
    .onBegin((event) => {
      dragStartRef.current = cellAt(event.x, event.y);
    })
    .onUpdate((event) => {
      const start = dragStartRef.current;
      const current = cellAt(event.x, event.y);
      if (!start || !current) return;
      setSelection(lineCells(start, current) ?? [start]);
    })
    .onEnd((event) => {
      const start = dragStartRef.current;
      const end = cellAt(event.x, event.y);
      if (start && end) check(start, end);
      else setSelection([]);
    });

  // Ou toucher la première lettre, puis la dernière
  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd((event, success) => {
      if (!success) return;
      const cell = cellAt(event.x, event.y);
      if (!cell) return;
      const start = tapStartRef.current;
      if (!start) {
        setTapStart(cell);
        setSelection([cell]);
        return;
      }
      setTapStart(null);
      check(start, cell);
    });

  const handleHint = () => {
    if (hintsAvailable === 0 || endedRef.current) return;
    const missing = puzzle.words.find((w) => !foundRef.current.includes(w.word));
    if (!missing) return;
    onUseHint();
    setHintCell(missing.cells[0]);
    setTimeout(() => setHintCell(null), HINT_MS);
  };

  // Couleur de chaque case appartenant à un mot trouvé
  const foundColor = new Map<string, string>();
  puzzle.words.forEach((w, i) => {
    if (found.includes(w.word)) w.cells.forEach((c) => foundColor.has(keyOf(c)) || foundColor.set(keyOf(c), FOUND_COLORS[i % FOUND_COLORS.length]));
  });
  const selected = new Set(selection.map(keyOf));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.count}>{tr(`Mots : ${found.length} / ${puzzle.words.length}`, `Words: ${found.length} / ${puzzle.words.length}`)}</Text>
        <Text style={[styles.timer, secondsLeft <= 20 && styles.timerLow]}>⏱ {secondsLeft}s</Text>
      </View>

      <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
        <View style={[styles.grid, { width: cellSize * puzzle.size, height: cellSize * puzzle.size }]}>
          {puzzle.grid.map((row, r) =>
            row.map((letter, c) => {
              const key = `${r},${c}`;
              const color = foundColor.get(key);
              const isHint = hintCell?.row === r && hintCell?.col === c;
              return (
                <View
                  key={key}
                  style={[
                    styles.cell,
                    { left: c * cellSize, top: r * cellSize, width: cellSize, height: cellSize, borderRadius: cellSize / 2 },
                    color ? { backgroundColor: color + '55' } : null,
                    selected.has(key) && styles.cellSelected,
                    isHint && styles.cellHint,
                  ]}
                >
                  <Text style={[styles.letter, { fontSize: cellSize * 0.5 }, color ? styles.letterFound : null]}>{letter}</Text>
                </View>
              );
            })
          )}
        </View>
      </GestureDetector>

      <View style={styles.words}>
        {puzzle.words.map((w, i) => {
          const isFound = found.includes(w.word);
          return (
            <Text key={w.word} style={[styles.word, isFound && { color: FOUND_COLORS[i % FOUND_COLORS.length], textDecorationLine: 'line-through' }]}>
              {w.word}
            </Text>
          );
        })}
      </View>

      <Text style={styles.help}>
        {settings.backwards
          ? tr('Glisse de la première à la dernière lettre. Les mots vont dans tous les sens, même à l’envers !', 'Swipe from the first to the last letter. Words go every way, even backwards!')
          : tr('Glisse de la première à la dernière lettre (horizontal, vertical ou en diagonale).', 'Swipe from the first to the last letter (across, down or diagonal).')}
      </Text>

      <Pressable style={[styles.hintButton, hintsAvailable === 0 && styles.disabled]} onPress={handleHint} disabled={hintsAvailable === 0}>
        <Text style={styles.hintButtonText}>{tr('💡 Montrer la 1re lettre d’un mot', '💡 Show the first letter of a word')}</Text>
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
  header: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  count: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  timer: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f59e0b',
  },
  timerLow: {
    color: '#f87171',
  },
  grid: {
    backgroundColor: '#f5f5f0',
    borderRadius: 10,
  },
  cell: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: {
    backgroundColor: '#a78bfa88',
  },
  cellHint: {
    backgroundColor: '#fbbf24',
  },
  letter: {
    fontWeight: '700',
    color: '#1e293b',
  },
  letterFound: {
    color: '#0f172a',
  },
  words: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
    maxWidth: 340,
  },
  word: {
    fontSize: 13,
    fontWeight: '700',
    color: '#cdd9e5',
    letterSpacing: 1,
  },
  help: {
    fontSize: 11,
    color: '#8ea6c0',
    marginTop: 10,
    textAlign: 'center',
    maxWidth: 320,
  },
  hintButton: {
    marginTop: 12,
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
});
