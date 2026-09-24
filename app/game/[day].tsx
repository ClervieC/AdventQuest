import { StackGame } from '@/games/day02_stack';
import { SpaceInvadersGame } from '@/games/day04_spaceinvaders';
import { SnakeGame } from '@/games/day05_snake';
import { DessinConnecteGame } from '@/games/day06_dessinconnecte';
import { FruitNinjaGame } from '@/games/day07_fruitninja';
import { MemorySequenceGame } from '@/games/day08_memory_sequence';
import { BubbleShooterGame } from '@/games/day09_bubbleshooter';
import { PipePuzzleGame } from '@/games/day10_pipepuzzle';
import { SolitaireGame } from '@/games/day11_solitaire';
import { RunnerGame } from '@/games/day13_runner';
import { LabyrintheGame } from '@/games/day14_labyrinthe';
import { NonogramGame } from '@/games/day15_nonogram';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GameWrapper } from '../../components/GameWrapper';
import { GameType, getDayConfig } from '../../constants/days';
import { QuizGame } from '../../games/day01_quiz';
import { SudokuGame } from '../../games/day03_sudoku';
import { WhackAMoleGame } from '../../games/day16_whackamole';
import { DodgeBallGame } from '../../games/day19_dodgeball';
import { RythmeGame } from '../../games/day21_rythme';
import { CasseBriquesGame } from '../../games/day20_cassebriques';
import { Day22MarathonGame } from '../../games/day22_marathon';
import { Day23MarathonGame } from '../../games/day23_marathon';
import { BossGame } from '../../games/day24_boss';

const GAME_COMPONENTS: Record<string, React.ComponentType<any>> = {
  quiz: QuizGame,
  sudoku: SudokuGame,
  memory_sequence: MemorySequenceGame,
  snake: SnakeGame,
  stack: StackGame,
  labyrinthe: LabyrintheGame,
  pipepuzzle: PipePuzzleGame,
  spaceinvaders: SpaceInvadersGame,
  whackamole: WhackAMoleGame,
  dessinconnecte: DessinConnecteGame,
  fruitninja: FruitNinjaGame,
  bubbleshooter: BubbleShooterGame,
  solitaire: SolitaireGame,
  nonogram: NonogramGame,
  runner: RunnerGame,
  dodgeball: DodgeBallGame,
  cassebriques: CasseBriquesGame,
  marathon_22: Day22MarathonGame,
  marathon_23: Day23MarathonGame,
  boss: BossGame,
  rythme: RythmeGame,
};

// Jeux Phaser (WebView) et marathons : montés dès l'intro pour que la WebView ait le temps de charger.
// Ils attendent INIT pour démarrer et se remettent à zéro eux-mêmes à chaque "Rejouer".
const PRELOADED_GAMES = new Set<GameType>([
  'stack', 'spaceinvaders', 'fruitninja', 'bubbleshooter', 'whackamole',
  'runner', 'dodgeball', 'cassebriques', 'marathon_22', 'marathon_23', 'boss',
]);

// Build web statique (Vercel...) : pré-génère une page par jour, /game/1 à /game/24
export async function generateStaticParams(): Promise<{ day: string }[]> {
  return Array.from({ length: 24 }, (_, i) => ({ day: String(i + 1) }));
}

export default function GameScreen() {
  const { day } = useLocalSearchParams<{ day: string }>();
  const dayNumber = parseInt(day, 10);
  const config = getDayConfig(dayNumber);

  if (!config) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Configuration manquante pour le jour {dayNumber}</Text>
        <BackButton />
      </View>
    );
  }

  const GameComponent = GAME_COMPONENTS[config.game];

  if (!GameComponent) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>🎮 Jeu « {config.game} » — pas encore implémenté</Text>
        <BackButton />
      </View>
    );
  }

  return (
    <GameWrapper
      day={config.day}
      fragmentName={config.fragmentName}
      fragmentIcon={config.fragmentIcon}
      storyIntro={config.storyIntro}
    >
      {(gameProps) =>
        // Les jeux React Native démarrent (chrono, séquence...) dès leur montage : on ne les monte
        // qu'au clic sur Jouer, ce qui les recrée aussi à neuf à chaque "Rejouer"
        PRELOADED_GAMES.has(config.game) || gameProps.isStarted ? (
          <GameComponent {...gameProps} difficulty={config.gameDifficulty} />
        ) : null
      }
    </GameWrapper>
  );
}

function BackButton() {
  return (
    <Pressable style={styles.backButton} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
      <Text style={styles.backButtonText}>Retour au calendrier</Text>
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
    color: '#7a9ab8',
    fontSize: 13,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#162540',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 24,
  },
  backButtonText: {
    color: '#7a9ab8',
    fontSize: 14,
    fontWeight: '600',
  },
});