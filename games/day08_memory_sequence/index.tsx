import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GameComponentProps } from '../../components/GameWrapper/types';
import {
    calculateSequenceScore,
    checkPlayerInput,
    DIFFICULTY_CONFIGS,
    extendSequence,
    generateSequence,
    hasWon,
    SymbolIndex,
} from './logic';

const SYMBOL_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308']; // rouge, bleu, vert, jaune
const SYMBOL_LABELS = ['🔴', '🔵', '🟢', '🟡'];

type GamePhase = 'showing' | 'waiting_input' | 'checking';

export function MemorySequenceGame({ onGameEnd, hintsAvailable, onUseHint, difficulty = 'easy' }: GameComponentProps) {
  const config = DIFFICULTY_CONFIGS[difficulty] ?? DIFFICULTY_CONFIGS.easy;

  const [sequence, setSequence] = useState<SymbolIndex[]>(() => generateSequence(config.startLength));
  const [playerInput, setPlayerInput] = useState<SymbolIndex[]>([]);
  const [phase, setPhase] = useState<GamePhase>('showing');
  const [highlightedSymbol, setHighlightedSymbol] = useState<SymbolIndex | null>(null);
  const [hintsUsedThisGame, setHintsUsedThisGame] = useState(0);

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Affiche la séquence symbole par symbole avec délais
  const playSequence = (seqToPlay: SymbolIndex[]) => {
    setPhase('showing');
    setPlayerInput([]);
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    seqToPlay.forEach((symbol, index) => {
      const showTimeout = setTimeout(() => {
        setHighlightedSymbol(symbol);
      }, index * config.displayDelayMs);

      const hideTimeout = setTimeout(() => {
        setHighlightedSymbol(null);
      }, index * config.displayDelayMs + config.displayDelayMs * 0.6);

      timeoutsRef.current.push(showTimeout, hideTimeout);
    });

    const endTimeout = setTimeout(() => {
      setPhase('waiting_input');
    }, seqToPlay.length * config.displayDelayMs);
    timeoutsRef.current.push(endTimeout);
  };

  useEffect(() => {
    playSequence(sequence);
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  const handleSymbolPress = (symbolIndex: SymbolIndex) => {
    if (phase !== 'waiting_input') return;

    const newInput = [...playerInput, symbolIndex];
    const result = checkPlayerInput(sequence, newInput);

    if (result === 'wrong') {
      const score = calculateSequenceScore(sequence.length - 1, hintsUsedThisGame);
      onGameEnd({ success: false, score });
      return;
    }

    setPlayerInput(newInput);

    if (result === 'complete') {
      if (hasWon(sequence.length, config.maxLength)) {
        const score = calculateSequenceScore(sequence.length, hintsUsedThisGame);
        onGameEnd({ success: true, score });
      } else {
        // niveau suivant : on étend la séquence et on la rejoue
        const nextSequence = extendSequence(sequence);
        setSequence(nextSequence);
        setTimeout(() => playSequence(nextSequence), 600);
      }
    }
  };

  const handleHint = () => {
    if (hintsAvailable === 0 || phase !== 'waiting_input') return;
    onUseHint();
    setHintsUsedThisGame((prev) => prev + 1);
    // rejoue la séquence depuis le début comme aide
    playSequence(sequence);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.progress}>
        Séquence : {sequence.length} / {config.maxLength}
      </Text>
      <Text style={styles.statusText}>
        {phase === 'showing' && 'Regarde bien...'}
        {phase === 'waiting_input' && 'À toi de reproduire !'}
      </Text>

      <View style={styles.symbolGrid}>
        {([0, 1, 2, 3] as SymbolIndex[]).map((symbolIndex) => (
          <Pressable
            key={symbolIndex}
            disabled={phase !== 'waiting_input'}
            onPress={() => handleSymbolPress(symbolIndex)}
            style={[
              styles.symbolButton,
              { backgroundColor: SYMBOL_COLORS[symbolIndex] },
              highlightedSymbol === symbolIndex && styles.symbolHighlighted,
            ]}
          >
            <Text style={styles.symbolEmoji}>{SYMBOL_LABELS[symbolIndex]}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.hintButton, (hintsAvailable === 0 || phase !== 'waiting_input') && styles.hintButtonDisabled]}
        onPress={handleHint}
        disabled={hintsAvailable === 0 || phase !== 'waiting_input'}
      >
        <Text style={styles.hintButtonText}>💡 Revoir la séquence</Text>
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
  progress: {
    fontSize: 13,
    color: '#7a9ab8',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 32,
  },
  symbolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    width: 220,
  },
  symbolButton: {
    width: 96,
    height: 96,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
  },
  symbolHighlighted: {
    opacity: 1,
    transform: [{ scale: 1.08 }],
  },
  symbolEmoji: {
    fontSize: 32,
  },
  hintButton: {
    marginTop: 32,
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