import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  fetchFollowingIds,
  fetchLeaderboard,
  fetchLeaderboardFor,
  followUser,
  getMyUserId,
  LeaderboardEntry,
  searchUsers,
  subscribeLeaderboard,
  unfollowUser,
  UserSearchResult,
} from '../../services/api';

const MEDALS = ['🥇', '🥈', '🥉'];
type Scope = 'all' | 'friends';

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const [scope, setScope] = useState<Scope>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scopeRef = useRef(scope);
  scopeRef.current = scope;

  const load = useCallback(async () => {
    try {
      const [me, followingIds] = await Promise.all([getMyUserId(), fetchFollowingIds()]);
      setMyId(me);
      setFollowing(new Set(followingIds));
      const rows =
        scopeRef.current === 'all'
          ? await fetchLeaderboard()
          : await fetchLeaderboardFor([...followingIds, ...(me ? [me] : [])]);
      setEntries(rows);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    setEntries(null);
    load();
  }, [scope, load]);

  // Temps réel : dès qu'un joueur termine une partie, on recharge le classement
  useEffect(() => subscribeLeaderboard(load), [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Suivre / ne plus suivre, avec mise à jour immédiate de l'affichage
  const toggleFollow = async (userId: string) => {
    const isFollowed = following.has(userId);
    setFollowing((current) => {
      const next = new Set(current);
      if (isFollowed) next.delete(userId);
      else next.add(userId);
      return next;
    });
    try {
      if (isFollowed) await unfollowUser(userId);
      else await followUser(userId);
      if (scopeRef.current === 'friends') load();
    } catch {
      load(); // échec : on se recale sur le serveur
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>🏆 Classement</Text>
      {entries?.some((e) => e.is_tester) && <Text style={styles.legend}>🧪 = testeur : une partie de ses points vient de jours testés en avance</Text>}

      <View style={styles.segmented}>
        {(['all', 'friends'] as Scope[]).map((value) => (
          <Pressable key={value} onPress={() => setScope(value)} style={[styles.segment, scope === value && styles.segmentActive]}>
            <Text style={[styles.segmentText, scope === value && styles.segmentTextActive]}>
              {value === 'all' ? '🌍 Tous' : `👥 Amis${following.size > 0 ? ` (${following.size})` : ''}`}
            </Text>
          </Pressable>
        ))}
      </View>

      {scope === 'friends' && <UserSearch following={following} onToggleFollow={toggleFollow} />}

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
          ListEmptyComponent={
            <Text style={styles.empty}>
              {scope === 'friends'
                ? 'Tu ne suis encore personne. Cherche le pseudo d’un ami ci-dessus.'
                : 'Personne n’a encore joué. Sois le premier !'}
            </Text>
          }
          renderItem={({ item, index }) => {
            const isMe = item.user_id === myId;
            return (
              <View style={[styles.row, isMe && styles.rowMe]}>
                <Text style={styles.rank}>{MEDALS[index] ?? `${index + 1}`}</Text>
                <View style={styles.player}>
                  <Text style={[styles.name, isMe && styles.nameMe]} numberOfLines={1}>
                    {item.username}
                    {isMe ? ' (toi)' : ''}
                    {item.is_tester ? ' 🧪' : ''}
                  </Text>
                  <Text style={styles.details}>
                    ✦ {item.fragments_count} fragment{item.fragments_count > 1 ? 's' : ''}
                    {item.streak >= 2 ? `  ·  🔥 ${item.streak} jours d'affilée` : ''}
                  </Text>
                </View>
                <View style={styles.right}>
                  <Text style={styles.score}>{item.total_score.toLocaleString('fr-FR')}</Text>
                  {!isMe && (
                    <FollowButton followed={following.has(item.user_id)} onPress={() => toggleFollow(item.user_id)} small />
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

function FollowButton({ followed, onPress, small }: { followed: boolean; onPress: () => void; small?: boolean }) {
  return (
    <Pressable onPress={onPress} hitSlop={6} style={[styles.followButton, followed && styles.followButtonOn, small && styles.followButtonSmall]}>
      <Text style={[styles.followText, followed && styles.followTextOn]}>{followed ? '✓ Suivi' : '+ Suivre'}</Text>
    </Pressable>
  );
}

// Recherche d'un joueur par pseudo (dès 2 lettres), pour le suivre
function UserSearch({ following, onToggleFollow }: { following: Set<string>; onToggleFollow: (userId: string) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    // Petite attente pour ne pas interroger le serveur à chaque lettre tapée
    const timer = setTimeout(() => {
      searchUsers(trimmed)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <View style={styles.search}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="🔎 Rechercher un joueur par pseudo"
        placeholderTextColor="#8ea6c0"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.searchInput}
      />
      {searching && <ActivityIndicator style={styles.searchLoader} color="#7c3aed" size="small" />}
      {!searching && query.trim().length >= 2 && results.length === 0 && (
        <Text style={styles.searchEmpty}>Aucun joueur trouvé.</Text>
      )}
      {results.map((user) => (
        <View key={user.user_id} style={styles.searchRow}>
          <Text style={styles.searchName} numberOfLines={1}>
            {user.username}
          </Text>
          <FollowButton followed={following.has(user.user_id)} onPress={() => onToggleFollow(user.user_id)} />
        </View>
      ))}
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
  legend: {
    fontSize: 10,
    color: '#8ea6c0',
    marginTop: 4,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#16233a',
    borderRadius: 12,
    padding: 4,
    marginTop: 12,
    marginBottom: 12,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: '#2e1a5c',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8ea6c0',
  },
  segmentTextActive: {
    color: '#c4b5fd',
  },
  search: {
    marginBottom: 12,
    gap: 6,
  },
  searchInput: {
    backgroundColor: '#16233a',
    borderWidth: 1,
    borderColor: '#3a5a82',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#fff',
  },
  searchLoader: {
    marginVertical: 6,
  },
  searchEmpty: {
    fontSize: 12,
    color: '#8ea6c0',
    textAlign: 'center',
    marginVertical: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#16233a',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 10,
  },
  searchName: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
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
    backgroundColor: '#16233a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2c4262',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  rowMe: {
    borderColor: '#7c3aed',
    backgroundColor: '#221647',
  },
  rank: {
    width: 28,
    fontSize: 16,
    fontWeight: '700',
    color: '#b7c8da',
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
    color: '#8ea6c0',
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
  },
  score: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fbbf24',
  },
  followButton: {
    borderWidth: 1,
    borderColor: '#7c3aed',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  followButtonSmall: {
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  followButtonOn: {
    backgroundColor: '#2e1a5c',
    borderColor: '#5b45a0',
  },
  followText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a78bfa',
  },
  followTextOn: {
    color: '#b7c8da',
  },
  empty: {
    fontSize: 13,
    color: '#8ea6c0',
    textAlign: 'center',
    marginTop: 24,
  },
  retry: {
    marginTop: 12,
    backgroundColor: '#243a5a',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryText: {
    color: '#b7c8da',
    fontWeight: '600',
  },
});
