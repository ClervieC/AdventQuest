import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GameWrapper } from '../../components/GameWrapper';
import { getDayConfig } from '../../constants/days';
import { TUTORIALS } from '../../constants/tutorials';
import { GAME_COMPONENTS, GAME_DIFFICULTY, PRELOADED_GAMES } from '../../games/registry';
import { useI18n } from '../../services/i18n';

// Build web statique (Vercel...) : pré-génère une page par jour, /game/1 à /game/24
export async function generateStaticParams(): Promise<{ day: string }[]> {
  return Array.from({ length: 24 }, (_, i) => ({ day: String(i + 1) }));
}

export default function GameScreen() {
  const { day } = useLocalSearchParams<{ day: string }>();
  const dayNumber = parseInt(day, 10);
  const config = getDayConfig(dayNumber);
  const { tr, l } = useI18n();

  if (!config) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>{tr('Configuration manquante pour le jour', 'Missing configuration for day')} {dayNumber}</Text>
        <BackButton />
      </View>
    );
  }

  const GameComponent = GAME_COMPONENTS[config.game];

  if (!GameComponent) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>{tr(`🎮 Jeu « ${config.game} » — pas encore implémenté`, `🎮 Game “${config.game}” — not implemented yet`)}</Text>
        <BackButton />
      </View>
    );
  }

  return (
    <GameWrapper
      day={config.day}
      fragmentName={l(config.fragmentName)}
      fragmentIcon={config.fragmentIcon}
      storyIntro={l(config.storyIntro)}
      tutorial={TUTORIALS[config.game]}
    >
      {(gameProps) =>
        // Les jeux React Native démarrent (chrono, séquence...) dès leur montage : on ne les monte
        // qu'au clic sur Jouer, ce qui les recrée aussi à neuf à chaque "Rejouer"
        PRELOADED_GAMES.has(config.game) || gameProps.isStarted ? (
          <GameComponent
            {...gameProps}
            difficulty={config.gameDifficulty ?? GAME_DIFFICULTY[config.difficulty]}
            saveId={`day${config.day}`}
          />
        ) : null
      }
    </GameWrapper>
  );
}

function BackButton() {
  const { tr } = useI18n();
  return (
    <Pressable style={styles.backButton} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
      <Text style={styles.backButtonText}>{tr('Retour au calendrier', 'Back to the calendar')}</Text>
    </Pressable>
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
  text: {
    color: '#b7c8da',
    fontSize: 13,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#243a5a',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 24,
  },
  backButtonText: {
    color: '#b7c8da',
    fontSize: 14,
    fontWeight: '600',
  },
});