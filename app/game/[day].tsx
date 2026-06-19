import { StackGame } from '@/games/day02_stack';
import { MemorySequenceGame } from '@/games/day04_memory_sequence';
import { SnakeGame } from '@/games/day05_snake';
import { PipePuzzleGame } from '@/games/day10_pipepuzzle';
import { LabyrintheGame } from '@/games/day14_labyrinthe';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { GameWrapper } from '../../components/GameWrapper';
import { getDayConfig } from '../../constants/days';
import { QuizGame } from '../../games/day01_quiz';
import { SudokuGame } from '../../games/day03_sudoku';
import { WhackAMoleGame } from '../../games/day16_whackamole';

const GAME_COMPONENTS: Record<string, React.ComponentType<any>> = {
  quiz: QuizGame,
  sudoku: SudokuGame,
  memory_sequence: MemorySequenceGame,
  snake: SnakeGame,
  stack: StackGame,
  labyrinthe: LabyrintheGame,
  pipepuzzle: PipePuzzleGame,
  whackamole: WhackAMoleGame,
};

export default function GameScreen() {
  const { day } = useLocalSearchParams<{ day: string }>();
  const dayNumber = parseInt(day, 10);
  const config = getDayConfig(dayNumber);

  if (!config) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Configuration manquante pour le jour {dayNumber}</Text>
      </View>
    );
  }

  const GameComponent = GAME_COMPONENTS[config.game];

  if (!GameComponent) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>🎮 Jeu "{config.game}" — pas encore implémenté</Text>
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
      {(gameProps) => (
        <GameComponent {...gameProps} difficulty={config.gameDifficulty} />
  )}
    </GameWrapper>
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
});