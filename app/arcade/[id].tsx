import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GameWrapper } from '../../components/GameWrapper';
import { FriendsRecords } from '../../components/FriendsRecords';
import { ARCADE_GAMES, arcadeRecord, arcadeRecordKey, arcadeRecordKeys, getArcadeGame, SUDOKU_LEVELS, SudokuLevel } from '../../constants/arcade';
import { TUTORIALS } from '../../constants/tutorials';
import { GAME_COMPONENTS, PRELOADED_GAMES } from '../../games/registry';
import { useI18n } from '../../services/i18n';
import { useGameStore } from '../../store/gameStore';
import { useRecordsStore } from '../../store/recordsStore';

// Un jeu de l'onglet Jeux : partie sans fin (ou par niveaux), rejouable à l'infini, record personnel.
// Sudoku : ?level=easy|medium|hard|very_hard
export async function generateStaticParams(): Promise<{ id: string }[]> {
  return ARCADE_GAMES.map((g) => ({ id: g.id }));
}

export default function ArcadeGameScreen() {
  const { id, level } = useLocalSearchParams<{ id: string; level?: string }>();
  const { tr, l } = useI18n();
  const days = useGameStore((state) => state.days);
  const records = useRecordsStore((state) => state.records);
  const game = getArcadeGame(id);

  if (!game) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>{tr('Jeu introuvable.', 'Game not found.')}</Text>
        <Pressable style={styles.backButton} onPress={() => (router.canGoBack() ? router.back() : router.replace('/games'))}>
          <Text style={styles.backButtonText}>{tr('Retour aux jeux', 'Back to the games')}</Text>
        </Pressable>
      </View>
    );
  }

  const sudokuLevel = game.game === 'sudoku' ? SUDOKU_LEVELS.find((s) => s.level === level) ?? SUDOKU_LEVELS[1] : undefined;
  const levelId: SudokuLevel | undefined = sudokuLevel?.level;
  const GameComponent = GAME_COMPONENTS[game.game];
  const name = l(game.name) + (sudokuLevel ? ` · ${l(sudokuLevel.label)}` : '');
  const calendarRecord = arcadeRecord(game, records, (day) => days[day]?.bestScore ?? 0, levelId);

  return (
    <GameWrapper
      day={game.unlockDay}
      fragmentName={name}
      fragmentIcon={game.icon}
      storyIntro={l(game.description)}
      tutorial={TUTORIALS[game.game]}
      arcade
      recordKey={arcadeRecordKey(game.id, levelId)}
      recordFloor={calendarRecord}
      introExtra={<FriendsRecords recordKeys={arcadeRecordKeys(game, levelId)} />}
    >
      {(gameProps) =>
        PRELOADED_GAMES.has(game.game) || gameProps.isStarted ? (
          <GameComponent
            {...gameProps}
            arcade
            difficulty={levelId ?? game.difficulty}
            saveId={levelId ? `arcade-${game.id}-${levelId}` : `arcade-${game.id}`}
          />
        ) : null
      }
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
