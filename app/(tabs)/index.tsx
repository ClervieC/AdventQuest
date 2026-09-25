import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar } from '../../components/Calendar';
import { FragmentProgress } from '../../components/FragmentProgress';
import { Snowfall } from '../../components/Snowfall';
import { SoundToggle } from '../../components/SoundToggle';
import { useGameStore } from '../../store/gameStore';

export default function CalendarScreen() {
  const { currentDay, totalFragments } = useGameStore();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Snowfall />
      <SoundToggle style={[styles.soundToggle, { top: insets.top + 10 }]} />
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingTop: insets.top + 12 }}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Avent magique · Décembre 2026</Text>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.subtitle}>
          {currentDay >= 1 && currentDay <= 24 ? `Jour ${currentDay} · ` : ''}
          {totalFragments()} fragment{totalFragments() > 1 ? 's' : ''} collecté{totalFragments() > 1 ? 's' : ''}
        </Text>
      </View>

      {currentDay === 0 && (
        <View style={styles.seasonBanner}>
          <Text style={styles.seasonText}>🎄 L&apos;aventure commence le 1er décembre : la première case s&apos;ouvrira à minuit.</Text>
        </View>
      )}
      {currentDay > 24 && (
        <View style={styles.seasonBanner}>
          <Text style={styles.seasonText}>✨ L&apos;Avent est terminé ! Tu peux rejouer toutes les cases pour t&apos;entraîner.</Text>
        </View>
      )}

      <FragmentProgress fragments={totalFragments()} />

      <Calendar />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1521',
  },
  soundToggle: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
  },
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  hero: {
    padding: 20,
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    color: '#3a5a7a',
    textTransform: 'uppercase',
  },
  logo: {
    width: 140,
    height: 140,
    marginVertical: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#3a5a7a',
    marginTop: 4,
  },
  seasonBanner: {
    backgroundColor: '#130d2a',
    borderColor: '#3b2a6b',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  seasonText: {
    color: '#c4b5fd',
    fontSize: 12,
    textAlign: 'center',
  },
});