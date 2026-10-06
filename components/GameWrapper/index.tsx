import { router, useNavigation } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getZoneForDay } from '../../constants/zones';
import { GameTutorial as Tutorial } from '../../constants/tutorials';
import { AllFragmentsCelebration, markAllFragmentsCelebrated } from '../AllFragmentsCelebration';
import { FeedbackForm } from '../FeedbackForm';
import { GameTutorial } from '../GameTutorial';
import { FragmentHeart } from '../FragmentHeart';
import { useI18n } from '../../services/i18n';
import { playSfx } from '../../services/sfx';
import { clearTestHintsLeft, loadTestHintsLeft, saveTestHintsLeft } from '../../services/testHints';
import { SoundToggle } from '../SoundToggle';
import { BOSS_DAY, FRAGMENT_THRESHOLD, useGameStore } from '../../store/gameStore';
import { dayRecordKey, useRecordsStore } from '../../store/recordsStore';
import { CONTENT_WIDTH, pageColumn } from '../../constants/layout';
import { BONUS_MAX_POINTS, DAY_SCORE_INFO, dayPoints, DayPoints, WIN_MAX_POINTS, WIN_MIN_POINTS } from '../../constants/scoring';
import { ScoreRules } from '../ScoreRules';
import { GameResult } from './types';

interface GameWrapperProps {
  day: number;
  fragmentName: string;
  fragmentIcon: string;
  storyIntro: string;
  tutorial?: Tutorial; // « Comment jouer » affiché avant de lancer la partie
  arcade?: boolean; // lancé depuis l'onglet Jeux : toujours en entraînement (rien d'enregistré), rejouable à l'infini
  recordKey?: string; // clé du record personnel (par défaut : le jeu du jour)
  recordFloor?: number; // record déjà établi ailleurs (calendrier...) à prendre en compte
  introExtra?: React.ReactNode; // contenu en plus sous le tutoriel de l'intro (ex. records entre amis)
  children: (props: { onGameEnd: (result: GameResult) => void; hintsAvailable: number; onUseHint: () => void; isStarted: boolean }) => React.ReactNode;
}

export function GameWrapper({ day, fragmentName, fragmentIcon, storyIntro, tutorial, arcade = false, recordKey, recordFloor = 0, introExtra, children }: GameWrapperProps) {
  const insets = useSafeAreaInsets();
  const { tr, l } = useI18n();
  // Haut de la zone de jeu (sous l'en-tête) : le jeu préchargé pendant l'intro est placé exactement là,
  // sinon Phaser calcule sa mise en page sur une autre taille (éléments coupés à droite, grille décalée)
  const [gameTop, setGameTop] = useState(0);
  // Marge gauche/droite de la zone de jeu : centrée à la largeur du calendrier sur ordi, pleine largeur sur téléphone
  const { width: screenWidth } = useWindowDimensions();
  const gameSide = Math.max(0, (screenWidth - COLUMN_MAX_WIDTH) / 2) + CONTAINER_PADDING;
  const { hints, useHint, finishAttempt, canPlay, isLocked, canTest, role, days, bossUnlocked, totalFragments, username } = useGameStore();
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro');
  const [result, setResult] = useState<GameResult | null>(null);
  const [attemptId, setAttemptId] = useState(0); // un formulaire de retour neuf à chaque partie
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [testHintsLeft, setTestHintsLeft] = useState(TEST_HINTS_PER_GAME);
  const [celebrateAll, setCelebrateAll] = useState(false);
  // Record personnel : celui d'avant la partie, et si la partie vient de le battre
  const [recordInfo, setRecordInfo] = useState<{ previous: number; isNew: boolean } | null>(null);
  // Détail du score : partie normale (plafonnée à 2 000) + temps additionnel
  const [scoreDetail, setScoreDetail] = useState<DayPoints | null>(null);

  // Hints de test déjà utilisés sur ce jour (partie reprise après être sorti) : on ne repart pas à 3
  useEffect(() => {
    let cancelled = false;
    loadTestHintsLeft(username, day).then((left) => {
      if (!cancelled && left !== null) setTestHintsLeft(Math.min(TEST_HINTS_PER_GAME, left));
    });
    return () => {
      cancelled = true;
    };
  }, [username, day]);

  const dayState = days[day];
  const alreadyWon = dayState?.fragmentWon ?? false;
  // Jour futur ouvert en avance pour un testeur/admin : la partie est enregistrée (classement marqué 🧪)
  const isTestMode = !arcade && isLocked(day) && canTest(day);
  // Jour passé : entraînement, rien n'est enregistré
  const isPractice = arcade || (!canPlay(day) && !isTestMode);
  // Où revenir en quittant : l'onglet Jeux ou le calendrier
  const home = arcade ? '/games' : '/';
  const canGiveFeedback = role === 'tester' || role === 'admin';

  const handleGameEnd = (rawResult: GameResult) => {
    // Calendrier (et entraînement) : barème commun à tous les jours (500 à 1 000 si gagné + bonus jusqu'à 500,
    // 50 à 200 si perdu), voir constants/scoring.ts. Onglet Jeux : score brut du jeu.
    const detail = arcade ? null : dayPoints(day, rawResult.score, rawResult.bonus ?? 0, rawResult.success);
    const gameResult: GameResult = detail ? { ...rawResult, score: detail.total } : rawResult;
    setScoreDetail(detail);
    // Ce fragment est le 24e : grande fête, juste après l'arrivée du fragment autour du cœur
    const completesAll = !isPractice && gameResult.success && !alreadyWon && totalFragments() === 23;
    if (completesAll) {
      markAllFragmentsCelebrated(username);
      setTimeout(() => setCelebrateAll(true), 2200);
    }
    // Record : le meilleur entre l'onglet Jeux / l'entraînement (appareil) et les vraies parties du calendrier
    const key = recordKey ?? dayRecordKey(day);
    const calendarBest = key === dayRecordKey(day) ? dayState?.bestScore ?? 0 : 0;
    const previous = Math.max(useRecordsStore.getState().records[key] ?? 0, calendarBest, recordFloor);
    useRecordsStore.getState().submit(key, gameResult.score);
    setRecordInfo({ previous, isNew: gameResult.score > previous && gameResult.score > 0 });
    if (!isPractice) finishAttempt(day, gameResult.score, gameResult.success);
    // Le son "fragment" est réservé aux vrais fragments ; en entraînement, simple son de victoire
    if (!gameResult.success) playSfx('failure');
    else if (isPractice) playSfx('victory');
    else playSfx('fragment');
    setResult(gameResult);
    setAttemptId((id) => id + 1);
    setPhase('result');
    // Partie terminée : la prochaine repart avec tous ses hints de test
    setTestHintsLeft(TEST_HINTS_PER_GAME);
    clearTestHintsLeft(username, day);
  };

  const isBoss = day === BOSS_DAY;
  // Hints : vrais hints le jour même ; en mode test, 3 hints offerts par partie (sans toucher au vrai stock)
  // pour pouvoir les tester ; aucun en entraînement ni contre le boss (règle du jeu)
  const hintsAllowed = !isPractice && !isTestMode && !isBoss;
  const testHintsAllowed = isTestMode && !isBoss;
  const noop = () => {};
  const useTestHint = () => {
    const left = Math.max(0, testHintsLeft - 1);
    setTestHintsLeft(left);
    saveTestHintsLeft(username, day, left);
  };

  const handleStart = () => setPhase('playing');

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
      setTimeout(() => (router.canGoBack() ? router.back() : router.replace(home)), 50);
      return;
    }
    if (pendingActionRef.current) navigation.dispatch(pendingActionRef.current);
    else if (router.canGoBack()) router.back();
    else router.replace(home);
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
    <View style={[styles.headerRow, styles.column]} onLayout={(e) => setGameTop(e.nativeEvent.layout.y + e.nativeEvent.layout.height + HEADER_MARGIN)}>
      <Pressable style={styles.headerBack} onPress={handleBackToCalendar} hitSlop={12}>
        <Text style={styles.headerBackText}>{arcade ? tr('‹ Jeux', '‹ Games') : tr('‹ Calendrier', '‹ Calendar')}</Text>
      </Pressable>
      <View style={styles.headerActions}>
        {/* Testeurs : donner son avis à tout moment, même si le jeu ne va pas jusqu'au bout */}
        {canGiveFeedback && phase !== 'result' && (
          <Pressable style={styles.feedbackButton} onPress={() => setFeedbackOpen(true)} hitSlop={6} accessibilityLabel={tr('Donner mon avis de testeur', 'Give my tester feedback')}>
            <Text style={styles.feedbackButtonText}>{tr('💬 Avis', '💬 Feedback')}</Text>
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
        <View style={[styles.introContainer, styles.column]}>
          <Text style={styles.dayLabel}>{tr('Jour', 'Day')} {day} / 24</Text>
          <Text style={styles.title}>{tr('🔒 Le portail est scellé', '🔒 The portal is sealed')}</Text>
          <Text style={styles.story}>
            {tr(
              `Il faut ${FRAGMENT_THRESHOLD} fragments pour affronter Grimnoir. Tu en as ${totalFragments()} : il t'en manque ${missing}.`,
              `You need ${FRAGMENT_THRESHOLD} shards to face Grimnoir. You have ${totalFragments()}: ${missing} to go.`
            )}
          </Text>
        </View>
      </View>
    );
  }

  // Sécurité : un jour futur n'est jamais jouable (sauf accès testeur)
  if (isLocked(day) && !isTestMode && !(arcade && canTest(day))) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        {backButton}
        <View style={[styles.introContainer, styles.column]}>
          <Text style={styles.dayLabel}>{tr('Jour', 'Day')} {day} / 24</Text>
          <Text style={styles.title}>{tr('🔒 Pas encore disponible', '🔒 Not available yet')}</Text>
          <Text style={styles.story}>{tr(`Reviens le jour ${day} pour tenter de récupérer ce fragment.`, `Come back on day ${day} to try and win this shard.`)}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {backButton}

      {phase === 'intro' && (
        <ScrollView style={styles.introScroll} contentContainerStyle={[styles.introContainer, styles.column]}>
          <Text style={styles.dayLabel}>
            {tr('Jour', 'Day')} {day} / 24 · {getZoneForDay(day).icon} {l(getZoneForDay(day).name)}
          </Text>
          <Text style={styles.title}>{fragmentIcon} {fragmentName}</Text>
          <Text style={styles.story}>{storyIntro}</Text>

          {/* Points à gagner, en résumé (le détail du calcul est dans « Comment jouer ») */}
          {!arcade && DAY_SCORE_INFO[day] && (
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreInfoLine}>
                {tr(
                  `🎯 Gagné : ${WIN_MIN_POINTS} à ${WIN_MAX_POINTS} pts selon ta performance`,
                  `🎯 Won: ${WIN_MIN_POINTS} to ${WIN_MAX_POINTS} pts depending on your performance`
                )}
              </Text>
              <Text style={styles.scoreInfoBonus}>
                {DAY_SCORE_INFO[day].bonus
                  ? tr(`⏱️ Bonus : jusqu’à +${BONUS_MAX_POINTS} pts · détail dans « Comment jouer »`, `⏱️ Bonus: up to +${BONUS_MAX_POINTS} pts · details in “How to play”`)
                  : tr('Détail du calcul dans « Comment jouer »', 'How it is calculated: see “How to play”')}
              </Text>
            </View>
          )}

          {tutorial && <GameTutorial tutorial={tutorial} extra={!arcade ? <ScoreRules day={day} /> : undefined} />}
          {introExtra}

          {isTestMode && (
            <View style={[styles.practiceBanner, styles.testBanner]}>
              <Text style={styles.practiceTitle}>{tr('🧪 Mode test', '🧪 Test mode')}</Text>
              <Text style={styles.practiceText}>
                {tr(
                  `Ce jour est ouvert en avance pour toi. Ton score compte dans le classement (marqué 🧪). Tu as ${TEST_HINTS_PER_GAME} hints offerts pour les tester, et le bouton « 💬 Avis » en haut reste disponible pendant toute la partie.`,
                  `This day is open early for you. Your score counts in the leaderboard (marked 🧪). You get ${TEST_HINTS_PER_GAME} free hints to try them out, and the “💬 Feedback” button at the top stays available throughout the game.`
                )}
              </Text>
            </View>
          )}

          {isPractice && (
            <View style={styles.practiceBanner}>
              <Text style={styles.practiceTitle}>{arcade ? tr('🎮 Salle de jeux', '🎮 Games room') : tr('🔁 Mode entraînement', '🔁 Practice mode')}</Text>
              <Text style={styles.practiceText}>
                {arcade
                  ? tr(
                      'Joue autant que tu veux pour t’entraîner : rien n’est enregistré, ni score ni hint.',
                      'Play as much as you like for practice: nothing is saved, neither score nor hints.'
                    )
                  : tr(
                      'Ce jour est passé : tu peux rejouer, mais ton score ne sera pas enregistré et aucun hint ne sera utilisé.',
                      'This day is over: you can play again, but your score won’t be saved and no hints will be used.'
                    )}
              </Text>
              {!arcade && (
                <Text style={alreadyWon ? styles.practiceWon : styles.practiceLost}>
                  {alreadyWon
                    ? tr(`✅ Fragment obtenu — score retenu : ${dayState?.bestScore ?? 0}`, `✅ Shard won — score kept: ${dayState?.bestScore ?? 0}`)
                    : tr('❌ Fragment perdu', '❌ Shard lost')}
                </Text>
              )}
            </View>
          )}

          {!isPractice && dayState && dayState.attempts > 0 && (
            <Text style={styles.bestScore}>{tr('Meilleur score : ', 'Best score: ')}{dayState.bestScore}</Text>
          )}

          {!isPractice && (
            <View style={styles.hintsRow}>
              <Text style={styles.hintsLabel}>
                {isBoss
                  ? tr('🚫 Aucun hint contre le boss', '🚫 No hints against the boss')
                  : isTestMode
                  ? tr(`💡 ${testHintsLeft} / ${TEST_HINTS_PER_GAME} hints offerts pour le test`, `💡 ${testHintsLeft} / ${TEST_HINTS_PER_GAME} free hints for testing`)
                  : tr(`💡 ${hints} hints disponibles`, `💡 ${hints} hints available`)}
              </Text>
            </View>
          )}

          <Pressable style={styles.playButton} onPress={handleStart}>
            <Text style={styles.playButtonText}>
              {isTestMode
                ? tr('▶ Tester', '▶ Test')
                : isPractice
                ? tr("▶ S'entraîner", '▶ Practise')
                : dayState && dayState.attempts > 0
                ? tr('↩ Rejouer', '↩ Play again')
                : tr('▶ Jouer maintenant', '▶ Play now')}
            </Text>
          </Pressable>
        </ScrollView>
      )}

      {/* Toujours rendu pour pré-charger Phaser pendant l'intro, caché si pas encore joué */}
      <View
        style={
          phase === 'playing'
            ? [styles.gameContainer, styles.column]
            : [styles.hidden, { top: gameTop, left: gameSide, right: gameSide }]
        }
      >
        {children({
          onGameEnd: handleGameEnd,
          hintsAvailable: hintsAllowed ? hints : testHintsAllowed ? testHintsLeft : 0,
          onUseHint: hintsAllowed ? useHint : testHintsAllowed ? useTestHint : noop,
          isStarted: phase === 'playing',
        })}
      </View>

      {phase === 'result' && result && (
        <ScrollView style={styles.resultScroll} contentContainerStyle={[styles.resultContainer, styles.column]} keyboardShouldPersistTaps="handled">
          <Text style={styles.resultIcon}>{arcade ? (recordInfo?.isNew ? '🏆' : '🎮') : result.success ? '🎉' : '😔'}</Text>
          <Text style={styles.resultTitle}>
            {arcade
              ? tr('🎮 Partie terminée', '🎮 Game over')
              : !result.success
              ? tr('Pas cette fois...', 'Not this time...')
              : isPractice
              ? tr('Bien joué !', 'Well played!')
              : tr('Fragment obtenu !', 'Shard won!')}
          </Text>
          <Text style={styles.resultScore}>{tr('Score : ', 'Score: ')}{result.score}</Text>
          {scoreDetail && (
            <Text style={styles.scoreDetail}>
              {result.success
                ? tr(`Performance ${Math.round(scoreDetail.performance * 100)} % → ${scoreDetail.base} pts`, `Performance ${Math.round(scoreDetail.performance * 100)}% → ${scoreDetail.base} pts`)
                : tr('Raté : aucun point perdu, aucun gagné. Réessaie !', 'Failed: no points lost, none earned. Try again!')}
              {scoreDetail.bonus > 0 ? ` + bonus ${scoreDetail.bonus}` : ''}
            </Text>
          )}
          {recordInfo && (
            <Text style={[styles.record, recordInfo.isNew && styles.recordNew]}>
              {recordInfo.isNew
                ? tr('🏆 Nouveau record personnel !', '🏆 New personal best!')
                : tr(`🏆 Ton record : ${recordInfo.previous}`, `🏆 Your best: ${recordInfo.previous}`)}
            </Text>
          )}
          {isPractice && <Text style={styles.practiceText}>{tr('Entraînement — score non enregistré', 'Practice — score not saved')}</Text>}
          {isTestMode && <Text style={styles.practiceText}>{tr('🧪 Mode test — score enregistré', '🧪 Test mode — score saved')}</Text>}

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
            {(!isLocked(day) || isTestMode || arcade) && (
              <Pressable style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.retryButtonText}>{tr('↩ Rejouer', '↩ Play again')}</Text>
              </Pressable>
            )}
            <Pressable style={styles.backButton} onPress={handleBackToCalendar}>
              <Text style={styles.backButtonText}>{arcade ? tr('Retour aux jeux', 'Back to the games') : tr('Retour au calendrier', 'Back to the calendar')}</Text>
            </Pressable>
          </View>

          {/* Testeurs et admin : commentaire envoyé à l'admin (nouveau formulaire à chaque partie) */}
          {canGiveFeedback && <FeedbackForm key={attemptId} day={day} />}
        </ScrollView>
      )}

      {confirmLeave && (
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{tr('Quitter la partie ?', 'Quit the game?')}</Text>
            <Text style={styles.dialogText}>
              {isPractice || isTestMode
                ? tr('La partie en cours sera perdue.', 'The current game will be lost.')
                : tr('La partie en cours sera perdue et ne comptera pas.', 'The current game will be lost and won’t count.')}
            </Text>
            <View style={styles.dialogButtons}>
              <Pressable style={[styles.dialogButton, styles.dialogStay]} onPress={() => setConfirmLeave(false)}>
                <Text style={styles.dialogStayText}>{tr('Continuer à jouer', 'Keep playing')}</Text>
              </Pressable>
              <Pressable style={[styles.dialogButton, styles.dialogLeave]} onPress={leaveNow}>
                <Text style={styles.dialogLeaveText}>{tr('Quitter', 'Quit')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      <AllFragmentsCelebration visible={celebrateAll} onClose={() => setCelebrateAll(false)} />

      {feedbackOpen && (
        <View style={styles.overlay}>
          <ScrollView style={styles.feedbackScroll} contentContainerStyle={styles.feedbackContent} keyboardShouldPersistTaps="handled">
            <Pressable onPress={() => setFeedbackOpen(false)} style={styles.feedbackClose} hitSlop={10}>
              <Text style={styles.feedbackCloseText}>{tr('✕ Fermer et revenir au jeu', '✕ Close and return to the game')}</Text>
            </Pressable>
            <FeedbackForm day={day} />
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const TEST_HINTS_PER_GAME = 3;

const CONTAINER_PADDING = 20;
const HEADER_MARGIN = 4;
const COLUMN_MAX_WIDTH = CONTENT_WIDTH + CONTAINER_PADDING * 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1521',
  },
  // Contenu centré à la largeur du calendrier (la page et sa barre de défilement restent pleine largeur)
  column: pageColumn(CONTAINER_PADDING),
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
  introScroll: {
    flex: 1,
  },
  introContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 24,
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
  // Même rectangle que la zone de jeu visible (left/right/top calculés au rendu), sous l'en-tête
  hidden: {
    position: 'absolute',
    opacity: 0,
    pointerEvents: 'none',
    bottom: 0,
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
  scoreInfo: {
    marginTop: 14,
    backgroundColor: '#1f1a0c',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6b5410',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 4,
  },
  scoreInfoLine: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fbbf24',
  },
  scoreInfoBonus: {
    fontSize: 12,
    lineHeight: 17,
    color: '#e5d3a1',
  },
  scoreDetail: {
    fontSize: 12,
    color: '#fbbf24',
    marginTop: 4,
  },
  record: {
    fontSize: 13,
    color: '#b7c8da',
    marginTop: 6,
  },
  recordNew: {
    color: '#fbbf24',
    fontWeight: '700',
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
    marginBottom: HEADER_MARGIN,
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