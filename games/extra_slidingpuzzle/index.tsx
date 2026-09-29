import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GameComponentProps } from '../../components/GameWrapper/types';
import { useGameKeys } from '../../hooks/use-game-keys';
import { useI18n } from '../../services/i18n';
import { playSfx } from '../../services/sfx';
import { calculatePuzzleScore, isSolved, moveTile, N, neighbors, Puzzle, scramble, solutionLength, solve } from './logic';

// Temps pour reconstituer l'image, selon la difficulté
const TIME_LIMIT: Record<string, number> = { easy: 180, medium: 150, hard: 130, very_hard: 150 };
// Image de Noël découpée en 9 : un grand dessin centré, chaque pièce en montre un morceau
const PICTURES = ['🎄', '⛄', '🎅', '🦌'];

// Flèches : la pièce qui glisse vers la case vide (← = la pièce à droite du vide va à gauche)
const ARROW_OFFSETS: Record<string, [number, number]> = { ArrowLeft: [0, 1], ArrowRight: [0, -1], ArrowUp: [1, 0], ArrowDown: [-1, 0] };

// Ce composant n'est monté qu'au clic sur « Jouer » : le chrono démarre au montage
export function SlidingPuzzleGame({ onGameEnd, hintsAvailable, onUseHint, difficulty = 'easy' }: GameComponentProps) {
  const { tr } = useI18n();
  const limit = TIME_LIMIT[difficulty] ?? 150;
  const boardSize = Math.min(300, useWindowDimensions().width - 48);
  const tile = boardSize / N;
  const [picture] = useState(() => PICTURES[Math.floor(Math.random() * PICTURES.length)]);
  const [puzzle, setPuzzle] = useState<Puzzle>(() => scramble());
  const [optimal] = useState(() => solutionLength(puzzle));
  const [moves, setMoves] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(limit);
  const [hintTile, setHintTile] = useState<number | null>(null);
  const puzzleRef = useRef(puzzle);
  puzzleRef.current = puzzle;
  const movesRef = useRef(0);
  const secondsRef = useRef(limit);
  secondsRef.current = secondsLeft;
  const endedRef = useRef(false);

  const finish = (success: boolean) => {
    if (endedRef.current) return;
    endedRef.current = true;
    onGameEnd({ success, score: success ? calculatePuzzleScore(movesRef.current, optimal, secondsRef.current) : 0 });
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

  const slide = (index: number) => {
    if (endedRef.current) return;
    const next = moveTile(puzzleRef.current, index);
    if (!next) {
      playSfx('bump');
      return;
    }
    playSfx('tap');
    puzzleRef.current = next;
    movesRef.current += 1;
    setPuzzle(next);
    setMoves(movesRef.current);
    setHintTile(null);
    if (isSolved(next)) {
      playSfx('victory');
      setTimeout(() => finish(true), 700);
    }
  };

  useGameKeys((key) => {
    const offset = ARROW_OFFSETS[key];
    if (!offset) return false;
    const empty = puzzleRef.current.indexOf(0);
    const row = Math.floor(empty / N) + offset[0];
    const col = (empty % N) + offset[1];
    if (row < 0 || row >= N || col < 0 || col >= N) return;
    slide(row * N + col);
  });

  // Indice : la prochaine pièce à bouger (plus court chemin) clignote, puis glisse toute seule
  const handleHint = () => {
    if (hintsAvailable === 0 || endedRef.current) return;
    const next = solve(puzzleRef.current)[0];
    if (next === undefined) return;
    onUseHint();
    setHintTile(next);
    setTimeout(() => slide(next), 600);
  };

  const solved = isSolved(puzzle);
  const empty = puzzle.indexOf(0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.moves}>{tr(`${moves} coups`, `${moves} moves`)}</Text>
        <Text style={[styles.timer, secondsLeft <= 20 && styles.timerLow]}>⏱ {secondsLeft}s</Text>
      </View>

      <View style={[styles.board, { width: boardSize, height: boardSize }]}>
        {puzzle.map((value, index) => {
          if (value === 0 && !solved) return null;
          const piece = value === 0 ? N * N - 1 : value - 1; // morceau d'image porté par la pièce
          const row = Math.floor(index / N);
          const col = index % N;
          const movable = neighbors(empty).includes(index);
          return (
            <Pressable
              key={value}
              onPress={() => slide(index)}
              style={[
                styles.tile,
                { left: col * tile, top: row * tile, width: tile, height: tile },
                movable && styles.tileMovable,
                hintTile === index && styles.tileHint,
              ]}
            >
              {/* Tout le dessin, décalé : la pièce n'en laisse voir que son morceau */}
              <View
                style={[
                  styles.picture,
                  { width: boardSize, height: boardSize, left: -(piece % N) * tile, top: -Math.floor(piece / N) * tile },
                ]}
              >
                <Text style={{ fontSize: boardSize * 0.78, lineHeight: boardSize }}>{picture}</Text>
              </View>
              {!solved && <Text style={styles.number}>{value}</Text>}
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.help}>
        {tr('Touche une pièce voisine de la case vide pour la faire glisser. Reconstitue l’image (pièces 1 à 8 dans l’ordre).', 'Tap a piece next to the empty square to slide it. Rebuild the picture (pieces 1 to 8 in order).')}
      </Text>

      <Pressable style={[styles.hintButton, hintsAvailable === 0 && styles.disabled]} onPress={handleHint} disabled={hintsAvailable === 0}>
        <Text style={styles.hintButtonText}>{tr('💡 Jouer le bon coup', '💡 Play the right move')}</Text>
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
    marginBottom: 14,
  },
  moves: {
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
  board: {
    backgroundColor: '#0f1b2d',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2c4262',
    overflow: 'hidden',
  },
  tile: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: '#1e3358',
    borderWidth: 1,
    borderColor: '#0c1521',
  },
  tileMovable: {
    borderColor: '#a78bfa',
  },
  tileHint: {
    borderColor: '#fbbf24',
    borderWidth: 3,
  },
  picture: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    position: 'absolute',
    top: 3,
    left: 5,
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: '#000',
    textShadowRadius: 3,
  },
  help: {
    fontSize: 11,
    color: '#8ea6c0',
    marginTop: 14,
    textAlign: 'center',
    maxWidth: 320,
  },
  hintButton: {
    marginTop: 14,
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
