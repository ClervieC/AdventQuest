import { create } from 'zustand';
import {
  ApiError,
  consumeHint,
  createProfile,
  ensureSession,
  fetchPlayerState,
  getDeviceTimezone,
  PlayerState,
  submitAttempt,
} from '../services/api';
import { loadPendingAttempts, PendingAttempt, savePendingAttempts } from '../services/pendingAttempts';

export interface DayState {
  fragmentWon: boolean;
  bestScore: number;
  attempts: number;
}

// loading : connexion au serveur · needs_profile : choisir un pseudo · ready : on joue · error : serveur injoignable
export type SyncStatus = 'loading' | 'needs_profile' | 'ready' | 'error';

interface GameStore {
  status: SyncStatus;
  errorMessage: string | null;
  username: string | null;
  timezone: string | null;
  currentDay: number; // 0 = saison pas commencée, 1..24, 25 = saison terminée (vient du serveur)
  hints: number;
  days: Record<number, DayState>;

  // Lecture
  canPlay: (day: number) => boolean;
  isLocked: (day: number) => boolean;
  totalFragments: () => number;
  bossUnlocked: () => boolean;

  // Serveur
  init: () => Promise<void>;
  refresh: () => Promise<void>;
  register: (username: string) => Promise<void>;

  // Actions de jeu
  finishAttempt: (day: number, score: number, success: boolean) => void;
  useHint: () => void;
  setCurrentDay: (day: number) => void;
}

export const FRAGMENT_THRESHOLD = 12;
export const BOSS_DAY = 24;

function toDays(progress: PlayerState['progress']): Record<number, DayState> {
  const days: Record<number, DayState> = {};
  for (const p of progress) {
    days[p.day] = { fragmentWon: p.fragment_won, bestScore: p.best_score, attempts: p.attempts };
  }
  return days;
}

// Renvoie au serveur les parties jouées hors ligne. Garde seulement celles qui ont échoué pour cause de réseau.
async function flushPendingAttempts(): Promise<void> {
  const pending = await loadPendingAttempts();
  if (pending.length === 0) return;
  const stillPending: PendingAttempt[] = [];
  for (const attempt of pending) {
    try {
      await submitAttempt(attempt.day, attempt.score, attempt.success);
    } catch (error) {
      // Refus du serveur (jour passé, boss verrouillé...) : la partie est abandonnée, c'est la règle
      if (error instanceof ApiError && error.code === 'network') stillPending.push(attempt);
    }
  }
  await savePendingAttempts(stillPending);
}

export const useGameStore = create<GameStore>((set, get) => {
  const applyServerState = (state: PlayerState) =>
    set({
      status: state.profile ? 'ready' : 'needs_profile',
      errorMessage: null,
      username: state.profile?.username ?? null,
      timezone: state.profile?.timezone ?? null,
      currentDay: state.current_day,
      hints: state.hints,
      days: toDays(state.progress),
    });

  const sendAttempt = (attempt: PendingAttempt) => {
    submitAttempt(attempt.day, attempt.score, attempt.success)
      .then((result) => {
        // Le serveur fait foi : on remplace le calcul local par le sien
        set((state) => ({
          currentDay: result.current_day,
          hints: result.hints,
          days: {
            ...state.days,
            [result.progress.day]: {
              fragmentWon: result.progress.fragment_won,
              bestScore: result.progress.best_score,
              attempts: result.progress.attempts,
            },
          },
        }));
      })
      .catch(async (error) => {
        if (error instanceof ApiError && error.code === 'network') {
          // Hors ligne : on garde la partie pour la renvoyer plus tard
          const pending = await loadPendingAttempts();
          await savePendingAttempts([...pending, attempt]);
        } else {
          // Refus du serveur (ex. minuit est passé) : on se recale sur son état
          get().refresh();
        }
      });
  };

  return {
    status: 'loading',
    errorMessage: null,
    username: null,
    timezone: null,
    currentDay: 0,
    hints: 0,
    days: {},

    canPlay: (day) => day === get().currentDay,

    isLocked: (day) => day > get().currentDay,

    totalFragments: () => {
      return Object.values(get().days).filter((d) => d.fragmentWon).length;
    },

    bossUnlocked: () => get().totalFragments() >= FRAGMENT_THRESHOLD,

    init: async () => {
      set({ status: 'loading', errorMessage: null });
      try {
        await ensureSession();
        await flushPendingAttempts();
        applyServerState(await fetchPlayerState());
      } catch (error) {
        set({
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Serveur injoignable',
        });
      }
    },

    // Recharge l'état sans écran de chargement (retour au premier plan, changement de jour à minuit...)
    refresh: async () => {
      if (get().status !== 'ready') return;
      try {
        await flushPendingAttempts();
        applyServerState(await fetchPlayerState());
      } catch {
        // Pas de réseau : on garde l'état actuel, on réessaiera plus tard
      }
    },

    // Création du profil ; les erreurs (pseudo pris...) remontent à l'écran d'inscription
    register: async (username) => {
      applyServerState(await createProfile(username, getDeviceTimezone()));
    },

    finishAttempt: (day, score, success) => {
      if (day !== get().currentDay) return; // sécurité : pas de triche (le serveur vérifie aussi)
      set((state) => {
        const existing = state.days[day] || { fragmentWon: false, bestScore: 0, attempts: 0 };
        return {
          days: {
            ...state.days,
            [day]: {
              fragmentWon: success || existing.fragmentWon,
              bestScore: Math.max(existing.bestScore, score),
              attempts: existing.attempts + 1,
            },
          },
        };
      });
      sendAttempt({ day, score, success });
    },

    useHint: () => {
      set((state) => ({ hints: Math.max(0, state.hints - 1) }));
      consumeHint()
        .then((left) => set({ hints: left }))
        .catch(() => {
          // Hors ligne ou refus : le serveur recalera le compte au prochain chargement
        });
    },

    setCurrentDay: (day) => set({ currentDay: day }),
  };
});
