import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

interface DayCellProps {
  day: number;
  icon: string;
  status: 'done' | 'today' | 'locked';
  isGolden?: boolean;
  bestScore?: number;
  onPress: () => void;
}

export function DayCell({ day, icon, status, isGolden, bestScore, onPress }: DayCellProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'today') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [status]);

  return (
    <Animated.View style={{ transform: [{ scale: status === 'today' ? pulseAnim : 1 }] }}>
      <Pressable
        onPress={onPress}
        style={[
          styles.cell,
          status === 'done' && styles.done,
          status === 'today' && styles.today,
          status === 'locked' && styles.locked,
          isGolden && styles.golden,
        ]}
      >
        {status === 'done' && <Text style={styles.tick}>✓</Text>}
        <Text style={[styles.dayNumber, status === 'locked' && styles.lockedText]}>
          {day === 24 ? '🎁' : day}
        </Text>
        {status === 'locked' ? (
          <Text style={styles.lockIcon}>🔒</Text>
        ) : (
          <Text style={styles.icon}>{icon}</Text>
        )}
        {status === 'done' && bestScore !== undefined && (
          <Text style={styles.score}>+{bestScore}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
});
