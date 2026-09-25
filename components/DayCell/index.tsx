import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface DayCellProps {
  day: number;
  icon: string;
  status: 'done' | 'today' | 'missed' | 'locked' | 'test'; // test = jour futur ouvert à un testeur
  isGolden?: boolean;
  bestScore?: number;
  onOpenStart?: () => void; // dès le tap (son d'ouverture)
  onOpen: () => void; // à la fin de l'animation d'ouverture (navigation vers le jeu)
}

const OPEN_ANIMATION_MS = 480;

export function DayCell({ day, icon, status, isGolden, bestScore, onOpenStart, onOpen }: DayCellProps) {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(1);
  const spin = useSharedValue(0);
  const pop = useSharedValue(1);
  const shake = useSharedValue(0);
  const [burstId, setBurstId] = useState(0);
  const openingRef = useRef(false);

  // La case du jour "respire" pour attirer l'œil
  useEffect(() => {
    if (status === 'today' && !reduceMotion) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) })
        ),
        -1
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = 1;
    }
    return () => cancelAnimation(pulse);
  }, [status, reduceMotion, pulse]);

  const handlePress = () => {
    if (openingRef.current) return;

    // Case verrouillée : elle tremble "non"
    if (status === 'locked') {
      if (!reduceMotion) {
        shake.value = withSequence(
          withTiming(-6, { duration: 50 }),
          withTiming(6, { duration: 70 }),
          withTiming(-4, { duration: 60 }),
          withTiming(4, { duration: 60 }),
          withTiming(0, { duration: 50 })
        );
      }
      return;
    }

    onOpenStart?.();
    if (reduceMotion) {
      onOpen();
      return;
    }

    // Ouverture : la case tourne sur elle-même, grossit et lâche des confettis, puis on ouvre le jeu
    openingRef.current = true;
    setBurstId((id) => id + 1);
    spin.value = 0;
    spin.value = withTiming(1, { duration: OPEN_ANIMATION_MS, easing: Easing.inOut(Easing.cubic) });
    pop.value = withSequence(withTiming(1.18, { duration: OPEN_ANIMATION_MS / 2 }), withTiming(1, { duration: OPEN_ANIMATION_MS / 2 }));
    setTimeout(() => {
      openingRef.current = false;
      onOpen();
    }, OPEN_ANIMATION_MS);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 600 },
      { translateX: shake.value },
      { scale: pulse.value * pop.value },
      { rotateY: `${spin.value * 360}deg` },
    ],
  }));

  return (
    <Animated.View style={[burstId > 0 && styles.raised, animatedStyle]}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={status === 'locked' ? `Jour ${day}, pas encore disponible` : `Ouvrir le jour ${day}`}
        style={[
          styles.cell,
          status === 'done' && styles.done,
          status === 'today' && styles.today,
          status === 'missed' && styles.missed,
          status === 'locked' && styles.locked,
          status === 'test' && styles.test,
          isGolden && styles.golden,
        ]}
      >
        {status === 'done' && <Text style={styles.tick}>✓</Text>}
        {status === 'missed' && <Text style={styles.cross}>✗</Text>}
        {status === 'test' && <Text style={styles.testBadge}>🧪</Text>}
        <Text style={[styles.dayNumber, status === 'locked' && styles.lockedText]}>
          {day === 24 ? '🎁' : day}
        </Text>
        {status === 'locked' ? (
          <Text style={styles.lockIcon}>🔒</Text>
        ) : (
          <Text style={[styles.icon, status === 'missed' && styles.missedIcon]}>{icon}</Text>
        )}
        {status === 'done' && bestScore !== undefined && (
          <Text style={styles.score}>+{bestScore}</Text>
        )}
      </Pressable>
      {burstId > 0 && <ConfettiBurst key={burstId} />}
    </Animated.View>
  );
}

// ---------- Confettis ----------

const CONFETTI_COLORS = ['#fbbf24', '#a78bfa', '#34d399', '#f87171', '#60a5fa', '#ffffff'];
const CONFETTI_COUNT = 16;

function ConfettiBurst() {
  const [pieces] = useState(() =>
    Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      angle: (i / CONFETTI_COUNT) * Math.PI * 2 + Math.random() * 0.4,
      distance: 38 + Math.random() * 30,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 4 + Math.random() * 4,
      spin: (Math.random() - 0.5) * 720,
    }))
  );
  return (
    <View style={styles.burst} pointerEvents="none">
      {pieces.map((piece, i) => (
        <ConfettiPiece key={i} {...piece} />
      ))}
    </View>
  );
}

function ConfettiPiece({ angle, distance, color, size, spin }: { angle: number; distance: number; color: string; size: number; spin: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 750, easing: Easing.out(Easing.quad) });
  }, [progress]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: 1 - p,
      transform: [
        { translateX: Math.cos(angle) * distance * p },
        // un peu de gravité : les confettis retombent en fin de course
        { translateY: Math.sin(angle) * distance * p + 26 * p * p },
        { rotate: `${spin * p}deg` },
      ],
    };
  });

  return <Animated.View style={[styles.confetti, { width: size, height: size * 0.6, backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  raised: {
    zIndex: 10,
  },
  cell: {
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  done: {
    backgroundColor: '#0d2218',
    borderWidth: 1,
    borderColor: '#1a4030',
  },
  today: {
    backgroundColor: '#130d2a',
    borderWidth: 2,
    borderColor: '#7c3aed',
  },
  missed: {
    backgroundColor: '#1a0f14',
    borderWidth: 1,
    borderColor: '#3a1a22',
  },
  missedIcon: {
    opacity: 0.35,
  },
  cross: {
    position: 'absolute',
    top: 4,
    right: 5,
    fontSize: 9,
    color: '#f87171',
  },
  test: {
    backgroundColor: '#0a1a1c',
    borderWidth: 1,
    borderColor: '#14532d',
    borderStyle: 'dashed',
  },
  testBadge: {
    position: 'absolute',
    top: 3,
    right: 4,
    fontSize: 9,
  },
  locked: {
    backgroundColor: '#0a1420',
    borderWidth: 1,
    borderColor: '#141e2a',
  },
  golden: {
    borderColor: '#92400e',
    borderWidth: 2,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  lockedText: {
    color: '#1a2e42',
  },
  icon: {
    fontSize: 16,
    marginTop: 2,
  },
  lockIcon: {
    fontSize: 14,
  },
  score: {
    fontSize: 9,
    color: '#34d399',
    marginTop: 2,
  },
  tick: {
    position: 'absolute',
    top: 4,
    right: 5,
    fontSize: 9,
    color: '#34d399',
  },
  burst: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
  },
  confetti: {
    position: 'absolute',
    borderRadius: 1,
  },
});
