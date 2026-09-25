import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const SIZE = 230; // taille de la zone
const RADIUS = 92; // rayon du cercle des 24 emplacements
const SLOT = 14;
const FLIGHT_DELAY_MS = 500;
const FLIGHT_MS = 900;

// Position de l'emplacement d'un jour : le jour 1 en haut, puis dans le sens des aiguilles d'une montre
function slotPosition(day: number) {
  const angle = -Math.PI / 2 + ((day - 1) / 24) * Math.PI * 2;
  return { x: Math.cos(angle) * RADIUS, y: Math.sin(angle) * RADIUS };
}

interface FragmentHeartProps {
  day: number;
  icon: string;
  name: string;
  wonDays: number[]; // jours dont le fragment est gagné (y compris celui-ci)
}

/** Le fragment gagné vole jusqu'à sa place autour du Cœur de Noël, qui s'illumine */
export function FragmentHeart({ day, icon, name, wonDays }: FragmentHeartProps) {
  const reduceMotion = useReducedMotion();
  const flight = useSharedValue(reduceMotion ? 1 : 0);
  const landed = useSharedValue(reduceMotion ? 1 : 0);
  const heartbeat = useSharedValue(1);
  const target = slotPosition(day);

  useEffect(() => {
    if (reduceMotion) return;
    flight.value = withDelay(FLIGHT_DELAY_MS, withTiming(1, { duration: FLIGHT_MS, easing: Easing.inOut(Easing.cubic) }));
    landed.value = withDelay(FLIGHT_DELAY_MS + FLIGHT_MS, withTiming(1, { duration: 250 }));
    heartbeat.value = withDelay(
      FLIGHT_DELAY_MS + FLIGHT_MS,
      withSequence(withSpring(1.25, { damping: 6, stiffness: 220 }), withSpring(1, { damping: 8 }))
    );
  }, [reduceMotion, flight, landed, heartbeat]);

  // Le fragment part du centre, en grand, et rejoint son emplacement en rétrécissant, sur une petite courbe
  const flyingStyle = useAnimatedStyle(() => {
    const p = flight.value;
    const arc = Math.sin(p * Math.PI) * -40;
    return {
      opacity: 1 - landed.value,
      transform: [
        { translateX: target.x * p },
        { translateY: target.y * p + arc },
        { scale: 2.6 - 2 * p },
        { rotate: `${p * 360}deg` },
      ],
    };
  });

  const newSlotStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + 0.75 * landed.value,
    transform: [{ scale: 1 + 0.6 * landed.value * (1 - landed.value) * 4 }],
  }));

  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartbeat.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.15 + 0.35 * landed.value }));

  return (
    <View style={styles.container}>
      <View style={styles.stage}>
        <Animated.View style={[styles.glow, glowStyle]} />

        {Array.from({ length: 24 }, (_, i) => {
          const slotDay = i + 1;
          const { x, y } = slotPosition(slotDay);
          const isNew = slotDay === day;
          const won = wonDays.includes(slotDay);
          const position = { left: SIZE / 2 + x - SLOT / 2, top: SIZE / 2 + y - SLOT / 2 };
          if (isNew) {
            return <Animated.View key={slotDay} style={[styles.slot, styles.slotWon, styles.slotNew, position, newSlotStyle]} />;
          }
          return <View key={slotDay} style={[styles.slot, won && styles.slotWon, position]} />;
        })}

        <Animated.Text style={[styles.heart, heartStyle]}>💖</Animated.Text>
        <Animated.Text style={[styles.flying, flyingStyle]}>{icon}</Animated.Text>
      </View>

      <Text style={styles.name}>{icon} {name}</Text>
      <Text style={styles.count}>Le Cœur de Noël : {wonDays.length} / 24 fragments</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 16,
  },
  stage: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f472b6',
  },
  slot: {
    position: 'absolute',
    width: SLOT,
    height: SLOT,
    borderRadius: SLOT / 2,
    backgroundColor: '#243a5a',
    borderWidth: 1,
    borderColor: '#3a5a82',
  },
  slotWon: {
    backgroundColor: '#fbbf24',
    borderColor: '#fde68a',
  },
  slotNew: {
    backgroundColor: '#fde68a',
    borderColor: '#ffffff',
  },
  heart: {
    fontSize: 64,
  },
  flying: {
    position: 'absolute',
    fontSize: 22,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fbbf24',
    marginTop: 4,
  },
  count: {
    fontSize: 12,
    color: '#b7c8da',
    marginTop: 4,
  },
});
