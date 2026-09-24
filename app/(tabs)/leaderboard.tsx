import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchLeaderboard, LeaderboardEntry, subscribeLeaderboard } from '../../services/api';
import { useGameStore } from '../../store/gameStore';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const username = useGameStore((state) => state.username);
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setEntries(await fetchLeaderboard());
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    load();
    // Temps réel : dès qu'un joueur termine une partie, on recharge le classement
    return subscribeLeaderboard(load);
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>🏆 Classement</Text>
      <Text style={styles.subtitle}>Mis à jour en direct</Text>

      {entries === null && !error && <ActivityIndicator style={styles.loader} color="#7c3aed" />}

      {error && (
        <View style={styles.centered}>
          <Text style={styles.empty}>Classement indisponible pour le moment.</Text>
          <Pressable style={styles.retry} onPress={load}>
            <Text style={styles.retryText}>↻ Réessayer</Text>
          </Pressable>
        </View>
      )}

      {entries && (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.user_id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#7c3aed" />}
          ListEmptyComponent={<Text style={styles.empty}>Personne n&apos;a encore joué. Sois le premier !</Text>}
          renderItem={({ item, index }) => {
            const isMe = item.username === username;
            return (
              <View style={[styles.row, isMe && styles.rowMe]}>
                <Text style={styles.rank}>{MEDALS[index] ?? `${index + 1}`}</Text>
                <View style={styles.player}>
                  <Text style={[styles.name, isMe && styles.nameMe]} numberOfLines={1}>
                    {item.username}
                    {isMe ? ' (toi)' : ''}
                  </Text>
                  <Text style={styles.details}>
                    ✦ {item.fragments_count} fragment{item.fragments_count > 1 ? 's' : ''}
                    {item.streak >= 2 ? `  ·  🔥 ${item.streak} jours d'affilée` : ''}
                  </Text>
                </View>
                <Text style={styles.score}>{item.total_score.toLocaleString('fr-FR')}</Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1521',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 11,
    color: '#3a5a7a',
    marginTop: 4,
    marginBottom: 12,
  },
  loader: {
    marginTop: 40,
  },
  centered: {
    alignItems: 'center',
    marginTop: 40,
  },
  list: {
    gap: 8,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090e18',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#141e2a',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  rowMe: {
    borderColor: '#7c3aed',
    backgroundColor: '#130d2a',
  },
  rank: {
    width: 28,
    fontSize: 16,
    fontWeight: '700',
    color: '#7a9ab8',
    textAlign: 'center',
  },
  player: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  nameMe: {
    color: '#c4b5fd',
  },
  details: {
    fontSize: 11,
    color: '#3a5a7a',
    marginTop: 2,
  },
  score: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fbbf24',
  },
  empty: {
    fontSize: 13,
    color: '#3a5a7a',
    textAlign: 'center',
    marginTop: 24,
  },
  retry: {
    marginTop: 12,
    backgroundColor: '#162540',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryText: {
    color: '#7a9ab8',
    fontWeight: '600',
  },
});
