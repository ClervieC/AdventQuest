import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { fetchFriendsArcadeRecords, FriendRecord } from '../../services/api';
import { useI18n } from '../../services/i18n';

const MEDALS = ['🥇', '🥈', '🥉'];

/** Classement d'un jeu de l'onglet Jeux entre moi et les joueurs que je suis (records personnels) */
export function FriendsRecords({ recordKeys }: { recordKeys: string[] }) {
  const { tr } = useI18n();
  const [rows, setRows] = useState<FriendRecord[] | null>(null);
  const [failed, setFailed] = useState(false);
  const keysId = recordKeys.join('|');

  useEffect(() => {
    let cancelled = false;
    fetchFriendsArcadeRecords(keysId.split('|'))
      .then((next) => !cancelled && setRows(next))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [keysId]);

  if (failed) return null; // hors ligne : pas de classement, le jeu reste jouable

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{tr('👥 Records entre amis', '👥 Friends’ records')}</Text>
      {rows === null ? (
        <ActivityIndicator color="#a78bfa" />
      ) : rows.filter((r) => !r.is_me).length === 0 ? (
        <Text style={styles.empty}>
          {tr(
            'Suis des amis dans l’onglet Classement pour comparer vos records sur ce jeu.',
            'Follow friends in the Leaderboard tab to compare your records on this game.'
          )}
        </Text>
      ) : (
        rows.slice(0, 10).map((row, index) => (
          <View key={row.user_id} style={[styles.row, row.is_me && styles.rowMe]}>
            <Text style={styles.rank}>{MEDALS[index] ?? `${index + 1}`}</Text>
            <Text style={[styles.name, row.is_me && styles.nameMe]} numberOfLines={1}>
              {row.username}
              {row.is_me ? tr(' (toi)', ' (you)') : ''}
            </Text>
            <Text style={styles.score}>{row.score}</Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    backgroundColor: '#16233a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2c4262',
    padding: 12,
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#c4b5fd',
  },
  empty: {
    fontSize: 12,
    lineHeight: 17,
    color: '#8ea6c0',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  rowMe: {
    backgroundColor: '#2e1a5c',
  },
  rank: {
    width: 26,
    fontSize: 14,
    textAlign: 'center',
    color: '#b7c8da',
  },
  name: {
    flex: 1,
    fontSize: 13,
    color: '#e2e8f0',
  },
  nameMe: {
    fontWeight: '700',
    color: '#c4b5fd',
  },
  score: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fbbf24',
  },
});
