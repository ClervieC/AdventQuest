import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getZoneForDay } from '../../constants/zones';
import { useSoundEffect } from '../../hooks/use-sound-effect';
import { BOSS_DAY, FRAGMENT_THRESHOLD, useGameStore } from '../../store/gameStore';
import { GameResult } from './types';

interface GameWrapperProps {
  day: number;
  fragmentName: string;
  fragmentIcon: string;
  storyIntro: string;
  children: (props: { onGameEnd: (result: GameResult) => void; hintsAvailable: number; onUseHint: () => void; isStarted: boolean }) => React.ReactNode;
}

export function GameWrapper({ day, fragmentName, fragmentIcon, storyIntro, children }: GameWrapperProps) {
  const insets = useSafeAreaInsets();
  const { hints, useHint, finishAttempt, canPlay, isLocked, days, bossUnlocked, totalFragments } = useGameStore();
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro');
  const [result, setResult] = useState<GameResult | null>(null);
  const playFragmentSound = useSoundEffect(require('../../assets/sounds/fragment.wav'));
  const playVictorySound = useSoundEffect(require('../../assets/sounds/victory.wav'));
  const playFailureSound = useSoundEffect(require('../../assets/sounds/failure.wav'));

  const dayState = days[day];
  const alreadyWon = dayState?.fragmentWon ?? false;
  // Jour passé : on peut rejouer pour le plaisir, mais rien n'est enregistré
  const isPractice = !canPlay(day);

  const handleGameEnd = (gameResult: GameResult) => {
    if (!isPractice) finishAttempt(day, gameResult.score, gameResult.success);
    // Le son "fragment" est réservé aux vrais fragments ; en entraînement, simple son de victoire
    if (!gameResult.success) playFailureSound();
    else if (isPractice) playVictorySound();
    else playFragmentSound();
    setResult(gameResult);
    setPhase('result');
  };

  const isBoss = day === BOSS_DAY;
  // Pas de hints en entraînement (ils restent pour les vrais jours) ni contre le boss (règle du jeu)
  const hintsAllowed = !isPractice && !isBoss;
  const noop = () => {};

  const handleStart = () => setPhase('playing');

  const handleRetry = () => setPhase('intro');

  const handleBackToCalendar = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const backButton = (
    <Pressable style={styles.headerBack} onPress={handleBackToCalendar} hitSlop={12}>
      <Text style={styles.headerBackText}>‹ Calendrier</Text>
    </Pressable>
  );

  // Le portail du boss ne s'ouvre qu'avec assez de fragments
  if (isBoss && !isLocked(day) && !bossUnlocked()) {
    const missing = FRAGMENT_THRESHOLD - totalFragments();
    return (
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        {backButton}
        <View style={styles.introContainer}>
          <Text style={styles.dayLabel}>Jour {day} / 24</Text>
          <Text style={styles.title}>🔒 Le portail est scellé</Text>
          <Text style={styles.story}>
            Il faut {FRAGMENT_THRESHOLD} fragments pour affronter Grimnoir. Tu en as {totalFragments()} : il t&apos;en manque {missing}.
          </Text>
        </View>
      </View>
    );
  }

  // Sécurité : un jour futur n'est jamais jouable
  if (isLocked(day)) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        {backButton}
        <View style={styles.introContainer}>
          <Text style={styles.dayLabel}>Jour {day} / 24</Text>
          <Text style={styles.title}>🔒 Pas encore disponible</Text>
          <Text style={styles.story}>Reviens le jour {day} pour tenter de récupérer ce fragment.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {backButton}

      {phase === 'intro' && (
        <View style={styles.introContainer}>
          <Text style={styles.dayLabel}>
            Jour {day} / 24 · {getZoneForDay(day).icon} {getZoneForDay(day).name}
          </Text>
          <Text style={styles.title}>{fragmentIcon} {fragmentName}</Text>
          <Text style={styles.story}>{storyIntro}</Text>

          {isPractice && (
            <View style={styles.practiceBanner}>
              <Text style={styles.practiceTitle}>🔁 Mode entraînement</Text>
              <Text style={styles.practiceText}>
                Ce jour est passé : tu peux rejouer, mais ton score ne sera pas enregistré et aucun hint ne sera utilisé.
              </Text>
              <Text style={alreadyWon ? styles.practiceWon : styles.practiceLost}>
                {alreadyWon
                  ? `✅ Fragment obtenu — score retenu : ${dayState?.bestScore ?? 0}`
                  : '❌ Fragment perdu'}
              </Text>
            </View>
          )}

          {!isPractice && dayState && dayState.attempts > 0 && (
            <Text style={styles.bestScore}>Meilleur score : {dayState.bestScore}</Text>
          )}

          {!isPractice && (
            <View style={styles.hintsRow}>
              <Text style={styles.hintsLabel}>
                {isBoss ? '🚫 Aucun hint contre le boss' : `💡 ${hints} hints disponibles`}
              </Text>
            </View>
          )}

          <Pressable style={styles.playButton} onPress={handleStart}>
            <Text style={styles.playButtonText}>
              {isPractice ? "▶ S'entraîner" : dayState && dayState.attempts > 0 ? '↩ Rejouer' : '▶ Jouer maintenant'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Toujours rendu pour pré-charger Phaser pendant l'intro, caché si pas encore joué */}
      <View style={[styles.gameContainer, phase !== 'playing' && styles.hidden]}>
        {children({
          onGameEnd: handleGameEnd,
          hintsAvailable: hintsAllowed ? hints : 0,
          onUseHint: hintsAllowed ? useHint : noop,
          isStarted: phase === 'playing',
        })}
      </View>

      {phase === 'result' && result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultIcon}>{result.success ? '🎉' : '😔'}</Text>
          <Text style={styles.resultTitle}>
            {!result.success ? 'Pas cette fois...' : isPractice ? 'Bien joué !' : 'Fragment obtenu !'}
          </Text>
          <Text style={styles.resultScore}>Score : {result.score}</Text>
          {isPractice && (
            <Text style={styles.practiceText}>Entraînement — score non enregistré</Text>
          )}

          {result.success && !isPractice && (
            <View style={styles.fragmentReveal}>
              <Text style={styles.fragmentIcon}>{fragmentIcon}</Text>
              <Text style={styles.fragmentName}>{fragmentName}</Text>
            </View>
          )}

          <View style={styles.resultButtons}>
            {!isLocked(day) && (
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
  hidden: {
    position: 'absolute',
    opacity: 0,
    pointerEvents: 'none',
    width: '100%',
    height: '100%',
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
  headerBack: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingRight: 12,
    marginBottom: 4,
  },
  headerBackText: {
    color: '#7a9ab8',
    fontSize: 15,
    fontWeight: '600',
  },
  practiceBanner: {
    marginTop: 20,
    backgroundColor: '#1a1530',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3b2a6b',
    padding: 14,
    gap: 6,
  },
  practiceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#c4b5fd',
  },
  practiceText: {
    fontSize: 12,
    color: '#8a7ab8',
    lineHeight: 18,
    marginTop: 4,
  },
  practiceWon: {
    fontSize: 12,
    color: '#34d399',
  },
  practiceLost: {
    fontSize: 12,
    color: '#f87171',
  },
});