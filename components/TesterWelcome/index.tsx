import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../../services/i18n';
import { useGameStore } from '../../store/gameStore';

// Message d'accueil des testeurs : affiché une fois (par joueur et par appareil) quand le compte devient testeur,
// y compris en direct si l'admin change le rôle pendant que l'appli est ouverte.
const keyFor = (username: string | null) => `adventquest.testerWelcome.v1.${username ?? 'anonyme'}`;

export function TesterWelcome() {
  const role = useGameStore((state) => state.role);
  const username = useGameStore((state) => state.username);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (role !== 'tester') return;
    let cancelled = false;
    AsyncStorage.getItem(keyFor(username))
      .then((seen) => {
        if (!cancelled && seen !== '1') setVisible(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [role, username]);

  const close = () => {
    setVisible(false);
    AsyncStorage.setItem(keyFor(username), '1').catch(() => {});
  };

  return <TesterInfoModal visible={visible} onClose={close} />;
}

/** Le message des testeurs lui-même : à l'accueil la première fois, et à la demande depuis le Profil */
export function TesterInfoModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { tr } = useI18n();
  if (!visible) return null;

  const points = [
    {
      icon: '🔓',
      text: tr(
        'Tu as accès à tous les jours et à tous les jeux, en avance et sans limite : rejoue-les autant que tu veux.',
        'You have access to every day and every game, early and without limits: replay them as much as you like.'
      ),
    },
    {
      icon: '💬',
      text: tr(
        'Après chaque partie, et à tout moment avec le bouton « 💬 Avis », dis-moi ce qui t’a plu et ce qui peut être amélioré : trop dur, pas clair, un bug…',
        'After each game, and at any time with the “💬 Feedback” button, tell me what you liked and what could be better: too hard, unclear, a bug…'
      ),
    },
    {
      icon: '🔁',
      text: tr(
        'Tes retours sont lus et le jeu s’améliore au fur et à mesure : reviens tester les nouveautés !',
        'Your feedback is read and the game keeps improving: come back to try the new things!'
      ),
    },
    {
      icon: '🧪',
      text: tr(
        'Tes scores de test comptent dans le classement (marqués 🧪). Ils seront remis à zéro avant le vrai départ, le 1er décembre.',
        'Your test scores count in the leaderboard (marked 🧪). They will be reset before the real start on 1 December.'
      ),
    },
  ];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.icon}>🧪</Text>
            <Text style={styles.title}>{tr('Tu es testeur !', 'You’re a tester!')}</Text>
            <Text style={styles.intro}>
              {tr('Merci de m’aider à préparer AdventQuest avant le lancement.', 'Thanks for helping me get AdventQuest ready before launch.')}
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
    maxWidth: 400,
    maxHeight: '90%',
    backgroundColor: '#16233a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#34d399',
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
