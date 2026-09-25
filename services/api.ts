// Accès au serveur Supabase. Toutes les écritures passent par des fonctions RPC côté serveur
// (voir supabase/migrations) : l'app ne peut pas tricher en écrivant directement dans les tables.
import { supabase } from './supabase';

export interface ServerProgress {
  day: number;
  fragment_won: boolean;
  best_score: number;
  attempts: number;
}

export type Role = 'player' | 'tester' | 'admin';

export interface PlayerProfile {
  id: string;
  username: string;
  timezone: string;
  role?: Role;
  tester_days?: number[]; // jours qu'un testeur peut ouvrir en avance
}

export interface PlayerState {
  profile: PlayerProfile | null;
  current_day: number; // 0 = saison pas commencée, 1..24 = jour jouable, 25 = saison terminée
  hints: number;
  progress: ServerProgress[];
}

export interface AttemptResult {
  progress: ServerProgress;
  hints: number;
  current_day: number;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  total_score: number;
  fragments_count: number;
  streak: number;
  is_tester?: boolean; // testeur ou admin : une partie de son score vient de parties de test (🧪)
}

// Codes d'erreur levés par les fonctions SQL (raise exception '...')
export type ApiErrorCode =
  | 'not_authenticated'
  | 'no_profile'
  | 'profile_exists'
  | 'invalid_username'
  | 'username_taken'
  | 'day_not_playable'
  | 'boss_locked'
  | 'no_hint_boss'
  | 'no_hint_left'
  | 'invalid_credentials'
  | 'weak_password'
  | 'email_confirmation_enabled'
  | 'not_admin'
  | 'not_tester'
  | 'empty_feedback'
  | 'network';

const KNOWN_CODES: ApiErrorCode[] = [
  'not_authenticated', 'no_profile', 'profile_exists', 'invalid_username', 'username_taken',
  'day_not_playable', 'boss_locked', 'no_hint_boss', 'no_hint_left',
  'invalid_credentials', 'weak_password', 'email_confirmation_enabled', 'not_admin', 'not_tester', 'empty_feedback',
];

export class ApiError extends Error {
  constructor(public code: ApiErrorCode, message: string) {
    super(message);
  }
}

function toApiError(error: { message?: string; code?: string } | null | undefined): ApiError {
  const message = error?.message ?? 'Erreur inconnue';
  // Codes d'erreur de Supabase Auth traduits dans nos codes
  if (error?.code === 'invalid_credentials' || /invalid login credentials/i.test(message)) {
    return new ApiError('invalid_credentials', message);
  }
  if (error?.code === 'weak_password' || /password should be/i.test(message)) {
    return new ApiError('weak_password', message);
  }
  if (/error sending|confirmation/i.test(message)) {
    return new ApiError('email_confirmation_enabled', message);
  }
  const code = KNOWN_CODES.find((c) => message.includes(c)) ?? 'network';
  return new ApiError(code, message);
}

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw toApiError(error);
  return data as T;
}

/** Ouvre (ou reprend) une session anonyme : le joueur n'a ni e-mail ni mot de passe */
export async function ensureSession(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  if (data.session) return;
  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw toApiError(error);
}

/** true si le joueur a protégé son compte (pseudo + mot de passe), false s'il est encore anonyme */
export async function hasProtectedAccount(): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  return !!data.user && !data.user.is_anonymous;
}

async function loginEmailFor(username: string): Promise<string | null> {
  return rpc<string | null>('get_login_email', { p_username: username });
}

/**
 * Ajoute un mot de passe au joueur anonyme actuel : c'est le même joueur, sa progression est gardée.
 * Supabase exige un e-mail : on utilise l'adresse technique du joueur (jamais montrée, aucun e-mail envoyé).
 */
export async function protectAccount(username: string, password: string): Promise<void> {
  const email = await loginEmailFor(username);
  if (!email) throw new ApiError('no_profile', 'Profil introuvable');

  const withEmail = await supabase.auth.updateUser({ email });
  if (withEmail.error) throw toApiError(withEmail.error);
  // Si « Confirm email » est encore activé dans Supabase, l'adresse reste en attente de confirmation
  if (withEmail.data.user?.email !== email) {
    throw new ApiError('email_confirmation_enabled', 'Désactiver « Confirm email » dans Supabase');
  }
  const withPassword = await supabase.auth.updateUser({ password });
  if (withPassword.error) throw toApiError(withPassword.error);
}

/** Connexion sur un autre appareil avec pseudo + mot de passe (remplace la session anonyme locale) */
export async function loginWithUsername(username: string, password: string): Promise<void> {
  const email = await loginEmailFor(username);
  if (!email) throw new ApiError('invalid_credentials', 'Pseudo inconnu');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw toApiError(error);
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export function fetchPlayerState(): Promise<PlayerState> {
  return rpc<PlayerState>('get_player_state');
}

export function createProfile(username: string, timezone: string): Promise<PlayerState> {
  return rpc<PlayerState>('create_profile', { p_username: username, p_timezone: timezone });
}

export function submitAttempt(day: number, score: number, success: boolean): Promise<AttemptResult> {
  return rpc<AttemptResult>('submit_attempt', { p_day: day, p_score: Math.round(score), p_success: success });
}

/** Consomme un hint côté serveur ; renvoie le nombre restant */
export function consumeHint(): Promise<number> {
  return rpc<number>('use_hint');
}

export async function fetchLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('user_id, username, total_score, fragments_count, streak, is_tester')
    .order('total_score', { ascending: false })
    .order('fragments_count', { ascending: false })
    .limit(limit);
  if (error) throw toApiError(error);
  return data ?? [];
}

/** Appelle `onChange` à chaque modification du classement (temps réel). Renvoie la fonction de désabonnement. */
export function subscribeLeaderboard(onChange: () => void): () => void {
  const channel = supabase
    .channel('leaderboard-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard' }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

/** Fuseau horaire du téléphone (ex. "Europe/Paris"), figé côté serveur à la création du profil */
export function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris';
  } catch {
    return 'Europe/Paris';
  }
}

// ---------- Amis ----------

export interface UserSearchResult {
  user_id: string;
  username: string;
  is_followed: boolean;
}

export function searchUsers(query: string): Promise<UserSearchResult[]> {
  return rpc<UserSearchResult[]>('search_users', { p_query: query });
}

export function followUser(userId: string): Promise<void> {
  return rpc<void>('follow_user', { p_user: userId });
}

export function unfollowUser(userId: string): Promise<void> {
  return rpc<void>('unfollow_user', { p_user: userId });
}

/** Identifiants des joueurs que je suis */
export async function fetchFollowingIds(): Promise<string[]> {
  const { data, error } = await supabase.from('follows').select('followee_id');
  if (error) throw toApiError(error);
  return (data ?? []).map((row: { followee_id: string }) => row.followee_id);
}

/** Classement limité à certains joueurs (moi + mes amis) */
export async function fetchLeaderboardFor(userIds: string[]): Promise<LeaderboardEntry[]> {
  if (userIds.length === 0) return [];
  const { data, error } = await supabase
    .from('leaderboard')
    .select('user_id, username, total_score, fragments_count, streak, is_tester')
    .in('user_id', userIds)
    .order('total_score', { ascending: false })
    .order('fragments_count', { ascending: false });
  if (error) throw toApiError(error);
  return data ?? [];
}

export async function getMyUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

// ---------- Retours des testeurs ----------

export function submitFeedback(day: number, liked: string, toChange: string, rating: number | null): Promise<void> {
  return rpc<void>('submit_feedback', { p_day: day, p_liked: liked, p_to_change: toChange, p_rating: rating });
}

// ---------- Administration ----------

export interface AdminUser {
  user_id: string;
  username: string;
  role: Role;
  tester_days: number[];
  fragments_count: number;
  total_score: number;
  has_password: boolean;
  created_at: string;
}

export interface FeedbackEntry {
  id: number;
  user_id: string | null;
  username: string;
  day: number;
  liked: string;
  to_change: string;
  rating: number | null;
  created_at: string;
}

export function adminListUsers(): Promise<AdminUser[]> {
  return rpc<AdminUser[]>('admin_list_users');
}

export function adminSetRole(userId: string, role: Role): Promise<void> {
  return rpc<void>('admin_set_role', { p_user: userId, p_role: role });
}

export function adminSetTesterDays(userId: string, days: number[]): Promise<void> {
  return rpc<void>('admin_set_tester_days', { p_user: userId, p_days: days });
}

export function adminDeleteUser(userId: string): Promise<void> {
  return rpc<void>('admin_delete_user', { p_user: userId });
}

/** Efface la progression d'un joueur (ex. scores de test avant le lancement) */
export function adminResetProgress(userId: string): Promise<void> {
  return rpc<void>('admin_reset_progress', { p_user: userId });
}

export function adminDeleteFeedback(id: number): Promise<void> {
  return rpc<void>('admin_delete_feedback', { p_id: id });
}

export function adminListFeedback(): Promise<FeedbackEntry[]> {
  return rpc<FeedbackEntry[]>('admin_list_feedback');
}

// ---------- Suppression de son compte ----------

/** Supprime définitivement le compte et toutes ses données, puis ferme la session */
export async function deleteMyAccount(): Promise<void> {
  await rpc<void>('delete_my_account');
  await supabase.auth.signOut();
}
