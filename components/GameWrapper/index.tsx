import { router, useNavigation } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getZoneForDay } from '../../constants/zones';
import { FeedbackForm } from '../FeedbackForm';
import { FragmentHeart } from '../FragmentHeart';
import { playSfx } from '../../services/sfx';
import { SoundToggle } from '../SoundToggle';
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
  const { hints, useHint, finishAttempt, canPlay, isLocked, canTest, role, days, bossUnlocked, totalFragments } = useGameStore();
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro');
  const [result, setResult] = useState<GameResult | null>(null);
  const [attemptId, setAttemptId] = useState(0); // un formulaire de retour neuf à chaque partie
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [testHintsLeft, setTestHintsLeft] = useState(TEST_HINTS_PER_GAME);

  const dayState = days[day];
  const alreadyWon = dayState?.fragmentWon ?? false;
  // Jour futur ouvert en avance pour un testeur/admin : la partie est enregistrée (classement marqué 🧪)
  const isTestMode = isLocked(day) && canTest(day);
  // Jour passé : entraînement, rien n'est enregistré
  const isPractice = !canPlay(day) && !isTestMode;
  const canGiveFeedback = role === 'tester' || role === 'admin';

  const handleGameEnd = (gameResult: GameResult) => {
    if (!isPractice) finishAttempt(day, gameResult.score, gameResult.success);
    // Le son "fragment" est réservé aux vrais fragments ; en entraînement, simple son de victoire
    if (!gameResult.success) playSfx('failure');
    else if (isPractice) playSfx('victory');
    else playSfx('fragment');
    setResult(gameResult);
    setAttemptId((id) => id + 1);
    setPhase('result');
  };

  const isBoss = day === BOSS_DAY;
  // Hints : vrais hints le jour même ; en mode test, 3 hints offerts par partie (sans toucher au vrai stock)
  // pour pouvoir les tester ; aucun en entraînement ni contre le boss (règle du jeu)
  const hintsAllowed = !isPractice && !isTestMode && !isBoss;
  const testHintsAllowed = isTestMode && !isBoss;
  const noop = () => {};
  const useTestHint = () => setTestHintsLeft((n) => Math.max(0, n - 1));

  const handleStart = () => {
    setTestHintsLeft(TEST_HINTS_PER_GAME);
    setPhase('playing');
  };

  const handleRetry = () => setPhase('intro');

  // ----- Quitter une partie en cours : confirmation (bouton, retour Android, geste iPhone) -----
  const navigation = useNavigation();
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const leavingRef = useRef(false);
  const pendingActionRef = useRef<Parameters<typeof navigation.dispatch>[0] | null>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (phaseRef.current !== 'playing' || leavingRef.current) return;
      event.preventDefault();
      pendingActionRef.current = event.data.action;
      setConfirmLeave(true);
    });
    return unsubscribe;
  }, [navigation]);

  // Le geste "glisser pour revenir" d'iPhone ne peut pas être intercepté : on le désactive pendant la partie
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: phase !== 'playing' });
  }, [navigation, phase]);

  // Version web : le bouton "retour" du navigateur ne prévient pas l'app. Pendant la partie, on ajoute une
  // entrée d'historique "tampon" : le retour la consomme, on la remet et on affiche la confirmation.
  // On protège aussi le rechargement / la fermeture de l'onglet.
  const webGuardRef = useRef(false);
  useEffect(() => {
    if (Platform.OS !== 'web' || phase !== 'playing' || typeof window === 'undefined') return;
    window.history.pushState({ adventquestGuard: true }, '', window.location.href);
    webGuardRef.current = true;
    const onPopState = () => {
      if (leavingRef.current) return;
      window.history.pushState({ adventquestGuard: true }, '', window.location.href);
      pendingActionRef.current = null;
      setConfirmLeave(true);
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('popstate', onPopState);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [phase]);

  // Fin de partie normale (écran de résultat) : on retire l'entrée tampon pour que "retour" marche normalement
  useEffect(() => {
    if (Platform.OS === 'web' && phase !== 'playing' && webGuardRef.current && !leavingRef.current) {
      webGuardRef.current = false;
      leavingRef.current = true; // le "retour" qui suit ne doit pas redemander confirmation
      window.history.back();
      setTimeout(() => {
        leavingRef.current = false;
      }, 300);
    }
  }, [phase]);

  const leaveNow = () => {
    leavingRef.current = true;
    setConfirmLeave(false);
    if (Platform.OS === 'web' && webGuardRef.current) {
      // Sur le web : retire l'entrée tampon, puis revient au calendrier (même si on est arrivé directement sur le jour)
      webGuardRef.current = false;
      window.history.back();
      setTimeout(() => (router.canGoBack() ? router.back() : router.replace('/')), 50);
      return;
    }
    if (pendingActionRef.current) navigation.dispatch(pendingActionRef.current);
    else if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const handleBackToCalendar = () => {
    if (phase === 'playing') {
      pendingActionRef.current = null;
      setConfirmLeave(true);
      return;
    }
    leaveNow();
  };

  const backButton = (
    <View style={styles.headerRow}>
      <Pressable style={styles.headerBack} onPress={handleBackToCalendar} hitSlop={12}>
        <Text style={styles.headerBackText}>‹ Calendrier</Text>
      </Pressable>
      <View style={styles.headerActions}>
        {/* Testeurs : donner son avis à tout moment, même si le jeu ne va pas jusqu'au bout */}
        {canGiveFeedback && phase !== 'result' && (
          <Pressable style={styles.feedbackButton} onPress={() => setFeedbackOpen(true)} hitSlop={6} accessibilityLabel="Donner mon avis de testeur">
            <Text style={styles.feedbackButtonText}>💬 Avis</Text>
          </Pressable>
        )}
        <SoundToggle />
      </View>
    </View>
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

  // Sécurité : un jour futur n'est jamais jouable (sauf accès testeur)
  if (isLocked(day) && !isTestMode) {
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

          {isTestMode && (
            <View style={[styles.practiceBanner, styles.testBanner]}>
              <Text style={styles.practiceTitle}>🧪 Mode test</Text>
              <Text style={styles.practiceText}>
                Ce jour est ouvert en avance pour toi. {`Ton score compte dans le classement (marqué 🧪). Tu as ${TEST_HINTS_PER_GAME} hints offerts pour les tester, et le bouton « 💬 Avis » en haut reste disponible pendant toute la partie.`}
              </Text>
            </View>
          )}

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
                {isBoss
                  ? '🚫 Aucun hint contre le boss'
                  : isTestMode
                  ? `💡 ${TEST_HINTS_PER_GAME} hints offerts pour le test`
                  : `💡 ${hints} hints disponibles`}
              </Text>
            </View>
          )}

          <Pressable style={styles.playButton} onPress={handleStart}>
            <Text style={styles.playButtonText}>
              {isTestMode ? '▶ Tester' : isPractice ? "▶ S'entraîner" : dayState && dayState.attempts > 0 ? '↩ Rejouer' : '▶ Jouer maintenant'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Toujours rendu pour pré-charger Phaser pendant l'intro, caché si pas encore joué */}
      <View style={[styles.gameContainer, phase !== 'playing' && styles.hidden]}>
        {children({
          onGameEnd: handleGameEnd,
          hintsAvailable: hintsAllowed ? hints : testHintsAllowed ? testHintsLeft : 0,
          onUseHint: hintsAllowed ? useHint : testHintsAllowed ? useTestHint : noop,
          isStarted: phase === 'playing',
        })}
      </View>

      {phase === 'result' && result && (
        <ScrollView style={styles.resultScroll} contentContainerStyle={styles.resultContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.resultIcon}>{result.success ? '🎉' : '😔'}</Text>
          <Text style={styles.resultTitle}>
            {!result.success ? 'Pas cette fois...' : isPractice ? 'Bien joué !' : 'Fragment obtenu !'}
          </Text>
          <Text style={styles.resultScore}>Score : {result.score}</Text>
          {isPractice && <Text style={styles.practiceText}>Entraînement — score non enregistré</Text>}
          {isTestMode && <Text style={styles.practiceText}>🧪 Mode test — score enregistré</Text>}

          {result.success && !isPractice && (
            <FragmentHeart
              day={day}
              icon={fragmentIcon}
              name={fragmentName}
              wonDays={Object.entries(days)
                .filter(([, state]) => state.fragmentWon)
                .map(([d]) => Number(d))}
            />
          )}

          <View style={styles.resultButtons}>
            {(!isLocked(day) || isTestMode) && (
              <Pressable style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.retryButtonText}>↩ Rejouer</Text>
              </Pressable>
            )}
            <Pressable style={styles.backButton} onPress={handleBackToCalendar}>
              <Text style={styles.backButtonText}>Retour au calendrier</Text>
            </Pressable>
          </View>

          {/* Testeurs et admin : commentaire envoyé à l'admin (nouveau formulaire à chaque partie) */}
          {canGiveFeedback && <FeedbackForm key={attemptId} day={day} />}
        </ScrollView>
      )}

      {confirmLeave && (
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Quitter la partie ?</Text>
            <Text style={styles.dialogText}>
              {isPractice || isTestMode ? 'La partie en cours sera perdue.' : 'La partie en cours sera perdue et ne comptera pas.'}
            </Text>
            <View style={styles.dialogButtons}>
              <Pressable style={[styles.dialogButton, styles.dialogStay]} onPress={() => setConfirmLeave(false)}>
                <Text style={styles.dialogStayText}>Continuer à jouer</Text>
              </Pressable>
              <Pressable style={[styles.dialogButton, styles.dialogLeave]} onPress={leaveNow}>
                <Text style={styles.dialogLeaveText}>Quitter</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {feedbackOpen && (
        <View style={styles.overlay}>
          <ScrollView style={styles.feedbackScroll} contentContainerStyle={styles.feedbackContent} keyboardShouldPersistTaps="handled">
            <Pressable onPress={() => setFeedbackOpen(false)} style={styles.feedbackClose} hitSlop={10}>
              <Text style={styles.feedbackCloseText}>✕ Fermer et revenir au jeu</Text>
            </Pressable>
            <FeedbackForm day={day} />
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const TEST_HINTS_PER_GAME = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1521',
    paddingHorizontal: 20,
  },
  dayLabel: {
    fontSize: 11,
    letterSpacing: 2,
    color: '#8ea6c0',
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
    color: '#a3b8cd',
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
  resultScroll: {
    flex: 1,
  },
  testBanner: {
    backgroundColor: '#12301f',
    borderColor: '#2f6b4a',
  },
  resultContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 24,
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
    color: '#b7c8da',
    marginTop: 8,
  },
  resultButtons: {
    marginTop: 32,
    width: '100%',
    gap: 10,
  },
  retryButton: {
    backgroundColor: '#2e1a5c',
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
    backgroundColor: '#243a5a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#b7c8da',
    fontSize: 14,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackButton: {
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
    backgroundColor: '#2e1a5c',
    borderWidth: 1,
    borderColor: '#5b45a0',
    justifyContent: 'center',
  },
  feedbackButtonText: {
    color: '#c4b5fd',
    fontSize: 13,
    fontWeight: '700',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 9, 16, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 100,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#16233a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3a5a82',
    padding: 20,
    gap: 10,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  dialogText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#b7c8da',
  },
  dialogButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  dialogButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dialogStay: {
    backgroundColor: '#7c3aed',
  },
  dialogStayText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  dialogLeave: {
    backgroundColor: '#243a5a',
  },
  dialogLeaveText: {
    color: '#f87171',
    fontSize: 14,
    fontWeight: '700',
  },
  feedbackScroll: {
    width: '100%',
    maxWidth: 420,
  },
  feedbackContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  feedbackClose: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
  },
  feedbackCloseText: {
    color: '#b7c8da',
    fontSize: 13,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerBack: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingRight: 12,
    marginBottom: 4,
  },
  headerBackText: {
    color: '#b7c8da',
    fontSize: 15,
    fontWeight: '600',
  },
  practiceBanner: {
    marginTop: 20,
    backgroundColor: '#1a1530',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#5b45a0',
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
    color: '#bcb2e3',
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