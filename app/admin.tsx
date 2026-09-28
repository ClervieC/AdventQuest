import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDayConfig } from '../constants/days';
import {
  adminDeleteFeedback,
  adminSetFeedbackResolved,
  adminDeleteUser,
  AdminUser,
  adminListFeedback,
  adminListSeasonSurveys,
  adminListUsers,
  adminResetProgress,
  adminSetRole,
  adminSetTesterDays,
  FeedbackEntry,
  getMyUserId,
  Role,
  SeasonSurveyEntry,
} from '../services/api';
import { COME_BACK_LABELS, gameLabel } from '../constants/survey';
import { pageColumn } from '../constants/layout';
import { useGameStore } from '../store/gameStore';

const ROLE_LABELS: Record<Role, string> = { player: '🎮 Joueur', tester: '🧪 Testeur', admin: '🛠️ Admin' };
const ALL_DAYS = Array.from({ length: 24 }, (_, i) => i + 1);

const goBack = () => (router.canGoBack() ? router.back() : router.replace('/profile'));

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const role = useGameStore((state) => state.role);
  const [tab, setTab] = useState<'users' | 'feedback' | 'survey'>('users');
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [feedback, setFeedback] = useState<FeedbackEntry[] | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  // null = pas encore chargé ; 'unavailable' = la table du sondage n'existe pas encore (SQL pas lancé)
  const [surveys, setSurveys] = useState<SeasonSurveyEntry[] | 'unavailable' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [list, entries, me] = await Promise.all([adminListUsers(), adminListFeedback(), getMyUserId()]);
      setUsers(list);
      setFeedback(entries);
      setMyId(me);
      setError(null);
      // Chargé à part : si la migration du sondage n'est pas encore passée, le reste de l'admin marche quand même
      setSurveys(await adminListSeasonSurveys().catch(() => 'unavailable' as const));
    } catch {
      setError('Chargement impossible. Vérifie ta connexion.');
    }
  }, []);

  useEffect(() => {
    if (role === 'admin') load();
  }, [role, load]);

  if (role !== 'admin') {
    return (
      <View style={[styles.screen, styles.column, styles.centered, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.empty}>Cette page est réservée aux administrateurs.</Text>
        <Pressable style={styles.secondaryButton} onPress={goBack}>
          <Text style={styles.secondaryButtonText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      {/* En-tête centré à la largeur du calendrier ; les listes défilent sur toute la largeur de l'écran */}
      <View style={styles.column}>
      <Pressable onPress={goBack} hitSlop={12} style={styles.back}>
        <Text style={styles.backText}>‹ Profil</Text>
      </Pressable>
      <Text style={styles.title}>🛠️ Administration</Text>

      <View style={styles.segmented}>
        <Pressable onPress={() => setTab('users')} style={[styles.segment, tab === 'users' && styles.segmentActive]}>
          <Text style={[styles.segmentText, tab === 'users' && styles.segmentTextActive]}>👥 Joueurs ({users?.length ?? '…'})</Text>
        </Pressable>
        <Pressable onPress={() => setTab('feedback')} style={[styles.segment, tab === 'feedback' && styles.segmentActive]}>
          <Text style={[styles.segmentText, tab === 'feedback' && styles.segmentTextActive]}>💬 Retours ({feedback ? feedback.filter((f) => !f.resolved_at).length : '…'})</Text>
        </Pressable>
        <Pressable onPress={() => setTab('survey')} style={[styles.segment, tab === 'survey' && styles.segmentActive]}>
          <Text style={[styles.segmentText, tab === 'survey' && styles.segmentTextActive]}>
            📊 Sondage ({Array.isArray(surveys) ? surveys.length : '…'})
          </Text>
        </Pressable>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {!users && !error && <ActivityIndicator style={styles.loader} color="#7c3aed" />}
      </View>
      {users && tab === 'users' && <UsersTab users={users} myId={myId} onChanged={load} />}
      {feedback && tab === 'feedback' && <FeedbackTab entries={feedback} onChanged={load} />}
      {tab === 'survey' && surveys === 'unavailable' && (
        <View style={styles.column}>
          <Text style={styles.empty}>Sondage indisponible : lance d’abord le SQL 20260929000000_season_survey.sql dans Supabase.</Text>
        </View>
      )}
      {tab === 'survey' && Array.isArray(surveys) && <SurveyTab entries={surveys} />}
    </View>
  );
}

// ---------- Utilisateurs ----------

function UsersTab({ users, myId, onChanged }: { users: AdminUser[]; myId: string | null; onChanged: () => void }) {
  const [filter, setFilter] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? users.filter((u) => u.username.toLowerCase().includes(q)) : users;
  }, [users, filter]);

  return (
    <FlatList
      data={visible}
      keyExtractor={(u) => u.user_id}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <TextInput
          value={filter}
          onChangeText={setFilter}
          placeholder="🔎 Filtrer par pseudo"
          placeholderTextColor="#8ea6c0"
          autoCapitalize="none"
          style={styles.input}
        />
      }
      ListEmptyComponent={<Text style={styles.empty}>Aucun utilisateur.</Text>}
      renderItem={({ item }) => (
        <UserRow
          user={item}
          isMe={item.user_id === myId}
          open={openId === item.user_id}
          onToggle={() => setOpenId(openId === item.user_id ? null : item.user_id)}
          onChanged={onChanged}
        />
      )}
    />
  );
}

function UserRow({ user, isMe, open, onToggle, onChanged }: { user: AdminUser; isMe: boolean; open: boolean; onToggle: () => void; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<number[]>(user.tester_days ?? []);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => setDays(user.tester_days ?? []), [user.tester_days]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      onChanged();
    } catch {
      setError('Action impossible, réessaie.');
    }
    setBusy(false);
  };

  const toggleDay = (day: number) => setDays((current) => (current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort((a, b) => a - b)));
  const daysChanged = JSON.stringify(days) !== JSON.stringify(user.tester_days ?? []);

  return (
    <View style={[styles.userCard, open && styles.userCardOpen]}>
      <Pressable onPress={onToggle} style={styles.userHeader}>
        <View style={styles.flex}>
          <Text style={styles.userName} numberOfLines={1}>
            {user.username}
            {isMe ? ' (toi)' : ''}
          </Text>
          <Text style={styles.userMeta}>
            {ROLE_LABELS[user.role]} · {user.has_password ? '🔒 compte protégé' : '👤 anonyme'} · ✦ {user.fragments_count} · {user.total_score.toLocaleString('fr-FR')} pts
          </Text>
          <Text style={styles.userDate}>Inscrit le {new Date(user.created_at).toLocaleDateString('fr-FR')}</Text>
        </View>
        <Text style={styles.chevron}>{open ? '▴' : '▾'}</Text>
      </Pressable>

      {open && (
        <View style={styles.userActions}>
          {isMe ? (
            <Text style={styles.note}>C’est ton compte : tu ne peux pas changer ton propre rôle ni te supprimer ici (voir Profil).</Text>
          ) : (
            <>
              <Text style={styles.label}>Rôle</Text>
              <View style={styles.row}>
                {(['player', 'tester', 'admin'] as Role[]).map((r) => (
                  <Pressable
                    key={r}
                    disabled={busy || user.role === r}
                    onPress={() => run(() => adminSetRole(user.user_id, r))}
                    style={[styles.chip, user.role === r && styles.chipOn]}
                  >
                    <Text style={[styles.chipText, user.role === r && styles.chipTextOn]}>{ROLE_LABELS[r]}</Text>
                  </Pressable>
                ))}
              </View>

              {user.role === 'tester' && (
                <>
                  <Text style={styles.label}>Jours ouverts en test ({days.length}/24)</Text>
                  <View style={styles.daysGrid}>
                    {ALL_DAYS.map((day) => (
                      <Pressable key={day} onPress={() => toggleDay(day)} style={[styles.dayChip, days.includes(day) && styles.dayChipOn]}>
                        <Text style={[styles.dayChipText, days.includes(day) && styles.chipTextOn]}>{day}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={styles.row}>
                    <Pressable style={styles.smallButton} onPress={() => setDays(ALL_DAYS)}>
                      <Text style={styles.smallButtonText}>Tous</Text>
                    </Pressable>
                    <Pressable style={styles.smallButton} onPress={() => setDays([])}>
                      <Text style={styles.smallButtonText}>Aucun</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.primaryButton, styles.flex, (!daysChanged || busy) && styles.disabled]}
                      disabled={!daysChanged || busy}
                      onPress={() => run(() => adminSetTesterDays(user.user_id, days))}
                    >
                      <Text style={styles.primaryButtonText}>Enregistrer les jours</Text>
                    </Pressable>
                  </View>
                </>
              )}

              {!confirmReset ? (
                <Pressable style={styles.secondaryOutline} onPress={() => setConfirmReset(true)} disabled={busy}>
                  <Text style={styles.secondaryOutlineText}>↺ Réinitialiser la progression</Text>
                </Pressable>
              ) : (
                <View style={styles.confirmBox}>
                  <Text style={styles.note}>Effacer tous les scores et fragments de « {user.username} » (le compte est gardé) ?</Text>
                  <View style={styles.row}>
                    <Pressable style={[styles.secondaryButton, styles.flex]} onPress={() => setConfirmReset(false)} disabled={busy}>
                      <Text style={styles.secondaryButtonText}>Annuler</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.primaryButton, styles.flex]}
                      onPress={() => run(async () => { await adminResetProgress(user.user_id); setConfirmReset(false); })}
                      disabled={busy}
                    >
                      <Text style={styles.primaryButtonText}>Oui, réinitialiser</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {!confirmDelete ? (
                <Pressable style={styles.dangerOutline} onPress={() => setConfirmDelete(true)} disabled={busy}>
                  <Text style={styles.dangerOutlineText}>🗑️ Supprimer ce compte</Text>
                </Pressable>
              ) : (
                <View style={styles.confirmBox}>
                  <Text style={styles.note}>Supprimer définitivement « {user.username} » et toute sa progression ?</Text>
                  <View style={styles.row}>
                    <Pressable style={[styles.secondaryButton, styles.flex]} onPress={() => setConfirmDelete(false)} disabled={busy}>
                      <Text style={styles.secondaryButtonText}>Annuler</Text>
                    </Pressable>
                    <Pressable style={[styles.dangerButton, styles.flex]} onPress={() => run(() => adminDeleteUser(user.user_id))} disabled={busy}>
                      {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Oui, supprimer</Text>}
                    </Pressable>
                  </View>
                </View>
              )}
            </>
          )}
          {error && <Text style={styles.error}>{error}</Text>}
        </View>
      )}
    </View>
  );
}

// ---------- Retours des testeurs ----------

type FeedbackView = 'todo' | 'archive';

function FeedbackTab({ entries, onChanged }: { entries: FeedbackEntry[]; onChanged: () => void }) {
  const [busyId, setBusyId] = useState<number | null>(null);
  // À traiter / Archivés (retours déjà traités, gardés pour l'historique)
  const [view, setView] = useState<FeedbackView>('todo');
  const todo = entries.filter((f) => !f.resolved_at);
  const archive = entries
    .filter((f) => f.resolved_at)
    .sort((a, b) => (b.resolved_at ?? '').localeCompare(a.resolved_at ?? ''));
  const visible = view === 'todo' ? todo : archive;

  const run = async (id: number, action: () => Promise<void>) => {
    setBusyId(id);
    try {
      await action();
      onChanged();
    } catch {
      // l'élément reste affiché : l'admin peut réessayer
    }
    setBusyId(null);
  };
  const formatDate = (iso: string) => new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

  return (
    <FlatList
      data={visible}
      keyExtractor={(f) => String(f.id)}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.feedbackViews}>
          {(['todo', 'archive'] as FeedbackView[]).map((value) => (
            <Pressable key={value} onPress={() => setView(value)} style={[styles.feedbackViewChip, view === value && styles.feedbackViewChipActive]}>
              <Text style={[styles.feedbackViewText, view === value && styles.feedbackViewTextActive]}>
                {value === 'todo' ? `📥 À traiter (${todo.length})` : `🗄️ Archivés (${archive.length})`}
              </Text>
            </Pressable>
          ))}
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.empty}>
          {view === 'archive'
            ? 'Aucun retour archivé. Marque un retour comme traité pour le retrouver ici.'
            : entries.length === 0
            ? 'Aucun retour pour l’instant. Donne le rôle testeur à des joueurs pour en recevoir.'
            : 'Tout est traité 🎉'}
        </Text>
      }
      renderItem={({ item }) => {
        const config = getDayConfig(item.day);
        return (
          <View style={styles.feedbackCard}>
            <View style={styles.feedbackHeader}>
              <Text style={styles.feedbackDay}>
                Jour {item.day} {config ? `· ${config.fragmentIcon} ${config.game}` : ''}
              </Text>
              {item.rating !== null && <Text style={styles.feedbackStars}>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</Text>}
            </View>
            <Text style={styles.feedbackMeta}>
              {item.username} · {formatDate(item.created_at)}
            </Text>
            {item.liked !== '' && <Text style={styles.feedbackText}>👍 {item.liked}</Text>}
            {item.to_change !== '' && <Text style={styles.feedbackText}>🔧 {item.to_change}</Text>}
            {item.resolved_at && <Text style={styles.feedbackResolved}>✅ Traité le {formatDate(item.resolved_at)}</Text>}
            <View style={styles.feedbackActions}>
              <Pressable
                onPress={() => run(item.id, () => adminSetFeedbackResolved(item.id, !item.resolved_at))}
                disabled={busyId === item.id}
                hitSlop={6}
                style={[styles.feedbackResolveButton, item.resolved_at && styles.feedbackReopenButton]}
              >
                <Text style={[styles.feedbackResolveText, item.resolved_at && styles.feedbackReopenText]}>
                  {busyId === item.id ? '…' : item.resolved_at ? '↩ Remettre à traiter' : '✓ Marquer comme traité'}
                </Text>
              </Pressable>
              <Pressable onPress={() => run(item.id, () => adminDeleteFeedback(item.id))} disabled={busyId === item.id} hitSlop={6}>
                <Text style={styles.feedbackDeleteText}>Supprimer</Text>
              </Pressable>
            </View>
          </View>
        );
      }}
    />
  );
}

// ---------- Sondage de fin de saison ----------

/** Compte les occurrences de chaque choix, du plus fréquent au moins fréquent */
function countChoices(lists: string[][]): [string, number][] {
  const counts = new Map<string, number>();
  lists.flat().forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function SurveyTab({ entries }: { entries: SeasonSurveyEntry[] }) {
  const ratings = entries.map((e) => e.rating).filter((r): r is number => r !== null);
  const average = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
  const games = countChoices(entries.map((e) => e.favorite_games));
  const wishes = countChoices(entries.map((e) => e.wishes));
  const comeBack = (['yes', 'maybe', 'no'] as const).map((v) => [v, entries.filter((e) => e.come_back === v).length] as const);

  const bars = (rows: [string, number][], label: (key: string) => string) =>
    rows.map(([key, count]) => (
      <View key={key} style={styles.surveyBarRow}>
        <Text style={styles.surveyBarLabel} numberOfLines={1}>{label(key)}</Text>
        <View style={styles.surveyBarTrack}>
          <View style={[styles.surveyBarFill, { width: `${(count / entries.length) * 100}%` }]} />
        </View>
        <Text style={styles.surveyBarCount}>{count}</Text>
      </View>
    ));

  return (
    <FlatList
      data={entries}
      keyExtractor={(e) => e.user_id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.empty}>Aucune réponse pour l’instant. Le sondage s’affiche à la fin du jour 24.</Text>}
      ListHeaderComponent={
        entries.length > 0 ? (
          <View style={styles.surveySummary}>
            <Text style={styles.surveySummaryTitle}>
              {entries.length} réponse{entries.length > 1 ? 's' : ''}
              {average !== null ? ` · note moyenne ${average.toFixed(1)} / 5 ★` : ''}
            </Text>
            <Text style={styles.surveySection}>Rejouera l’an prochain</Text>
            <Text style={styles.feedbackText}>
              {comeBack.map(([value, count]) => `${COME_BACK_LABELS[value]} ${count}`).join('   ')}
            </Text>
            {games.length > 0 && <Text style={styles.surveySection}>Jeux préférés</Text>}
            {bars(games, gameLabel)}
            {wishes.length > 0 && <Text style={styles.surveySection}>Envies pour l’an prochain</Text>}
            {bars(wishes, (w) => w)}
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <View style={styles.feedbackCard}>
          <View style={styles.feedbackHeader}>
            <Text style={styles.feedbackDay}>{item.username}</Text>
            {item.rating !== null && <Text style={styles.feedbackStars}>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</Text>}
          </View>
          <Text style={styles.feedbackMeta}>
            {new Date(item.updated_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
            {item.come_back ? ` · Rejouera : ${COME_BACK_LABELS[item.come_back]}` : ''}
          </Text>
          {item.favorite_games.length > 0 && <Text style={styles.feedbackText}>🎮 {item.favorite_games.map(gameLabel).join(', ')}</Text>}
          {item.liked !== '' && <Text style={styles.feedbackText}>👍 {item.liked}</Text>}
          {item.wishes.length > 0 && <Text style={styles.feedbackText}>✨ {item.wishes.join(', ')}</Text>}
          {item.next_year !== '' && <Text style={styles.feedbackText}>💡 {item.next_year}</Text>}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  surveySummary: {
    backgroundColor: '#1f1a0c',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#b45309',
    padding: 12,
    gap: 6,
    marginBottom: 4,
  },
  surveySummaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fbbf24',
  },
  surveySection: {
    fontSize: 12,
    fontWeight: '700',
    color: '#c4b5fd',
    marginTop: 6,
  },
  surveyBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  surveyBarLabel: {
    width: 150,
    fontSize: 12,
    color: '#dbe6f1',
  },
  surveyBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#243a5a',
    overflow: 'hidden',
  },
  surveyBarFill: {
    height: '100%',
    backgroundColor: '#fbbf24',
  },
  surveyBarCount: {
    width: 24,
    textAlign: 'right',
    fontSize: 12,
    color: '#b7c8da',
  },
  screen: {
    flex: 1,
    backgroundColor: '#0c1521',
  },
  column: pageColumn(16),
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  back: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  backText: {
    color: '#b7c8da',
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#16233a',
    borderRadius: 12,
    padding: 4,
    marginVertical: 12,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#8ea6c0',
  },
  segmentTextActive: {
    color: '#c4b5fd',
  },
  loader: {
    marginTop: 40,
  },
  list: {
    gap: 8,
    paddingBottom: 32,
    ...pageColumn(16),
  },
  input: {
    backgroundColor: '#16233a',
    borderWidth: 1,
    borderColor: '#3a5a82',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  empty: {
    fontSize: 13,
    color: '#8ea6c0',
    textAlign: 'center',
    marginTop: 24,
  },
  error: {
    fontSize: 12,
    color: '#f87171',
    marginTop: 4,
  },
  userCard: {
    backgroundColor: '#16233a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2c4262',
  },
  userCardOpen: {
    borderColor: '#5b45a0',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  userMeta: {
    fontSize: 11,
    color: '#b7c8da',
    marginTop: 3,
  },
  userDate: {
    fontSize: 10,
    color: '#8ea6c0',
    marginTop: 2,
  },
  chevron: {
    color: '#8ea6c0',
    fontSize: 14,
  },
  userActions: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#8ea6c0',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#3a5a82',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  chipOn: {
    backgroundColor: '#2e1a5c',
    borderColor: '#7c3aed',
  },
  chipText: {
    fontSize: 12,
    color: '#b7c8da',
    fontWeight: '600',
  },
  chipTextOn: {
    color: '#fff',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayChip: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3a5a82',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipOn: {
    backgroundColor: '#14532d',
    borderColor: '#34d399',
  },
  dayChipText: {
    fontSize: 12,
    color: '#b7c8da',
    fontWeight: '700',
  },
  smallButton: {
    backgroundColor: '#243a5a',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  smallButtonText: {
    color: '#b7c8da',
    fontSize: 12,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#243a5a',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#b7c8da',
    fontSize: 13,
    fontWeight: '600',
  },
  secondaryOutline: {
    borderWidth: 1,
    borderColor: '#3a5a82',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  secondaryOutlineText: {
    color: '#b7c8da',
    fontSize: 13,
    fontWeight: '600',
  },
  dangerOutline: {
    borderWidth: 1,
    borderColor: '#7f1d1d',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  dangerOutlineText: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#991b1b',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmBox: {
    gap: 8,
    marginTop: 6,
  },
  note: {
    fontSize: 12,
    color: '#b7c8da',
    lineHeight: 18,
  },
  disabled: {
    opacity: 0.4,
  },
  flex: {
    flex: 1,
  },
  feedbackCard: {
    backgroundColor: '#16233a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2c4262',
    padding: 12,
    gap: 6,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedbackDay: {
    fontSize: 14,
    fontWeight: '700',
    color: '#c4b5fd',
  },
  feedbackStars: {
    color: '#fbbf24',
    fontSize: 14,
  },
  feedbackMeta: {
    fontSize: 11,
    color: '#8ea6c0',
  },
  feedbackViews: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  feedbackViewChip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2c4262',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  feedbackViewChipActive: {
    backgroundColor: '#2e1f5e',
    borderColor: '#7c3aed',
  },
  feedbackViewText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b7c8da',
  },
  feedbackViewTextActive: {
    color: '#fff',
  },
  feedbackResolved: {
    fontSize: 11,
    color: '#34d399',
  },
  feedbackActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  feedbackResolveButton: {
    backgroundColor: '#0f3a2a',
    borderWidth: 1,
    borderColor: '#34d399',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  feedbackReopenButton: {
    backgroundColor: '#16233a',
    borderColor: '#3a5a82',
  },
  feedbackResolveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34d399',
  },
  feedbackReopenText: {
    color: '#b7c8da',
  },
  feedbackDeleteText: {
    fontSize: 11,
    color: '#f87171',
  },
  feedbackText: {
    fontSize: 13,
    color: '#cdd9e5',
    lineHeight: 19,
  },
});
