import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BONUS_MAX_POINTS, WIN_MAX_POINTS, WIN_MIN_POINTS } from '../../constants/scoring';
import { useI18n } from '../../services/i18n';
import { useGameStore } from '../../store/gameStore';

// Message d'accueil : affiché une fois (par joueur et par appareil), à la première arrivée sur le calendrier.
// `onDone` est appelé quand il est fermé (ou tout de suite s'il a déjà été vu) : le message des testeurs passe après.
const keyFor = (username: string | null) => `adventquest.welcome.v1.${username ?? 'anonyme'}`;

export function WelcomeIntro({ onDone }: { onDone: () => void }) {
  const username = useGameStore((state) => state.username);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(keyFor(username))
      .then((seen) => {
        if (cancelled) return;
        if (seen === '1') onDone();
        else setVisible(true);
      })
      .catch(() => !cancelled && onDone());
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const close = () => {
    setVisible(false);
    AsyncStorage.setItem(keyFor(username), '1').catch(() => {});
    onDone();
  };

  return <WelcomeInfoModal visible={visible} onClose={close} />;
}

/** Le message d'accueil lui-même : à la première arrivée, et à la demande depuis le Profil */
export function WelcomeInfoModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { tr } = useI18n();
  if (!visible) return null;

  const points = [
    {
      icon: '🎁',
      text: tr(
        'Du 1er au 24 décembre, une case du calendrier s’ouvre chaque jour à minuit. Débloque le jour en gagnant son mini-jeu, et marque un maximum de points.',
        'From 1 to 24 December, a calendar box opens every day at midnight. Unlock the day by winning its mini-game, and score as many points as you can.'
      ),
    },
    {
      icon: '⭐',
      text: tr(
        `Jour gagné : un fragment du Cœur de Noël et de ${WIN_MIN_POINTS} à ${WIN_MAX_POINTS} points selon ta performance, plus un bonus jusqu’à +${BONUS_MAX_POINTS}. Jour raté : tu ne perds rien, mais tu ne gagnes rien non plus. Réessaie tant que le jour est ouvert !`,
        `Day won: a shard of the Heart of Christmas and ${WIN_MIN_POINTS} to ${WIN_MAX_POINTS} points depending on your performance, plus a bonus of up to +${BONUS_MAX_POINTS}. Day failed: you lose nothing, but you don’t earn anything either. Try again while the day is open!`
      ),
    },
    {
      icon: '🏆',
      text: tr(
        'Regarde ta place au classement général, et suis tes copains pour te comparer directement avec eux (onglet Classement → Amis).',
        'Check your place in the overall leaderboard, and follow your friends to compare yourself with them directly (Leaderboard tab → Friends).'
      ),
    },
    {
      icon: '🎮',
      text: tr(
        'Une fois un jour débloqué, certains mini-jeux se rejouent à l’infini dans l’onglet Jeux, pendant tout décembre, juste pour s’amuser : ces points-là ne comptent pas dans le classement.',
        'Once a day is unlocked, some mini-games can be replayed endlessly in the Games tab all through December, just for fun: those points don’t count in the leaderboard.'
      ),
    },
    {
      icon: '📜',
      text: tr(
        'Le 25 décembre, découvre le récap de ta saison (tes meilleurs jeux, ceux qui t’ont donné du fil à retordre) et partage-le !',
        'On 25 December, discover your season recap (your best games, the ones that gave you a hard time) and share it!'
      ),
    },
  ];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.icon}>🎄</Text>
            <Text style={styles.title}>{tr('Bienvenue dans AdventQuest !', 'Welcome to AdventQuest!')}</Text>
            <Text style={styles.intro}>
              {tr(
                'Grimnoir a brisé le Cœur de Noël en 24 fragments. Aide le Gardien des Fêtes à les retrouver, un jour après l’autre.',
                'Grimnoir has shattered the Heart of Christmas into 24 shards. Help the Keeper of the Holidays find them, one day at a time.'
              )}
            </Text>
            {points.map((point) => (
              <View key={point.icon} style={styles.point}>
                <Text style={styles.pointIcon}>{point.icon}</Text>
                <Text style={styles.pointText}>{point.text}</Text>
              </View>
            ))}
          </ScrollView>
          <Pressable style={styles.button} onPress={onClose} accessibilityRole="button">
            <Text style={styles.buttonText}>{tr('C’est parti !', 'Let’s go!')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 9, 16, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    backgroundColor: '#16233a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#a78bfa',
    padding: 18,
    gap: 14,
  },
  content: {
    gap: 12,
  },
  icon: {
    fontSize: 44,
    textAlign: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  intro: {
    fontSize: 14,
    lineHeight: 20,
    color: '#b7c8da',
    textAlign: 'center',
    marginBottom: 4,
  },
  point: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  pointIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  pointText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#e2e8f0',
  },
  button: {
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
