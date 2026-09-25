import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { FRAGMENT_THRESHOLD } from '../../store/gameStore';

const TOTAL_FRAGMENTS = 24;

/** Barre des fragments collectés, avec le repère des 12 fragments qui ouvrent le portail du boss */
export function FragmentProgress({ fragments }: { fragments: number }) {
  const fill = useSharedValue(0);
  const unlocked = fragments >= FRAGMENT_THRESHOLD;

  useEffect(() => {
    fill.value = withTiming(Math.min(1, fragments / TOTAL_FRAGMENTS), { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [fragments, fill]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));
  const thresholdLeft = `${(FRAGMENT_THRESHOLD / TOTAL_FRAGMENTS) * 100}%` as const;
  const missing = FRAGMENT_THRESHOLD - fragments;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.count}>
          ✦ {fragments} <Text style={styles.total}>/ {TOTAL_FRAGMENTS} fragments</Text>
        </Text>
        <Text style={[styles.status, unlocked && styles.statusUnlocked]}>
          {unlocked ? '🔓 Portail du boss ouvert' : `🔒 Encore ${missing} pour le boss`}
        </Text>
      </View>

      <View style={styles.track}>
        <Animated.View style={[styles.fill, unlocked && styles.fillUnlocked, fillStyle]} />
        <View style={[styles.marker, { left: thresholdLeft }]} />
      </View>

      <View style={styles.markerLabelRow}>
        <Text style={[styles.markerLabel, { left: thresholdLeft }]}>12 · portail</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#090e18cc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#141e2a',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
    gap: 8,
    flexWrap: 'wrap',
  },
  count: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fbbf24',
  },
  total: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7a9ab8',
  },
  status: {
    fontSize: 11,
    color: '#f59e0b',
  },
  statusUnlocked: {
    color: '#34d399',
  },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#162540',
    overflow: 'visible',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#a78bfa',
  },
  fillUnlocked: {
    backgroundColor: '#34d399',
  },
  marker: {
    position: 'absolute',
    top: -4,
    width: 2,
    height: 18,
    marginLeft: -1,
    borderRadius: 1,
    backgroundColor: '#fbbf24',
  },
  markerLabelRow: {
    height: 18,
  },
  markerLabel: {
    position: 'absolute',
    top: 4,
    width: 80,
    marginLeft: -40,
    textAlign: 'center',
    fontSize: 10,
    color: '#fbbf24',
  },
});
