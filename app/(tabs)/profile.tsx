import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FRAGMENT_THRESHOLD, useGameStore } from '../../store/gameStore';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { username, timezone, hints, days, totalFragments } = useGameStore();
  const fragments = totalFragments();
  const totalScore = Object.values(days).reduce((sum, day) => sum + day.bestScore, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>{username ?? 'Gardien des Fêtes'}</Text>

      <View style={styles.stats}>
        <Stat value={`${fragments} / 24`} label="fragments" />
        <Stat value={totalScore.toLocaleString('fr-FR')} label="points" />
        <Stat value={`${hints}`} label="hints" />
      </View>

      <Text style={styles.info}>
        {fragments >= FRAGMENT_THRESHOLD
          ? '✅ Le portail du boss s’ouvrira pour toi le jour 24.'
          : `Encore ${FRAGMENT_THRESHOLD - fragments} fragment${FRAGMENT_THRESHOLD - fragments > 1 ? 's' : ''} pour pouvoir affronter Grimnoir le jour 24.`}
      </Text>
      {timezone && <Text style={styles.detail}>Une nouvelle case s&apos;ouvre chaque jour à minuit ({timezone}).</Text>}
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1521',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
    alignSelf: 'stretch',
  },
  stat: {
    flex: 1,
    backgroundColor: '#090e18',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#141e2a',
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#c4b5fd',
  },
  statLabel: {
    fontSize: 11,
    color: '#3a5a7a',
    marginTop: 4,
  },
  info: {
    fontSize: 13,
    color: '#7a9ab8',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 20,
  },
  detail: {
    fontSize: 11,
    color: '#3a5a7a',
    textAlign: 'center',
    marginTop: 12,
  },
});
