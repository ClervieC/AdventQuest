import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '../../store/gameStore';
import { GameResult } from './types';

interface GameWrapperProps {
  day: number;
  fragmentName: string;
  fragmentIcon: string;
  storyIntro: string;
  children: (props: { onGameEnd: (result: GameResult) => void; hintsAvailable: number; onUseHint: () => void }) => React.ReactNode;
}

export function GameWrapper({ day, fragmentName, fragmentIcon, storyIntro, children }: GameWrapperProps) {
  const insets = useSafeAreaInsets();
  const { hints, useHint, finishAttempt, canPlay, days } = useGameStore();
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro');
  const [result, setResult] = useState<GameResult | null>(null);

  const dayState = days[day];
  const alreadyWon = dayState?.fragmentWon ?? false;

  const handleGameEnd = (gameResult: GameResult) => {
    finishAttempt(day, gameResult.score, gameResult.success);
    setResult(gameResult);
    setPhase('result');
  };

  const handleStart = () => setPhase('playing');

  const handleRetry = () => setPhase('intro');

  const handleBackToCalendar = () => router.back();

  // Sécurité : si on ne peut plus jouer (jour passé), affichage lecture seule
  if (!canPlay(day) && phase !== 'result') {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.dayLabel}>Jour {day} / 24</Text>
        <Text style={styles.title}>{fragmentIcon} {fragmentName}</Text>
        {alreadyWon ? (
          <Text style={styles.lockedText}>✅ Fragment déjà obtenu — score : {dayState.bestScore}</Text>
        ) : (
          <Text style={styles.lockedTextFailed}>❌ Ce fragment est perdu — tu n'as pas joué à temps</Text>
        )}
        <Pressable style={styles.backButton} onPress={handleBackToCalendar}>
          <Text style={styles.backButtonText}>Retour au calendrier</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      {phase === 'intro' && (
        <View style={styles.introContainer}>
          <Text style={styles.dayLabel}>Jour {day} / 24</Text>
          <Text style={styles.title}>{fragmentIcon} {fragmentName}</Text>
          <Text style={styles.story}>{storyIntro}</Text>

          {dayState && dayState.attempts > 0 && (
            <Text style={styles.bestScore}>Meilleur score : {dayState.bestScore}</Text>
          )}

          <View style={styles.hintsRow}>
            <Text style={styles.hintsLabel}>💡 {hints} hints disponibles</Text>
          </View>

          <Pressable style={styles.playButton} onPress={handleStart}>
            <Text style={styles.playButtonText}>
              {dayState && dayState.attempts > 0 ? '↩ Rejouer' : '▶ Jouer maintenant'}
            </Text>
          </Pressable>
        </View>
      )}

      {phase === 'playing' && (
        <View style={styles.gameContainer}>
          {children({ onGameEnd: handleGameEnd, hintsAvailable: hints, onUseHint: useHint })}
        </View>
      )}

      {phase === 'result' && result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultIcon}>{result.success ? '🎉' : '😔'}</Text>
          <Text style={styles.resultTitle}>
            {result.success ? 'Fragment obtenu !' : 'Pas cette fois...'}
          </Text>
          <Text style={styles.resultScore}>Score : {result.score}</Text>

          {result.success && (
            <View style={styles.fragmentReveal}>
              <Text style={styles.fragmentIcon}>{fragmentIcon}</Text>
              <Text style={styles.fragmentName}>{fragmentName}</Text>
            </View>
          )}

          <View style={styles.resultButtons}>
            {canPlay(day) && (
              <Pressable style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.retryButtonText}>↩ Rejouer</Text>
              </Pressable>
            )}
            <Pressable style={styles.backButton} onPress={handleBackToCalendar}>
              <Text style={styles.backButtonText}>Retour au calendrier</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1521',
    paddingHorizontal: 20,
  },
  dayLabel: {
    fontSize: 11,
    letterSpacing: 2,
    color: '#3a5a7a',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  story: {
    fontSize: 13,
    color: '#4a6a8a',
    marginTop: 16,
    lineHeight: 20,
  },
  introContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  bestScore: {
    fontSize: 12,
    color: '#34d399',
    marginTop: 16,
  },
  hintsRow: {
    marginTop: 20,
  },
  hintsLabel: {
    fontSize: 12,
    color: '#a78bfa',
  },
  playButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  gameContainer: {
    flex: 1,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultIcon: {
    fontSize: 48,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
  },
  resultScore: {
    fontSize: 14,
    color: '#7a9ab8',
    marginTop: 8,
  },
  fragmentReveal: {
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: '#090e18',
    borderRadius: 12,
    padding: 16,
  },
  fragmentIcon: {
    fontSize: 32,
  },
  fragmentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fbbf24',
    marginTop: 8,
  },
  resultButtons: {
    marginTop: 32,
    width: '100%',
    gap: 10,
  },
  retryButton: {
    backgroundColor: '#1e0d40',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#c4b5fd',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#162540',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#7a9ab8',
    fontSize: 14,
    fontWeight: '600',
  },
  lockedText: {
    fontSize: 14,
    color: '#34d399',
    marginTop: 24,
  },
  lockedTextFailed: {
    fontSize: 14,
    color: '#f87171',
    marginTop: 24,
  },
});