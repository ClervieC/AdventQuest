import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { fetchSeasonSurveyStatus, SeasonSurveyStatus } from '../../services/api';

/**
 * Invitation au sondage de fin de saison (accueil et profil), visible à partir du 24 décembre au soir.
 * Accueil : seulement tant que le joueur n'a pas répondu. Profil : toujours, pour pouvoir modifier ses réponses.
 */
export function SurveyInvite({ place }: { place: 'home' | 'profile' }) {
  const [status, setStatus] = useState<SeasonSurveyStatus | null>(null);

  // Rechargé à chaque retour sur la page (après avoir répondu, l'invitation de l'accueil disparaît)
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      fetchSeasonSurveyStatus()
        .then((next) => !cancelled && setStatus(next))
        .catch(() => {}); // sondage pas encore installé côté serveur, ou hors ligne : rien à afficher
      return () => {
        cancelled = true;
      };
    }, [])
  );

  if (!status?.open || (place === 'home' && status.answered)) return null;

  return (
    <Pressable style={[styles.card, place === 'home' && styles.cardHome]} onPress={() => router.push('/survey')} accessibilityRole="button">
      <Text style={styles.title}>🎁 {status.answered ? 'Sondage de fin de saison' : 'L’aventure est finie : donne ton avis !'}</Text>
      <Text style={styles.text}>
        {status.answered
          ? 'Merci pour tes réponses 💜 Touche pour les modifier.'
          : 'Ce que tu as aimé, ce que tu voudrais l’an prochain : 1 minute ›'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    backgroundColor: '#1f1a0c',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#b45309',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 4,
  },
  cardHome: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fbbf24',
  },
  text: {
    fontSize: 12,
    color: '#dbe6f1',
  },
});
