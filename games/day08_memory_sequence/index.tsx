import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GameComponentProps } from '../../components/GameWrapper/types';
import { useGameKeys } from '../../hooks/use-game-keys';
import { playSfx } from '../../services/sfx';
import {
    bonusDelayMs,
    calculateSequenceScore,
    checkPlayerInput,
    DIFFICULTY_CONFIGS,
    extendSequence,
    generateSequence,
    sequenceDelayMs,
    SymbolIndex,
} from './logic';
import { useI18n } from '../../services/i18n';

const SYMBOL_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308']; // rouge, bleu, vert, jaune
const SYMBOL_LABELS = ['🔴', '🔵', '🟢', '🟡'];

type GamePhase = 'ready' | 'showing' | 'waiting_input' | 'checking';


export function MemorySequenceGame({ onGameEnd, hintsAvailable, onUseHint, difficulty = 'easy', arcade = false }: GameComponentProps) {
  const { tr } = useI18n();
  const config = DIFFICULTY_CONFIGS[difficulty] ?? DIFFICULTY_CONFIGS.easy;

  const [sequence, setSequence] = useState<SymbolIndex[]>(() => generateSequence(config.startLength));
  const [playerInput, setPlayerInput] = useState<SymbolIndex[]>([]);
  // La première séquence attend que le joueur touche « Je suis prêt »
  const [phase, setPhase] = useState<GamePhase>('ready');
  const [highlightedSymbol, setHighlightedSymbol] = useState<SymbolIndex | null>(null);
  const [hintsUsedThisGame, setHintsUsedThisGame] = useState(0);

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Affiche la séquence symbole par symbole avec délais
  const playSequence = (seqToPlay: SymbolIndex[]) => {
    setPhase('showing');
    setPlayerInput([]);
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    // En bonus (au-delà de l'objectif), la séquence défile de plus en plus vite
    const delay = bonusDelayMs(
      sequenceDelayMs(config.displayDelayMs, seqToPlay.length - config.startLength),
      seqToPlay.length - config.maxLength
    );

    seqToPlay.forEach((symbol, index) => {
      const showTimeout = setTimeout(() => {
        setHighlightedSymbol(symbol);
        playSfx(`note${symbol}`);
      }, index * delay);

      const hideTimeout = setTimeout(() => {
        setHighlightedSymbol(null);
      }, index * delay + delay * 0.6);

      timeoutsRef.current.push(showTimeout, hideTimeout);
    });

    const endTimeout = setTimeout(() => {
      setPhase('waiting_input');
    }, seqToPlay.length * delay);
    timeoutsRef.current.push(endTimeout);
  };

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  // « Je suis prêt » : petite pause puis la première séquence
  const handleReady = () => {
    if (phase !== 'ready') return;
    playSfx('tap');
    setPhase('showing');
    timeoutsRef.current.push(setTimeout(() => playSequence(sequence), 500));
  };

  // Objectif atteint = fragment gagné ; ensuite on continue en bonus jusqu'à l'erreur (ou la longueur max)
  const isBonus = sequence.length > config.maxLength;
  const endWith = (lengthReached: number) => {
    timeoutsRef.current.forEach(clearTimeout);
    onGameEnd({
      success: lengthReached >= config.maxLength,
      score: calculateSequenceScore(lengthReached, hintsUsedThisGame, config.maxLength),
    });
  };

  const handleSymbolPress = (symbolIndex: SymbolIndex) => {
    if (phase !== 'waiting_input') return;

    const newInput = [...playerInput, symbolIndex];
    const result = checkPlayerInput(sequence, newInput);

    if (result === 'wrong') {
      playSfx('wrong');
      endWith(sequence.length - 1);
      return;
    }

    playSfx(`note${symbolIndex}`);
    setPlayerInput(newInput);

    if (result === 'complete') {
      // Onglet Jeux : pas de longueur maximale, on va aussi loin que possible
      if (!arcade && sequence.length >= config.capLength) {
        endWith(sequence.length);
        return;
      }
      if (sequence.length === config.maxLength) playSfx('victory');
      // niveau suivant : on étend la séquence et on la rejoue
      const nextSequence = extendSequence(sequence);
      setSequence(nextSequence);
      setPhase('checking');
      timeoutsRef.current.push(setTimeout(() => playSequence(nextSequence), sequence.length === config.maxLength ? 1400 : 600));
    }
  };

  // Sur ordi : touches 1 à 4 (1 2 en haut, 3 4 en bas, comme les cases)
  useGameKeys((key, event) => {
    if (phase === 'ready' && (key === ' ' || key === 'Enter')) {
      handleReady();
      return;
    }
    const index = '1234'.indexOf(key);
    if (index < 0 || event.repeat) return false;
    if (phase === 'waiting_input') handleSymbolPress(index as SymbolIndex);
  });

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
        {arcade
          ? tr(`Séquence : ${sequence.length}`, `Sequence: ${sequence.length}`)
          : isBonus
          ? tr(`Séquence : ${sequence.length} · bonus (max ${config.capLength})`, `Sequence: ${sequence.length} · bonus (max ${config.capLength})`)
          : tr(`Séquence : ${sequence.length} / ${config.maxLength}`, `Sequence: ${sequence.length} / ${config.maxLength}`)}
      </Text>
      {/* Objectif tout juste atteint : on annonce la suite en bonus */}
      {!arcade && isBonus && sequence.length === config.maxLength + 1 && phase !== 'waiting_input' && (
        <Text style={styles.bonusBanner}>
          {tr('🎉 Objectif atteint ! Continue pour des points bonus : ça va accélérer…', '🎉 Goal reached! Keep going for bonus points: it’ll speed up…')}
        </Text>
      )}
      {/* Bandeau très visible : qui joue ? (retour testeur : "pas clair quand ce n'est plus à toi") */}
      <View style={[styles.turnBanner, phase === 'waiting_input' ? styles.turnBannerYou : styles.turnBannerWatch]}>
        <Text style={styles.turnTitle}>
          {phase === 'waiting_input' ? tr('👉 À toi !', '👉 Your turn!') : phase === 'ready' ? tr('🎵 Prêt ?', '🎵 Ready?') : tr('👀 Regarde bien…', '👀 Watch closely…')}
        </Text>
        <Text style={styles.turnDetail}>
          {phase === 'waiting_input'
            ? tr(`Reproduis la séquence : ${playerInput.length} / ${sequence.length}`, `Repeat the sequence: ${playerInput.length} / ${sequence.length}`)
            : phase === 'ready'
            ? tr('Les couleurs vont s’allumer une par une : retiens leur ordre', 'The colours will light up one by one: remember their order')
            : tr('Retiens l’ordre des couleurs', 'Remember the order of the colours')}
        </Text>
      </View>

      {phase === 'ready' && (
        <Pressable style={styles.readyButton} onPress={handleReady} accessibilityRole="button">
          <Text style={styles.readyButtonText}>{tr('▶ Je suis prêt', '▶ I’m ready')}</Text>
        </Pressable>
      )}

      <View style={styles.symbolGrid}>
        {([0, 1, 2, 3] as SymbolIndex[]).map((symbolIndex) => (
          <Pressable
            key={symbolIndex}
            disabled={phase !== 'waiting_input'}
            onPress={() => handleSymbolPress(symbolIndex)}
            style={[
              styles.symbolButton,
              { backgroundColor: SYMBOL_COLORS[symbolIndex] },
              // Pendant la démonstration, les couleurs non allumées sont estompées : on voit bien laquelle s'allume
              phase === 'showing' && highlightedSymbol !== symbolIndex && styles.symbolDimmed,
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
        <Text style={styles.hintButtonText}>{tr('💡 Revoir la séquence', '💡 See the sequence again')}</Text>
      </Pressable>

      {isBonus && (
        <Pressable style={styles.stopButton} onPress={() => endWith(sequence.length - 1)} accessibilityRole="button">
          <Text style={styles.stopButtonText}>{tr('✓ Terminer avec ce score', '✓ Finish with this score')}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  readyButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  readyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progress: {
    fontSize: 13,
    color: '#b7c8da',
    marginBottom: 8,
  },
  turnBanner: {
    alignSelf: 'stretch',
    borderRadius: 14,
    borderWidth: 2,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 28,
  },
  turnBannerWatch: {
    backgroundColor: '#2e1a5c',
    borderColor: '#a78bfa',
  },
  turnBannerYou: {
    backgroundColor: '#12301f',
    borderColor: '#34d399',
  },
  turnTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  turnDetail: {
    fontSize: 13,
    color: '#cdd9e5',
    marginTop: 4,
  },
  symbolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    width: 220,
  },
  symbolDimmed: {
    opacity: 0.35,
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
    backgroundColor: '#2a2208',
    borderColor: '#6b5410',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  bonusBanner: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fbbf24',
    textAlign: 'center',
    marginBottom: 10,
  },
  stopButton: {
    marginTop: 12,
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  hintButtonDisabled: {
    opacity: 0.3,
  },
  hintButtonText: {
    color: '#f59e0b',
    fontSize: 12,
  },
});