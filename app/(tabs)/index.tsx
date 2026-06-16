import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar } from '../../components/Calendar';
import { useGameStore } from '../../store/gameStore';

export default function CalendarScreen() {
  const { currentDay, totalFragments, bossUnlocked } = useGameStore();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top + 12 }}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Avent magique · Décembre 2026</Text>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.subtitle}>Jour {currentDay} · {totalFragments()} fragments collectés</Text>
      </View>

      {!bossUnlocked() && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            ⚠️ Il faut 12 fragments minimum pour débloquer le Jour 24.
          </Text>
        </View>
      )}

      <Calendar />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1521',
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
  warningBanner: {
    backgroundColor: '#1a1000',
    borderColor: '#3d2000',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  warningText: {
    color: '#92400e',
    fontSize: 11,
    textAlign: 'center',
  },
});