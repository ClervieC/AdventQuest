// Accès au serveur Supabase. Toutes les écritures passent par des fonctions RPC côté serveur
// (voir supabase/migrations) : l'app ne peut pas tricher en écrivant directement dans les tables.
import { supabase } from './supabase';

export interface ServerProgress {
  day: number;
  fragment_won: boolean;
  best_score: number;
  attempts: number;
}

export interface PlayerProfile {
  id: string;
  username: string;
  timezone: string;
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
  | 'network';

const KNOWN_CODES: ApiErrorCode[] = [
  'not_authenticated', 'no_profile', 'profile_exists', 'invalid_username', 'username_taken',
  'day_not_playable', 'boss_locked', 'no_hint_boss', 'no_hint_left',
];

export class ApiError extends Error {
  constructor(public code: ApiErrorCode, message: string) {
    super(message);
  }
}

function toApiError(error: { message?: string } | null | undefined): ApiError {
  const message = error?.message ?? 'Erreur inconnue';
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
    .select('user_id, username, total_score, fragments_count, streak')
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
