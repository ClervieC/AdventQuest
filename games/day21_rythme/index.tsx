import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { GameComponentProps } from '../../components/GameWrapper/types';
import { useSettingsStore } from '../../store/settingsStore';
import { CHART_VALSE, getChart } from './charts';
import {
  applyTap,
  comboMultiplier,
  createNoteStates,
  expireMissedNotes,
  hasPassed,
  isChartFinished,
  Judgement,
  Lane,
  LANE_COUNT,
  noteProgress,
  NoteState,
  pointsFor,
  summarize,
} from './logic';

const LANE_ICONS = ['🔔', '❄️', '🎁', '⭐'];
const LANE_COLORS = ['#ef4444', '#60a5fa', '#34d399', '#fbbf24'];
const WEB_KEYS: Record<string, Lane> = { d: 0, f: 1, j: 2, k: 3 }; // pour tester au clavier dans le navigateur
const NOTE_SIZE = 44;
const HIT_LINE_OFFSET = 36; // distance entre la ligne de frappe et le bas de la zone de jeu
const HINT_DURATION_MS = 8000;
const HINT_WINDOW_SCALE = 2;
const END_DELAY_MS = 900;
const AUDIO_START_TIMEOUT_MS = 1500; // si le son ne démarre pas (autoplay bloqué...), on joue en silence
const RESYNC_INTERVAL_MS = 500;
const RESYNC_THRESHOLD_MS = 60;

// Musiques générées depuis les partitions (npm run generate:audio) : chaque note tombe sur un coup de clochette
const CARILLON_AUDIO = require('./audio/carillon.wav');
const VALSE_AUDIO = require('./audio/valse.wav');

const FEEDBACK: Record<Judgement | 'empty', { text: string; color: string }> = {
  perfect: { text: 'Parfait !', color: '#34d399' },
  good: { text: 'Bien', color: '#60a5fa' },
  miss: { text: 'Raté', color: '#f87171' },
  empty: { text: 'Trop tôt', color: '#b7c8da' },
};

// Ce composant n'est monté qu'au clic sur "Jouer" (voir app/game/[day].tsx) : le morceau démarre au montage
export function RythmeGame({ onGameEnd, hintsAvailable, onUseHint, difficulty }: GameComponentProps) {
  const chart = useMemo(() => getChart(difficulty), [difficulty]);
  const lastNoteTime = chart.notes[chart.notes.length - 1].time;

  const player = useAudioPlayer(chart === CHART_VALSE ? VALSE_AUDIO : CARILLON_AUDIO);
  const audioStatus = useAudioPlayerStatus(player);
  const muted = useSettingsStore((state) => state.muted);

  // Bouton 🔊/🔇 : la musique continue (elle sert d'horloge au jeu) mais devient muette
  useEffect(() => {
    player.volume = muted ? 0 : 1;
  }, [muted, player]);
  const audioPlayingRef = useRef(false);
  audioPlayingRef.current = audioStatus.playing;

  // Valeurs lues dans la boucle d'animation : toujours via des refs (sinon closures périmées)
  const statesRef = useRef<NoteState[]>(createNoteStates(chart));
  // null tant que le morceau n'a pas démarré : l'horloge des notes se cale sur le début réel de la musique
  const startRef = useRef<number | null>(null);
  const [silentMode, setSilentMode] = useState(false);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const hintUntilRef = useRef(0);
  const endedRef = useRef(false);
  const onGameEndRef = useRef(onGameEnd);
  onGameEndRef.current = onGameEnd;

  const [now, setNow] = useState(0);
  const [fieldHeight, setFieldHeight] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; color: string; id: number } | null>(null);
  const [pressedLane, setPressedLane] = useState<Lane | null>(null);

  const showFeedback = (kind: Judgement | 'empty') => {
    setFeedback({ ...FEEDBACK[kind], id: Date.now() });
  };

  const currentTime = () => (startRef.current === null ? 0 : performance.now() - startRef.current);
  const windowScale = (t: number) => (t < hintUntilRef.current ? HINT_WINDOW_SCALE : 1);

  // Lance la musique dès qu'elle est chargée (en mode silencieux de l'iPhone aussi)
  useEffect(() => {
    if (!audioStatus.isLoaded) return;
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    player.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioStatus.isLoaded]);

  // En quittant le jeu, les sons d'interface doivent de nouveau respecter le mode silencieux
  useEffect(() => () => {
    setAudioModeAsync({ playsInSilentMode: false }).catch(() => {});
  }, []);

  useEffect(() => {
    const mountedAt = performance.now();
    let lastResync = 0;
    let frame = 0;

    const loop = () => {
      const wallNow = performance.now();
      if (startRef.current === null) {
        if (audioPlayingRef.current) {
          startRef.current = wallNow - player.currentTime * 1000;
        } else if (wallNow - mountedAt > AUDIO_START_TIMEOUT_MS) {
          startRef.current = wallNow;
          setSilentMode(true);
        } else {
          frame = requestAnimationFrame(loop);
          return;
        }
      } else if (audioPlayingRef.current && wallNow - lastResync > RESYNC_INTERVAL_MS) {
        // Recale l'horloge sur la position réelle de la musique si elle a dérivé
        lastResync = wallNow;
        const audioMs = player.currentTime * 1000;
        if (Math.abs(wallNow - startRef.current - audioMs) > RESYNC_THRESHOLD_MS) startRef.current = wallNow - audioMs;
      }

      const t = currentTime();
      const { states, missed } = expireMissedNotes(statesRef.current, t, windowScale(t));
      if (missed > 0) {
        statesRef.current = states;
        comboRef.current = 0;
        showFeedback('miss');
      }
      setNow(t);

      if (!endedRef.current && isChartFinished(statesRef.current) && t > lastNoteTime + END_DELAY_MS) {
        endedRef.current = true;
        player.pause();
        onGameEndRef.current({ success: hasPassed(statesRef.current), score: scoreRef.current });
        return;
      }
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTap = (lane: Lane) => {
    if (endedRef.current || startRef.current === null) return;
    const t = currentTime();
    const { states, judgement } = applyTap(statesRef.current, lane, t, windowScale(t));
    statesRef.current = states;

    if (judgement === 'empty') {
      comboRef.current = 0; // taper au hasard casse le combo
    } else {
      scoreRef.current += pointsFor(judgement, comboRef.current);
      comboRef.current += 1;
      if (judgement === 'perfect' && Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
    showFeedback(judgement);
  };

  // Clavier (navigateur uniquement) : D F J K
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKeyDown = (event: KeyboardEvent) => {
      const lane = WEB_KEYS[event.key.toLowerCase()];
      if (lane === undefined || event.repeat) return;
      setPressedLane(lane);
      handleTap(lane);
    };
    const onKeyUp = () => setPressedLane(null);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleHint = () => {
    const t = currentTime();
    if (hintsAvailable === 0 || t < hintUntilRef.current) return;
    onUseHint();
    hintUntilRef.current = t + HINT_DURATION_MS;
  };

  const handleLayout = (event: LayoutChangeEvent) => setFieldHeight(event.nativeEvent.layout.height);

  const summary = summarize(statesRef.current);
  const judged = summary.perfect + summary.good + summary.miss;
  const accuracy = judged === 0 ? 100 : Math.round(((summary.perfect + summary.good) / judged) * 100);
  const hintActive = now < hintUntilRef.current;
  const hitLineY = fieldHeight - HIT_LINE_OFFSET;
  const songProgress = Math.min(1, Math.max(0, now / lastNoteTime));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.score}>{scoreRef.current}</Text>
          <Text style={styles.songName}>
            {startRef.current === null ? '🎵 Chargement de la musique...' : `🎵 ${chart.name}${silentMode ? ' (sans son)' : ''}`}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.combo}>
            {comboRef.current >= 2 ? `Combo ${comboRef.current} · ×${comboMultiplier(comboRef.current)}` : ' '}
          </Text>
          <Text style={[styles.accuracy, accuracy < 70 && styles.accuracyLow]}>Précision {accuracy} %</Text>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${songProgress * 100}%` }]} />
      </View>

      <View style={styles.field} onLayout={handleLayout}>
        {Array.from({ length: LANE_COUNT }, (_, lane) => (
          <View key={lane} style={[styles.lane, pressedLane === lane && { backgroundColor: LANE_COLORS[lane] + '22' }]} />
        ))}

        {fieldHeight > 0 && (
          <>
            <View style={[styles.hitLine, { top: hitLineY }, hintActive && styles.hitLineHint]} />
            {statesRef.current.map((state, index) => {
              if (state.result !== null) return null;
              const progress = noteProgress(state.note.time, now, chart.approachMs);
              if (progress === null) return null;
              return (
                <View
                  key={index}
                  style={[
                    styles.note,
                    {
                      top: progress * hitLineY - NOTE_SIZE / 2,
                      left: `${(state.note.lane + 0.5) * (100 / LANE_COUNT)}%`,
                      borderColor: LANE_COLORS[state.note.lane],
                    },
                  ]}
                >
                  <Text style={styles.noteIcon}>{LANE_ICONS[state.note.lane]}</Text>
                </View>
              );
            })}
          </>
        )}

        {feedback && (
          <Text key={feedback.id} style={[styles.feedback, { color: feedback.color }]}>
            {feedback.text}
          </Text>
        )}
      </View>

      <View style={styles.pads}>
        {Array.from({ length: LANE_COUNT }, (_, i) => {
          const lane = i as Lane;
          return (
            <Pressable
              key={lane}
              onPressIn={() => {
                setPressedLane(lane);
                handleTap(lane);
              }}
              onPressOut={() => setPressedLane(null)}
              style={[styles.pad, { borderColor: LANE_COLORS[lane] }, pressedLane === lane && { backgroundColor: LANE_COLORS[lane] + '44' }]}
            >
              <Text style={styles.padIcon}>{LANE_ICONS[lane]}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={[styles.hintButton, (hintsAvailable === 0 || hintActive) && styles.hintButtonDisabled]}
        onPress={handleHint}
        disabled={hintsAvailable === 0 || hintActive}
      >
        <Text style={styles.hintButtonText}>
          {hintActive ? "👂 Oreille d'elfe active" : "💡 Oreille d'elfe (plus de tolérance 8 s)"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 8,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  score: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  songName: {
    fontSize: 12,
    color: '#a78bfa',
    marginTop: 2,
  },
  combo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fbbf24',
  },
  accuracy: {
    fontSize: 12,
    color: '#34d399',
    marginTop: 2,
  },
  accuracyLow: {
    color: '#f87171',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#243a5a',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7c3aed',
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#16233a',
  },
  lane: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#2c4262',
  },
  hitLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#c4b5fd',
    opacity: 0.6,
  },
  hitLineHint: {
    height: 10,
    marginTop: -3,
    backgroundColor: '#a78bfa',
    opacity: 0.8,
  },
  note: {
    position: 'absolute',
    width: NOTE_SIZE,
    height: NOTE_SIZE,
    marginLeft: -NOTE_SIZE / 2,
    borderRadius: NOTE_SIZE / 2,
    borderWidth: 2,
    backgroundColor: '#0c1521',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteIcon: {
    fontSize: 22,
  },
  feedback: {
    position: 'absolute',
    top: '38%',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
  },
  pads: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  pad: {
    flex: 1,
    height: 72,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: '#121d2c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  padIcon: {
    fontSize: 26,
  },
  hintButton: {
    marginTop: 10,
    backgroundColor: '#2e1a5c',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  hintButtonDisabled: {
    opacity: 0.4,
  },
  hintButtonText: {
    color: '#c4b5fd',
    fontSize: 13,
    fontWeight: '600',
  },
});
