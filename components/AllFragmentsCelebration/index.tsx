import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { DAYS_CONFIG } from '../../constants/days';
import { useI18n } from '../../services/i18n';
import { playSfx } from '../../services/sfx';

// Grande fête quand les 24 fragments sont réunis : les 24 fragments arrivent de partout et se placent
// en couronne autour du Cœur de Noël, qui grossit, bat et s'illumine, sous une pluie de confettis.

const STAGE = 280;
const RING = 112;
const FRAGMENT_BOX = 30;
const STAGGER_MS = 70; // un fragment après l'autre
const FLIGHT_MS = 700;
const ALL_LANDED_MS = 24 * STAGGER_MS + FLIGHT_MS;
const CONFETTI_COUNT = 44;
const CONFETTI_COLORS = ['#fbbf24', '#a78bfa', '#34d399', '#f87171', '#60a5fa', '#f472b6', '#ffffff'];

// ---------- Une seule fête par joueur et par appareil ----------

const keyFor = (username: string | null) => `adventquest.celebrated24.v1.${username ?? 'anonyme'}`;

export async function hasCelebratedAllFragments(username: string | null): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(keyFor(username))) === '1';
  } catch {
    return true; // stockage indisponible : on n'insiste pas
  }
}

export function markAllFragmentsCelebrated(username: string | null): void {
  AsyncStorage.setItem(keyFor(username), '1').catch(() => {});
}

// ---------- Animation ----------

function ringPosition(index: number) {
  const angle = -Math.PI / 2 + (index / 24) * Math.PI * 2;
  return { x: Math.cos(angle) * RING, y: Math.sin(angle) * RING };
}

function FlyingFragment({ index, icon, reduceMotion }: { index: number; icon: string; reduceMotion: boolean }) {
  const target = ringPosition(index);
  // Départ loin, dans la même direction que sa place mais tourné d'un quart de tour : ça tourbillonne
  const startAngle = -Math.PI / 2 + (index / 24) * Math.PI * 2 + Math.PI / 2;
  const start = { x: Math.cos(startAngle) * 420, y: Math.sin(startAngle) * 420 };
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) return;
    progress.value = withDelay(index * STAGGER_MS, withTiming(1, { duration: FLIGHT_MS, easing: Easing.out(Easing.cubic) }));
  }, [index, progress, reduceMotion]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: Math.min(1, p * 3),
      transform: [
        { translateX: start.x + (target.x - start.x) * p },
        { translateY: start.y + (target.y - start.y) * p },
        { scale: 2.2 - 1.2 * p },
        { rotate: `${(1 - p) * 540}deg` },
      ],
    };
  });

  return (
    <Animated.View style={[styles.fragment, style]}>
      <Text style={styles.fragmentText}>{icon}</Text>
    </Animated.View>
  );
}

function ConfettiPiece({ index, width, height }: { index: number; width: number; height: number }) {
  const [piece] = useState(() => ({
    x: Math.random() * width,
    delay: ALL_LANDED_MS - 300 + Math.random() * 1400,
    duration: 2200 + Math.random() * 1800,
    drift: (Math.random() - 0.5) * 120,
    spin: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540),
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    size: 6 + Math.random() * 6,
    round: Math.random() < 0.35,
  }));
  const fall = useSharedValue(0);

  useEffect(() => {
    fall.value = withDelay(piece.delay, withTiming(1, { duration: piece.duration, easing: Easing.in(Easing.quad) }));
  }, [fall, piece]);

  const style = useAnimatedStyle(() => ({
    opacity: fall.value > 0 ? 1 - fall.value * 0.3 : 0,
    transform: [
      { translateX: piece.x + piece.drift * fall.value },
      { translateY: -20 + (height + 40) * fall.value },
      { rotate: `${piece.spin * fall.value}deg` },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.confetti,
        { width: piece.size, height: piece.round ? piece.size : piece.size * 0.45, borderRadius: piece.round ? piece.size / 2 : 1, backgroundColor: piece.color },
        style,
      ]}
    />
  );
}

/** Écran de fête des 24 fragments (plein écran, par-dessus tout) */
export function AllFragmentsCelebration({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { tr } = useI18n();
  const reduceMotion = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const heart = useSharedValue(reduceMotion ? 1 : 0.4);
  const glow = useSharedValue(reduceMotion ? 1 : 0);
  const text = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (!visible) return;
    playSfx('fragment');
    const victory = setTimeout(() => playSfx('victory'), reduceMotion ? 0 : ALL_LANDED_MS);
    if (!reduceMotion) {
      // Le cœur grossit une fois tous les fragments en place, puis bat doucement
      heart.value = withDelay(
        ALL_LANDED_MS,
        withSequence(
          withSpring(1.35, { damping: 5, stiffness: 180 }),
          withRepeat(withSequence(withTiming(1.12, { duration: 420 }), withTiming(1, { duration: 420 })), -1)
        )
      );
      glow.value = withDelay(ALL_LANDED_MS, withTiming(1, { duration: 700 }));
      text.value = withDelay(ALL_LANDED_MS + 300, withTiming(1, { duration: 600 }));
    }
    return () => clearTimeout(victory);
  }, [visible, reduceMotion, heart, glow, text]);

  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heart.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.55 * glow.value, transform: [{ scale: 0.6 + 0.9 * glow.value }] }));
  const textStyle = useAnimatedStyle(() => ({ opacity: text.value, transform: [{ translateY: 16 * (1 - text.value) }] }));

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {!reduceMotion &&
          Array.from({ length: CONFETTI_COUNT }, (_, i) => <ConfettiPiece key={i} index={i} width={width} height={height} />)}

        <View style={styles.stage}>
          <Animated.View style={[styles.glow, glowStyle]} />
          {DAYS_CONFIG.map((config, i) => (
            <FlyingFragment key={config.day} index={i} icon={config.fragmentIcon} reduceMotion={reduceMotion} />
          ))}
          <Animated.Text style={[styles.heart, heartStyle]}>💖</Animated.Text>
        </View>

        <Animated.View style={[styles.texts, textStyle]}>
          <Text style={styles.count}>✦ 24 / 24 ✦</Text>
          <Text style={styles.title}>{tr('Le Cœur de Noël est reconstitué !', 'The Heart of Christmas is whole again!')}</Text>
          <Text style={styles.subtitle}>
            {tr(
              'Tu as retrouvé les 24 fragments. Noël est sauvé, bravo Gardien des Fêtes !',
              'You found all 24 shards. Christmas is saved, well done Keeper of the Holidays!'
            )}
          </Text>
          <Pressable style={styles.button} onPress={onClose} accessibilityRole="button">
            <Text style={styles.buttonText}>{tr('✨ Continuer', '✨ Continue')}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 9, 16, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    overflow: 'hidden',
  },
  stage: {
    width: STAGE,
    height: STAGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Positions explicites (centrées dans la scène) : pareil sur téléphone et sur le web
  glow: {
    position: 'absolute',
    left: STAGE / 2 - 110,
    top: STAGE / 2 - 110,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#f472b6',
  },
  fragment: {
    position: 'absolute',
    left: STAGE / 2 - FRAGMENT_BOX / 2,
    top: STAGE / 2 - FRAGMENT_BOX / 2,
    width: FRAGMENT_BOX,
    height: FRAGMENT_BOX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fragmentText: {
    fontSize: 20,
  },
  heart: {
    fontSize: 84,
  },
  confetti: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  texts: {
    alignItems: 'center',
    marginTop: 12,
    maxWidth: 360,
    gap: 8,
  },
  count: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 3,
    color: '#fbbf24',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#cdd9e5',
    textAlign: 'center',
  },
  button: {
    marginTop: 10,
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 36,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
