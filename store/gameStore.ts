import { create } from 'zustand';

export interface DayState {
  fragmentWon: boolean;
  bestScore: number;
  attempts: number;
}

interface GameStore {
  currentDay: number;
  hints: number;
  days: Record<number, DayState>;

  // Lecture
  canPlay: (day: number) => boolean;
  isLocked: (day: number) => boolean;
  totalFragments: () => number;
  bossUnlocked: () => boolean;

  // Actions
  finishAttempt: (day: number, score: number, success: boolean) => void;
  useHint: () => void;
  setCurrentDay: (day: number) => void;
}

const FRAGMENT_THRESHOLD = 12;

// Données simulées pour le développement — à remplacer par Supabase en Phase 5
const initialDays: Record<number, DayState> = {
  1: { fragmentWon: true, bestScore: 1250, attempts: 1 },
  2: { fragmentWon: true, bestScore: 890, attempts: 2 },
  3: { fragmentWon: true, bestScore: 1440, attempts: 1 },
  4: { fragmentWon: true, bestScore: 1100, attempts: 1 },
  5: { fragmentWon: true, bestScore: 0, attempts: 0 },
  6: { fragmentWon: false, bestScore: 0, attempts: 0 },
  7: { fragmentWon: false, bestScore: 0, attempts: 0 },
  8: { fragmentWon: false, bestScore: 0, attempts: 0 },
  9: { fragmentWon: false, bestScore: 0, attempts: 0 },
  10: { fragmentWon: true, bestScore: 1300, attempts: 1 },
  11: { fragmentWon: false, bestScore: 0, attempts: 0 },
  14: { fragmentWon: false, bestScore: 0, attempts: 0 },
  15: { fragmentWon: false, bestScore: 0, attempts: 0 },
  16: { fragmentWon: false, bestScore: 0, attempts: 0 },
};

export const useGameStore = create<GameStore>((set, get) => ({
  currentDay: 15, // simulé pour le dev — viendra de la date serveur en Phase 5
  hints: 3,
  days: initialDays,

  canPlay: (day) => day === get().currentDay,

  isLocked: (day) => day > get().currentDay,

  totalFragments: () => {
    return Object.values(get().days).filter((d) => d.fragmentWon).length;
  },

  bossUnlocked: () => get().totalFragments() >= FRAGMENT_THRESHOLD,

  finishAttempt: (day, score, success) => set((state) => {
    if (day !== state.currentDay) return state; // sécurité : pas de triche
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
  }),

  useHint: () => set((state) => ({
    hints: Math.max(0, state.hints - 1),
  })),

  setCurrentDay: (day) => set({ currentDay: day }),
}));