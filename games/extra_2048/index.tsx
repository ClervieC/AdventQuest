import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { GameComponentProps } from '../../components/GameWrapper/types';
import { useGameKeys } from '../../hooks/use-game-keys';
import { useI18n } from '../../services/i18n';
import { playSfx } from '../../services/sfx';
import { addRandomTile, bestMove, Board, Direction, isStuck, maxTile, move, newGame, SIZE, TILE_ICONS } from './logic';

// Tuile à atteindre pour gagner, selon la difficulté (le boss joue en « hard »)
const GOAL_TILE: Record<string, number> = { easy: 64, medium: 128, hard: 128, very_hard: 256 };
const HINT_MS = 2500;
// Calendrier : après la tuile objectif, les fusions comptent pour un quart (bonus raisonnable)
const BONUS_RATE = 0.25;

const ARROW_DIRECTIONS: Record<string, Direction> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
const ARROW_ICONS: Record<Direction, string> = { up: '⬆️', down: '⬇️', left: '⬅️', right: '➡️' };

// Couleur de fond qui se réchauffe avec la valeur de la tuile
const TILE_COLORS: Record<number, string> = {
  2: '#1e3a5f', 4: '#23456e', 8: '#2e4a7a', 16: '#3b3f86', 32: '#4c3a8f', 64: '#5b3596',
  128: '#1f6b4a', 256: '#8a4b12', 512: '#9a6b0c', 1024: '#a0223a', 2048: '#c0266d',
};

export function Game2048({ onGameEnd, hintsAvailable, onUseHint, difficulty = 'easy', arcade }: GameComponentProps) {
  const { tr } = useI18n();
  const goal = GOAL_TILE[difficulty] ?? 128;
  const [board, setBoard] = useState<Board>(() => newGame());
  const [score, setScore] = useState(0);
  const [hint, setHint] = useState<Direction | null>(null);
  const boardRef = useRef(board);
  boardRef.current = board;
  const scoreRef = useRef(score);
  // Score au moment où la tuile objectif est atteinte : ce qui vient après est du bonus (non plafonné)
  const scoreAtGoalRef = useRef<number | null>(null);
  scoreRef.current = score;
  const endedRef = useRef(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cell = Math.min(78, Math.floor((useWindowDimensions().width - 60) / SIZE));
  const reached = maxTile(board) >= goal;

  const finish = (success: boolean) => {
    if (endedRef.current) return;
    endedRef.current = true;
    const bonus = scoreAtGoalRef.current === null ? 0 : scoreRef.current - scoreAtGoalRef.current;
    onGameEnd({ success, score: scoreRef.current, bonus });
  };

  const play = (direction: Direction) => {
    if (endedRef.current) return;
    const result = move(boardRef.current, direction);
    if (!result.moved) {
      playSfx('bump');
      return;
    }
    const before = maxTile(boardRef.current);
    const next = addRandomTile(result.board);
    boardRef.current = next;
    const inBonus = !arcade && scoreAtGoalRef.current !== null;
    scoreRef.current += inBonus ? Math.round(result.gained * BONUS_RATE) : result.gained;
    setBoard(next);
    setScore(scoreRef.current);
    setHint(null);
    const after = maxTile(next);
    if (before < goal && after >= goal) {
      scoreAtGoalRef.current = scoreRef.current;
      playSfx('victory');
    }
    else playSfx(result.gained > 0 ? 'place' : 'tap');
    // Plateau bloqué : gagné si la tuile objectif a été atteinte
    if (isStuck(next)) setTimeout(() => finish(after >= goal), 500);
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onEnd((event) => {
      const { translationX: x, translationY: y } = event;
      if (Math.abs(x) < 20 && Math.abs(y) < 20) return;
      if (Math.abs(x) > Math.abs(y)) play(x > 0 ? 'right' : 'left');
      else play(y > 0 ? 'down' : 'up');
    });

  useGameKeys((key) => {
    const direction = ARROW_DIRECTIONS[key];
    if (!direction) return false;
    play(direction);
  });

  const handleHint = () => {
    if (hintsAvailable === 0 || endedRef.current) return;
    const suggestion = bestMove(boardRef.current);
    if (!suggestion) return;
    onUseHint();
    setHint(suggestion);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setHint(null), HINT_MS);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.score}>{tr('Score', 'Score')} {score}</Text>
        <Text style={[styles.goal, reached && styles.goalReached]}>
          {reached
            ? tr('🎉 Objectif atteint · continue !', '🎉 Goal reached · keep going!')
            : tr(`Objectif : ${TILE_ICONS[goal]} ${goal}`, `Goal: ${TILE_ICONS[goal]} ${goal}`)}
        </Text>
      </View>

      <GestureDetector gesture={pan}>
        <View style={[styles.board, { width: cell * SIZE + 10, height: cell * SIZE + 10 }]}>
          {board.map((row, r) =>
            row.map((value, c) => (
              <View
                key={`${r}-${c}`}
                style={[
                  styles.tile,
                  { left: 5 + c * cell, top: 5 + r * cell, width: cell - 6, height: cell - 6 },
                  value > 0 && { backgroundColor: TILE_COLORS[value] ?? '#c0266d' },
                  value === goal && styles.tileGoal,
                ]}
              >
                {value > 0 && (
                  <>
                    <Text style={{ fontSize: cell * 0.42 }}>{TILE_ICONS[value] ?? '✨'}</Text>
                    <Text style={styles.tileValue}>{value}</Text>
                  </>
                )}
              </View>
            ))
          )}
          {hint && (
            <View pointerEvents="none" style={styles.hintOverlay}>
              <Text style={styles.hintArrow}>{ARROW_ICONS[hint]}</Text>
            </View>
          )}
        </View>
      </GestureDetector>

      <Text style={styles.help}>
        {tr('Glisse pour pousser toutes les tuiles : deux objets identiques fusionnent.', 'Swipe to push every tile: two identical items merge.')}
      </Text>

      <View style={styles.buttons}>
        <Pressable style={[styles.hintButton, hintsAvailable === 0 && styles.disabled]} onPress={handleHint} disabled={hintsAvailable === 0}>
          <Text style={styles.hintButtonText}>{tr('💡 Meilleur coup', '💡 Best move')}</Text>
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
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  score: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  goal: {
    fontSize: 13,
    color: '#b7c8da',
  },
  goalReached: {
    color: '#fbbf24',
    fontWeight: '700',
  },
  board: {
    backgroundColor: '#0f1b2d',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2c4262',
  },
  tile: {
    position: 'absolute',
    margin: 3,
    borderRadius: 10,
    backgroundColor: '#16233a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileGoal: {
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  tileValue: {
    position: 'absolute',
    bottom: 2,
    right: 5,
    fontSize: 10,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  hintOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(12, 21, 33, 0.35)',
    borderRadius: 14,
  },
  hintArrow: {
    fontSize: 64,
  },
  help: {
    fontSize: 11,
    color: '#8ea6c0',
    marginTop: 12,
    textAlign: 'center',
    maxWidth: 320,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
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
