import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useI18n } from '../../services/i18n';
import { useGameStore } from '../../store/gameStore';

/** Le récap est ouvert à partir du 25 décembre (saison terminée) ; testeurs et admin : à tout moment, pour le tester */
export function isRecapOpen(currentDay: number, role: string): boolean {
  return currentDay >= 25 || role === 'tester' || role === 'admin';
}

/** Invitation au récap de la saison (accueil et profil) */
export function RecapInvite({ place }: { place: 'home' | 'profile' }) {
  const { tr } = useI18n();
  const currentDay = useGameStore((state) => state.currentDay);
  const role = useGameStore((state) => state.role);
  if (!isRecapOpen(currentDay, role)) return null;

  return (
    <Pressable style={[styles.card, place === 'home' && styles.cardHome]} onPress={() => router.push('/recap')} accessibilityRole="button">
      <Text style={styles.title}>{tr('📜 Ton récap de l’Avent', '📜 Your Advent recap')}</Text>
      <Text style={styles.text}>
        {tr(
          'Tes meilleurs jeux, ceux qui t’ont résisté, ta grille des 24 jours… à partager ! ›',
          'Your best games, the ones that resisted you, your 24-day grid… to share! ›'
        )}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    backgroundColor: '#221647',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#7c3aed',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 4,
  },
  cardHome: {
    marginHorizontal: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#c4b5fd',
  },
  text: {
    fontSize: 12,
    color: '#dbe6f1',
  },
});
