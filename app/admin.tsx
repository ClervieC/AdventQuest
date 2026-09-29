import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
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
import { COME_BACK_LABELS, gameLabel, SURVEY_WISHES } from '../constants/survey';
import { pageColumn } from '../constants/layout';
import { Localized, useI18n } from '../services/i18n';
import { useGameStore } from '../store/gameStore';

const ROLE_LABELS: Record<Role, Localized> = {
  player: { fr: '🎮 Joueur', en: '🎮 Player' },
  tester: { fr: '🧪 Testeur', en: '🧪 Tester' },
  admin: { fr: '🛠️ Admin', en: '🛠️ Admin' },
};
const ALL_DAYS = Array.from({ length: 24 }, (_, i) => i + 1);

const goBack = () => (router.canGoBack() ? router.back() : router.replace('/profile'));

// Props de « tirer vers le bas pour actualiser » passées aux listes des onglets
interface PullToRefresh {
  refreshControl: React.ReactElement<React.ComponentProps<typeof RefreshControl>>;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEventThrottle: number;
}

const PULL_THRESHOLD = 70; // px tirés au-dessus du haut de la liste pour déclencher (web)

function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);
  const busy = useRef(false);
  const armed = useRef(true); // web : il faut revenir en haut de la liste avant de pouvoir relancer

  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setRefreshing(true);
    await onRefresh();
    busy.current = false;
    setRefreshing(false);
  }, [onRefresh]);

  const pull: PullToRefresh = {
    refreshControl: <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#a78bfa" colors={['#7c3aed']} />,
    // Web (appli installée sur l'iPhone) : RefreshControl n'existe pas, on détecte le rebond élastique au-dessus de la liste
    onScroll:
      Platform.OS === 'web'
        ? (event) => {
            const y = event.nativeEvent.contentOffset.y;
            if (y >= 0) armed.current = true;
            else if (y < -PULL_THRESHOLD && armed.current) {
              armed.current = false;
              refresh();
            }
          }
        : undefined,
    scrollEventThrottle: 16,
  };
  return { refreshing, refresh, pull };
}

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const { tr } = useI18n();
  const role = useGameStore((state) => state.role);
  const [tab, setTab] = useState<'users' | 'feedback' | 'survey'>('users');
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [feedback, setFeedback] = useState<FeedbackEntry[] | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  // null = pas encore chargé ; 'unavailable' = la table du sondage n'existe pas encore (SQL pas lancé)
  const [surveys, setSurveys] = useState<SeasonSurveyEntry[] | 'unavailable' | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const [list, entries, me] = await Promise.all([adminListUsers(), adminListFeedback(), getMyUserId()]);
      setUsers(list);
      setFeedback(entries);
      setMyId(me);
      setError(false);
      // Chargé à part : si la migration du sondage n'est pas encore passée, le reste de l'admin marche quand même
      setSurveys(await adminListSeasonSurveys().catch(() => 'unavailable' as const));
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    if (role === 'admin') load();
  }, [role, load]);

  const { refreshing, refresh, pull } = usePullToRefresh(load);

  if (role !== 'admin') {
    return (
      <View style={[styles.screen, styles.column, styles.centered, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.empty}>{tr('Cette page est réservée aux administrateurs.', 'This page is for administrators only.')}</Text>
        <Pressable style={styles.secondaryButton} onPress={goBack}>
          <Text style={styles.secondaryButtonText}>{tr('Retour', 'Back')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      {/* En-tête centré à la largeur du calendrier ; les listes défilent sur toute la largeur de l'écran */}
      <View style={styles.column}>
      <Pressable onPress={goBack} hitSlop={12} style={styles.back}>
        <Text style={styles.backText}>{tr('‹ Profil', '‹ Profile')}</Text>
      </Pressable>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{tr('🛠️ Administration', '🛠️ Admin')}</Text>
        {/* Sur le web la roue de RefreshControl ne s'affiche pas : on la montre ici, avec un bouton pour l'ordinateur */}
        {refreshing ? (
          <ActivityIndicator color="#a78bfa" />
        ) : (
          <Pressable onPress={refresh} hitSlop={10} accessibilityLabel={tr('Actualiser', 'Refresh')}>
            <Text style={styles.refreshText}>↻</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.segmented}>
        <Pressable onPress={() => setTab('users')} style={[styles.segment, tab === 'users' && styles.segmentActive]}>
          <Text style={[styles.segmentText, tab === 'users' && styles.segmentTextActive]}>{tr('👥 Joueurs', '👥 Players')} ({users?.length ?? '…'})</Text>
        </Pressable>
        <Pressable onPress={() => setTab('feedback')} style={[styles.segment, tab === 'feedback' && styles.segmentActive]}>
          <Text style={[styles.segmentText, tab === 'feedback' && styles.segmentTextActive]}>{tr('💬 Retours', '💬 Feedback')} ({feedback ? feedback.filter((f) => !f.resolved_at).length : '…'})</Text>
        </Pressable>
        <Pressable onPress={() => setTab('survey')} style={[styles.segment, tab === 'survey' && styles.segmentActive]}>
          <Text style={[styles.segmentText, tab === 'survey' && styles.segmentTextActive]}>
            {tr('📊 Sondage', '📊 Survey')} ({Array.isArray(surveys) ? surveys.length : '…'})
          </Text>
        </Pressable>
      </View>

      {error && <Text style={styles.error}>{tr('Chargement impossible. Vérifie ta connexion.', 'Couldn’t load. Check your connection.')}</Text>}
      {!users && !error && <ActivityIndicator style={styles.loader} color="#7c3aed" />}
      </View>
      {users && tab === 'users' && <UsersTab users={users} myId={myId} onChanged={load} pull={pull} />}
      {feedback && tab === 'feedback' && <FeedbackTab entries={feedback} onChanged={load} pull={pull} />}
      {tab === 'survey' && surveys === 'unavailable' && (
        <View style={styles.column}>
          <Text style={styles.empty}>
            {tr(
              'Sondage indisponible : lance d’abord le SQL 20260929000000_season_survey.sql dans Supabase.',
              'Survey unavailable: first run the SQL 20260929000000_season_survey.sql in Supabase.'
            )}
          </Text>
        </View>
      )}
      {tab === 'survey' && Array.isArray(surveys) && <SurveyTab entries={surveys} pull={pull} />}
    </View>
  );
}

// ---------- Utilisateurs ----------

function UsersTab({ users, myId, onChanged, pull }: { users: AdminUser[]; myId: string | null; onChanged: () => void; pull: PullToRefresh }) {
  const { tr } = useI18n();
  const [filter, setFilter] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? users.filter((u) => u.username.toLowerCase().includes(q)) : users;
  }, [users, filter]);

  return (
    <FlatList
      {...pull}
      data={visible}
      keyExtractor={(u) => u.user_id}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <TextInput
          value={filter}
          onChangeText={setFilter}
          placeholder={tr('🔎 Filtrer par pseudo', '🔎 Filter by username')}
          placeholderTextColor="#8ea6c0"
          autoCapitalize="none"
          style={styles.input}
        />
      }
      ListEmptyComponent={<Text style={styles.empty}>{tr('Aucun utilisateur.', 'No users.')}</Text>}
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
  const { tr, l, locale } = useI18n();
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
      setError(tr('Action impossible, réessaie.', 'Action failed, try again.'));
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
            {isMe ? tr(' (toi)', ' (you)') : ''}
          </Text>
          <Text style={styles.userMeta}>
            {l(ROLE_LABELS[user.role])} · {user.has_password ? tr('🔒 compte protégé', '🔒 protected account') : tr('👤 anonyme', '👤 anonymous')} · ✦ {user.fragments_count} ·{' '}
            {user.total_score.toLocaleString(locale)} pts
          </Text>
          <Text style={styles.userDate}>
            {tr('Inscrit le', 'Joined on')} {new Date(user.created_at).toLocaleDateString(locale)}
          </Text>
        </View>
        <Text style={styles.chevron}>{open ? '▴' : '▾'}</Text>
      </Pressable>

      {open && (
        <View style={styles.userActions}>
          {isMe ? (
            <Text style={styles.note}>
              {tr(
                'C’est ton compte : tu ne peux pas changer ton propre rôle ni te supprimer ici (voir Profil).',
                'This is your account: you can’t change your own role or delete yourself here (see Profile).'
              )}
            </Text>
          ) : (
            <>
              <Text style={styles.label}>{tr('Rôle', 'Role')}</Text>
              <View style={styles.row}>
                {(['player', 'tester', 'admin'] as Role[]).map((r) => (
                  <Pressable
                    key={r}
                    disabled={busy || user.role === r}
                    onPress={() => run(() => adminSetRole(user.user_id, r))}
                    style={[styles.chip, user.role === r && styles.chipOn]}
                  >
                    <Text style={[styles.chipText, user.role === r && styles.chipTextOn]}>{l(ROLE_LABELS[r])}</Text>
                  </Pressable>
                ))}
              </View>

              {user.role === 'tester' && (
                <>
                  <Text style={styles.label}>
                    {tr('Jours ouverts en test', 'Days open for testing')} ({days.length}/24)
                  </Text>
                  <View style={styles.daysGrid}>
                    {ALL_DAYS.map((day) => (
                      <Pressable key={day} onPress={() => toggleDay(day)} style={[styles.dayChip, days.includes(day) && styles.dayChipOn]}>
                        <Text style={[styles.dayChipText, days.includes(day) && styles.chipTextOn]}>{day}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={styles.row}>
                    <Pressable style={styles.smallButton} onPress={() => setDays(ALL_DAYS)}>
                      <Text style={styles.smallButtonText}>{tr('Tous', 'All')}</Text>
                    </Pressable>
                    <Pressable style={styles.smallButton} onPress={() => setDays([])}>
                      <Text style={styles.smallButtonText}>{tr('Aucun', 'None')}</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.primaryButton, styles.flex, (!daysChanged || busy) && styles.disabled]}
                      disabled={!daysChanged || busy}
                      onPress={() => run(() => adminSetTesterDays(user.user_id, days))}
                    >
                      <Text style={styles.primaryButtonText}>{tr('Enregistrer les jours', 'Save days')}</Text>
                    </Pressable>
                  </View>
                </>
              )}

              {!confirmReset ? (
                <Pressable style={styles.secondaryOutline} onPress={() => setConfirmReset(true)} disabled={busy}>
                  <Text style={styles.secondaryOutlineText}>{tr('↺ Réinitialiser la progression', '↺ Reset progress')}</Text>
                </Pressable>
              ) : (
                <View style={styles.confirmBox}>
                  <Text style={styles.note}>
                    {tr(
                      `Effacer tous les scores et fragments de « ${user.username} » (le compte est gardé) ?`,
                      `Erase all scores and shards of “${user.username}” (the account is kept)?`
                    )}
                  </Text>
                  <View style={styles.row}>
                    <Pressable style={[styles.secondaryButton, styles.flex]} onPress={() => setConfirmReset(false)} disabled={busy}>
                      <Text style={styles.secondaryButtonText}>{tr('Annuler', 'Cancel')}</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.primaryButton, styles.flex]}
                      onPress={() => run(async () => { await adminResetProgress(user.user_id); setConfirmReset(false); })}
                      disabled={busy}
                    >
                      <Text style={styles.primaryButtonText}>{tr('Oui, réinitialiser', 'Yes, reset')}</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {!confirmDelete ? (
                <Pressable style={styles.dangerOutline} onPress={() => setConfirmDelete(true)} disabled={busy}>
                  <Text style={styles.dangerOutlineText}>{tr('🗑️ Supprimer ce compte', '🗑️ Delete this account')}</Text>
                </Pressable>
              ) : (
                <View style={styles.confirmBox}>
                  <Text style={styles.note}>
                    {tr(
                      `Supprimer définitivement « ${user.username} » et toute sa progression ?`,
                      `Permanently delete “${user.username}” and all their progress?`
                    )}
                  </Text>
                  <View style={styles.row}>
                    <Pressable style={[styles.secondaryButton, styles.flex]} onPress={() => setConfirmDelete(false)} disabled={busy}>
                      <Text style={styles.secondaryButtonText}>{tr('Annuler', 'Cancel')}</Text>
                    </Pressable>
                    <Pressable style={[styles.dangerButton, styles.flex]} onPress={() => run(() => adminDeleteUser(user.user_id))} disabled={busy}>
                      {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{tr('Oui, supprimer', 'Yes, delete')}</Text>}
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

function FeedbackTab({ entries, onChanged, pull }: { entries: FeedbackEntry[]; onChanged: () => void; pull: PullToRefresh }) {
  const { tr, locale } = useI18n();
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
  const formatDate = (iso: string) => new Date(iso).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' });

  return (
    <FlatList
      {...pull}
      data={visible}
      keyExtractor={(f) => String(f.id)}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.feedbackViews}>
          {(['todo', 'archive'] as FeedbackView[]).map((value) => (
            <Pressable key={value} onPress={() => setView(value)} style={[styles.feedbackViewChip, view === value && styles.feedbackViewChipActive]}>
              <Text style={[styles.feedbackViewText, view === value && styles.feedbackViewTextActive]}>
                {value === 'todo' ? `${tr('📥 À traiter', '📥 To do')} (${todo.length})` : `${tr('🗄️ Archivés', '🗄️ Archived')} (${archive.length})`}
              </Text>
            </Pressable>
          ))}
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.empty}>
          {view === 'archive'
            ? tr('Aucun retour archivé. Marque un retour comme traité pour le retrouver ici.', 'No archived feedback. Mark feedback as done to find it here.')
            : entries.length === 0
            ? tr('Aucun retour pour l’instant. Donne le rôle testeur à des joueurs pour en recevoir.', 'No feedback yet. Give players the tester role to receive some.')
            : tr('Tout est traité 🎉', 'All done 🎉')}
        </Text>
      }
      renderItem={({ item }) => {
        const config = getDayConfig(item.day);
        return (
          <View style={styles.feedbackCard}>
            <View style={styles.feedbackHeader}>
              <Text style={styles.feedbackDay}>
                {tr('Jour', 'Day')} {item.day} {config ? `· ${config.fragmentIcon} ${config.game}` : ''}
              </Text>
              {item.rating !== null && <Text style={styles.feedbackStars}>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</Text>}
            </View>
            <Text style={styles.feedbackMeta}>
              {item.username} · {formatDate(item.created_at)}
            </Text>
            {item.liked !== '' && <Text style={styles.feedbackText}>👍 {item.liked}</Text>}
            {item.to_change !== '' && <Text style={styles.feedbackText}>🔧 {item.to_change}</Text>}
            {item.resolved_at && <Text style={styles.feedbackResolved}>{tr('✅ Traité le', '✅ Done on')} {formatDate(item.resolved_at)}</Text>}
            <View style={styles.feedbackActions}>
              <Pressable
                onPress={() => run(item.id, () => adminSetFeedbackResolved(item.id, !item.resolved_at))}
                disabled={busyId === item.id}
                hitSlop={6}
                style={[styles.feedbackResolveButton, item.resolved_at && styles.feedbackReopenButton]}
              >
                <Text style={[styles.feedbackResolveText, item.resolved_at && styles.feedbackReopenText]}>
                  {busyId === item.id ? '…' : item.resolved_at ? tr('↩ Remettre à traiter', '↩ Move back to to-do') : tr('✓ Marquer comme traité', '✓ Mark as done')}
                </Text>
              </Pressable>
              <Pressable onPress={() => run(item.id, () => adminDeleteFeedback(item.id))} disabled={busyId === item.id} hitSlop={6}>
                <Text style={styles.feedbackDeleteText}>{tr('Supprimer', 'Delete')}</Text>
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

function SurveyTab({ entries, pull }: { entries: SeasonSurveyEntry[]; pull: PullToRefresh }) {
  const { tr, l, locale } = useI18n();
  const wishLabel = (value: string) => {
    const wish = SURVEY_WISHES.find((w) => w.value === value);
    return wish ? l(wish.label) : value;
  };
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
      {...pull}
      data={entries}
      keyExtractor={(e) => e.user_id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.empty}>
          {tr('Aucune réponse pour l’instant. Le sondage s’affiche à la fin du jour 24.', 'No answers yet. The survey appears at the end of day 24.')}
        </Text>}
      ListHeaderComponent={
        entries.length > 0 ? (
          <View style={styles.surveySummary}>
            <Text style={styles.surveySummaryTitle}>
              {tr(`${entries.length} réponse${entries.length > 1 ? 's' : ''}`, `${entries.length} answer${entries.length === 1 ? '' : 's'}`)}
              {average !== null ? ` · ${tr('note moyenne', 'average rating')} ${average.toFixed(1)} / 5 ★` : ''}
            </Text>
            <Text style={styles.surveySection}>{tr('Rejouera l’an prochain', 'Will play again next year')}</Text>
            <Text style={styles.feedbackText}>
              {comeBack.map(([value, count]) => `${l(COME_BACK_LABELS[value])} ${count}`).join('   ')}
            </Text>
            {games.length > 0 && <Text style={styles.surveySection}>{tr('Jeux préférés', 'Favourite games')}</Text>}
            {bars(games, (key) => l(gameLabel(key)))}
            {wishes.length > 0 && <Text style={styles.surveySection}>{tr('Envies pour l’an prochain', 'Wishes for next year')}</Text>}
            {bars(wishes, wishLabel)}
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
            {new Date(item.updated_at).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })}
            {item.come_back ? ` · ${tr('Rejouera :', 'Will play again:')} ${l(COME_BACK_LABELS[item.come_back])}` : ''}
          </Text>
          {item.favorite_games.length > 0 && <Text style={styles.feedbackText}>🎮 {item.favorite_games.map((key) => l(gameLabel(key))).join(', ')}</Text>}
          {item.liked !== '' && <Text style={styles.feedbackText}>👍 {item.liked}</Text>}
          {item.wishes.length > 0 && <Text style={styles.feedbackText}>✨ {item.wishes.map(wishLabel).join(', ')}</Text>}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  refreshText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#a78bfa',
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
