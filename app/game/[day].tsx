import { useLocalSearchParams } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { getDayConfig } from '../../constants/days';

export default function GameScreen() {
  const { day } = useLocalSearchParams<{ day: string }>();
  const dayNumber = parseInt(day, 10);
  const config = getDayConfig(dayNumber);

  if (!config) {
    return (
      <View style={styles.container}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Configuration manquante pour le jour {dayNumber}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.dayLabel}>Jour {config.day} / 24</Text>
      <Text style={styles.title}>{config.fragmentIcon} {config.fragmentName}</Text>
      <Text style={styles.story}>{config.storyIntro}</Text>
      <Text style={styles.placeholder}>
        🎮 Jeu "{config.game}" — à implémenter en Phase 2/3
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1521',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 16,
  },
  dayLabel: {
    fontSize: 11,
    letterSpacing: 2,
    color: '#3a5a7a',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
  },
  story: {
    fontSize: 13,
    color: '#4a6a8a',
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  placeholder: {
    fontSize: 13,
    color: '#7c3aed',
    marginTop: 32,
    textAlign: 'center',
  },
});