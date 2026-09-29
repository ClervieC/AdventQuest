import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GameComponentProps } from '../../components/GameWrapper/types';
import { useI18n } from '../../services/i18n';
import { playSfx } from '../../services/sfx';
import { calculatePairsScore, createDeck, isComplete, PairCard, PAIRS_SETTINGS } from './logic';

const MISMATCH_MS = 750; // temps pour voir deux cartes différentes avant qu'elles se retournent
const PEEK_MS = 1300; // indice : toutes les cartes visibles un instant

// Ce composant n'est monté qu'au clic sur « Jouer » : le chrono démarre au montage
export function PairsGame({ onGameEnd, hintsAvailable, onUseHint, difficulty = 'easy' }: GameComponentProps) {
  const { tr } = useI18n();
  const settings = PAIRS_SETTINGS[difficulty] ?? PAIRS_SETTINGS.medium;
  const rows = (settings.pairs * 2) / settings.columns;
  const { width } = useWindowDimensions();
  const cardSize = Math.min(78, Math.floor((width - 40 - (settings.columns - 1) * 8) / settings.columns));

  const [cards, setCards] = useState<PairCard[]>(() => createDeck(settings.pairs));
  const [open, setOpen] = useState<number[]>([]); // cartes retournées pas encore appariées (0, 1 ou 2)
  const [peeking, setPeeking] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(settings.timeLimitSeconds);
  const mistakesRef = useRef(0);
  const endedRef = useRef(false);
  const secondsRef = useRef(secondsLeft);
  secondsRef.current = secondsLeft;

  const finish = (success: boolean) => {
    if (endedRef.current) return;
    endedRef.current = true;
    onGameEnd({ success, score: success ? calculatePairsScore(mistakesRef.current, secondsRef.current) : 0 });
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

  const flip = (index: number) => {
    if (endedRef.current || peeking || open.length >= 2 || open.includes(index) || cards[index].matched) return;
    playSfx('card');
    const nextOpen = [...open, index];
    setOpen(nextOpen);
    if (nextOpen.length < 2) return;

    const [a, b] = nextOpen;
    if (cards[a].symbol === cards[b].symbol) {
      const next = cards.map((card, i) => (i === a || i === b ? { ...card, matched: true } : card));
      setCards(next);
      setOpen([]);
      playSfx('correct');
      if (isComplete(next)) setTimeout(() => finish(true), 500);
    } else {
      mistakesRef.current += 1;
      setTimeout(() => {
        playSfx('wrong');
        setOpen([]);
      }, MISMATCH_MS);
    }
  };

  const handleHint = () => {
    if (hintsAvailable === 0 || peeking || endedRef.current) return;
    onUseHint();
    setOpen([]);
    setPeeking(true);
    setTimeout(() => setPeeking(false), PEEK_MS);
  };

  const found = cards.filter((c) => c.matched).length / 2;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.found}>{tr(`Paires : ${found} / ${settings.pairs}`, `Pairs: ${found} / ${settings.pairs}`)}</Text>
        <Text style={[styles.timer, secondsLeft <= 10 && styles.timerLow]}>⏱ {secondsLeft}s</Text>
      </View>

      <View style={[styles.grid, { width: settings.columns * cardSize + (settings.columns - 1) * 8, height: rows * cardSize + (rows - 1) * 8 }]}>
        {cards.map((card, index) => {
          const visible = card.matched || open.includes(index) || peeking;
          return (
            <Pressable
              key={card.id}
              onPress={() => flip(index)}
              style={[
                styles.card,
                { width: cardSize, height: cardSize },
                visible ? styles.cardFace : styles.cardBack,
                card.matched && styles.cardMatched,
              ]}
              accessibilityLabel={visible ? card.symbol : tr('Carte cachée', 'Hidden card')}
            >
              <Text style={{ fontSize: cardSize * (visible ? 0.5 : 0.36) }}>{visible ? card.symbol : '❄️'}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.help}>{tr('Retourne deux cartes : si elles sont identiques, elles restent visibles.', 'Turn over two cards: if they match, they stay face up.')}</Text>

      <Pressable style={[styles.hintButton, hintsAvailable === 0 && styles.disabled]} onPress={handleHint} disabled={hintsAvailable === 0}>
        <Text style={styles.hintButtonText}>{tr('💡 Voir toutes les cartes un instant', '💡 Peek at all the cards')}</Text>
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
  found: {
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cardBack: {
    backgroundColor: '#2e1a5c',
    borderColor: '#5b45a0',
  },
  cardFace: {
    backgroundColor: '#f5f5f0',
    borderColor: '#e2e8f0',
  },
  cardMatched: {
    backgroundColor: '#d1fae5',
    borderColor: '#34d399',
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
