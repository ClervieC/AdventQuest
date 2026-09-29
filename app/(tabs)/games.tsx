import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ARCADE_GAMES, ArcadeGame, arcadeRecord, SUDOKU_LEVELS } from '../../constants/arcade';
import { pageColumn } from '../../constants/layout';
import { useI18n } from '../../services/i18n';
import { BOSS_DAY, useGameStore } from '../../store/gameStore';
import { useRecordsStore } from '../../store/recordsStore';

// Salle de jeux : une sélection de jeux rejouables à l'infini (sans fin qui accélère, ou par niveaux),
// sans points pour le classement. Un jeu se débloque avec son premier jour dans le calendrier : jour passé,
// ou jour en cours déjà tenté (pour ne pas s'entraîner avant la vraie partie). Record personnel pour chacun.

export default function GamesScreen() {
  const insets = useSafeAreaInsets();
  const { tr, l } = useI18n();
  const { currentDay, days, canTest, bossUnlocked } = useGameStore();
  const records = useRecordsStore((state) => state.records);

  const isUnlocked = (game: ArcadeGame) => {
    const day = game.unlockDay;
    if (day === BOSS_DAY && !bossUnlocked()) return false; // le boss demande 12 fragments
    if (day < currentDay) return true;
    if (day === currentDay) return (days[day]?.attempts ?? 0) > 0;
    return canTest(day); // testeurs : leurs jours ouverts en avance
  };

  const unlocked = ARCADE_GAMES.filter(isUnlocked);
  const locked = ARCADE_GAMES.filter((g) => !isUnlocked(g));
  const dayBest = (day: number) => days[day]?.bestScore ?? 0;
  const recordLine = (value: number) => (value > 0 ? tr(`🏆 Record : ${value}`, `🏆 Best: ${value}`) : tr('🏆 Pas encore de record', '🏆 No record yet'));
  const open = (game: ArcadeGame, level?: string) =>
    router.push({ pathname: '/arcade/[id]', params: level ? { id: game.id, level } : { id: game.id } });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[pageColumn(16), { paddingTop: insets.top + 16, paddingBottom: 32 }]}>
      <Text style={styles.title}>{tr('🎮 Salle de jeux', '🎮 Games room')}</Text>
      <Text style={styles.subtitle}>
        {tr(
          'Tes jeux débloqués, à rejouer autant que tu veux : sans fin ou par niveaux, pour battre ton record. Aucun point pour le classement ici.',
          'Your unlocked games, to replay as much as you like: endless or level by level, to beat your record. No leaderboard points here.'
        )}
      </Text>

      {unlocked.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔒</Text>
          <Text style={styles.emptyText}>
            {currentDay === 0
              ? tr('Les jeux se débloquent jour après jour à partir du 1er décembre.', 'Games unlock day by day from 1 December.')
              : tr('Joue la case du jour pour débloquer ton premier jeu ici.', 'Play today’s door to unlock your first game here.')}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {unlocked.map((game) => {
            if (game.game === 'sudoku') {
              // Sudoku : on choisit son niveau, chacun a son record
              return (
                <View key={game.id} style={styles.card}>
                  <Text style={styles.cardName}>
                    {game.icon} {l(game.name)}
                  </Text>
                  <Text style={styles.cardDescription}>{l(game.description)}</Text>
                  <View style={styles.levels}>
                    {SUDOKU_LEVELS.map(({ level, label }) => {
                      const record = arcadeRecord(game, records, dayBest, level);
                      return (
                        <Pressable key={level} style={styles.levelChip} onPress={() => open(game, level)} accessibilityRole="button">
                          <Text style={styles.levelName}>{l(label)}</Text>
                          <Text style={[styles.levelRecord, record > 0 && styles.recordSet]}>{record > 0 ? `🏆 ${record}` : '—'}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            }
            const record = arcadeRecord(game, records, dayBest);
            return (
              <Pressable key={game.id} style={styles.card} onPress={() => open(game)} accessibilityRole="button">
                <View style={styles.cardRow}>
                  <Text style={styles.cardIcon}>{game.icon}</Text>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardName}>{l(game.name)}</Text>
                    <Text style={styles.cardDescription}>{l(game.description)}</Text>
                    <Text style={[styles.cardRecord, record > 0 && styles.recordSet]}>{recordLine(record)}</Text>
                  </View>
                  <Text style={styles.cardPlay}>▶</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {locked.length > 0 && (
        <View style={styles.lockedBox}>
          <Text style={styles.lockedTitle}>
            {tr(`🔒 ${locked.length} jeu${locked.length > 1 ? 'x' : ''} à débloquer`, `🔒 ${locked.length} more game${locked.length === 1 ? '' : 's'} to unlock`)}
          </Text>
          <Text style={styles.lockedList}>{locked.map((g) => `${g.icon} ${tr('jour', 'day')} ${g.unlockDay}`).join('   ')}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0c1521',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: '#b7c8da',
    marginTop: 6,
    marginBottom: 16,
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: '#16233a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2c4262',
    padding: 12,
    gap: 4,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIcon: {
    fontSize: 30,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  cardDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: '#b7c8da',
  },
  cardRecord: {
    fontSize: 12,
    color: '#8ea6c0',
    marginTop: 2,
  },
  recordSet: {
    color: '#fbbf24',
    fontWeight: '700',
  },
  cardPlay: {
    fontSize: 18,
    color: '#a78bfa',
    fontWeight: '800',
  },
  levels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  levelChip: {
    flexGrow: 1,
    flexBasis: '22%',
    minWidth: 70,
    alignItems: 'center',
    backgroundColor: '#2e1a5c',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#5b45a0',
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 2,
  },
  levelName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e9e3ff',
  },
  levelRecord: {
    fontSize: 11,
    color: '#8ea6c0',
  },
  empty: {
    alignItems: 'center',
    gap: 8,
    marginTop: 40,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#b7c8da',
    textAlign: 'center',
  },
  lockedBox: {
    marginTop: 18,
    alignItems: 'center',
    gap: 6,
  },
  lockedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8ea6c0',
  },
  lockedList: {
    fontSize: 12,
    color: '#8ea6c0',
    textAlign: 'center',
    lineHeight: 20,
  },
});
