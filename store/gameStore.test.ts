/// <reference types="jest" />
import * as api from '../services/api';
import * as pending from '../services/pendingAttempts';
import { useGameStore } from './gameStore';

// Pas de vrai serveur ni de stockage dans les tests : on les remplace par des faux contrôlables
jest.mock('../services/api', () => {
  class ApiError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  }
  return {
    ApiError,
    ensureSession: jest.fn(() => Promise.resolve()),
    fetchPlayerState: jest.fn(),
    createProfile: jest.fn(),
    submitAttempt: jest.fn(() => new Promise(() => {})), // par défaut : réponse qui n'arrive jamais
    consumeHint: jest.fn(() => new Promise(() => {})),
    getDeviceTimezone: jest.fn(() => 'Europe/Paris'),
  };
});
jest.mock('../services/pendingAttempts', () => ({
  loadPendingAttempts: jest.fn(() => Promise.resolve([])),
  savePendingAttempts: jest.fn(() => Promise.resolve()),
}));

const mockedApi = api as jest.Mocked<typeof api>;
const mockedPending = pending as jest.Mocked<typeof pending>;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

// Réinitialise le store avant chaque test pour éviter les interférences
beforeEach(() => {
  jest.clearAllMocks();
  useGameStore.setState({
    status: 'ready',
    currentDay: 5,
    hints: 3,
    days: {
      1: { fragmentWon: true, bestScore: 1250, attempts: 1 },
      2: { fragmentWon: true, bestScore: 890, attempts: 2 },
    },
  });
});

describe('gameStore - canPlay', () => {
  test('le jour actif peut être joué', () => {
    expect(useGameStore.getState().canPlay(5)).toBe(true);
  });

  test('un jour futur ne peut pas être joué', () => {
    expect(useGameStore.getState().canPlay(6)).toBe(false);
  });

  test('un jour passé ne peut plus être joué (règle clé)', () => {
    expect(useGameStore.getState().canPlay(1)).toBe(false);
  });
});

describe('gameStore - finishAttempt', () => {
  test('enregistre le score si on joue le jour actif', () => {
    useGameStore.getState().finishAttempt(5, 1000, true);
    const state = useGameStore.getState();
    expect(state.days[5].bestScore).toBe(1000);
    expect(state.days[5].fragmentWon).toBe(true);
  });

  test('ignore silencieusement une tentative sur un jour non-actif (anti-triche)', () => {
    useGameStore.getState().finishAttempt(1, 9999, true); // jour 1 déjà passé
    const state = useGameStore.getState();
    // le score ne doit PAS changer, la triche est bloquée
    expect(state.days[1].bestScore).toBe(1250);
  });

  test("rejouer un jour manqué ne rend pas le fragment et ne compte pas d'essai (mode entraînement)", () => {
    useGameStore.setState({
      days: { 3: { fragmentWon: false, bestScore: 0, attempts: 0 } },
    });
    useGameStore.getState().finishAttempt(3, 5000, true); // jour 3 passé, rejoué et réussi
    const state = useGameStore.getState();
    expect(state.days[3]).toEqual({ fragmentWon: false, bestScore: 0, attempts: 0 });
    expect(state.totalFragments()).toBe(0);
  });

  test('garde le meilleur score entre plusieurs tentatives le même jour', () => {
    useGameStore.getState().finishAttempt(5, 500, false);
    useGameStore.getState().finishAttempt(5, 1200, true);
    useGameStore.getState().finishAttempt(5, 800, true); // moins bon que 1200
    const state = useGameStore.getState();
    expect(state.days[5].bestScore).toBe(1200); // garde le meilleur, pas le dernier
  });

  test('incrémente le compteur de tentatives à chaque essai', () => {
    useGameStore.getState().finishAttempt(5, 100, false);
    useGameStore.getState().finishAttempt(5, 200, false);
    expect(useGameStore.getState().days[5].attempts).toBe(2);
  });
});

describe('gameStore - totalFragments et bossUnlocked', () => {
  test('compte correctement les fragments obtenus', () => {
    expect(useGameStore.getState().totalFragments()).toBe(2);
  });

  test('le boss reste verrouillé sous 12 fragments', () => {
    expect(useGameStore.getState().bossUnlocked()).toBe(false);
  });

  test('le boss se débloque à partir de 12 fragments', () => {
    const twelveFragments: Record<number, any> = {};
    for (let i = 1; i <= 12; i++) {
      twelveFragments[i] = { fragmentWon: true, bestScore: 100, attempts: 1 };
    }
    useGameStore.setState({ days: twelveFragments });
    expect(useGameStore.getState().bossUnlocked()).toBe(true);
  });
});

describe('gameStore - useHint', () => {
  test('décrémente le nombre de hints disponibles', () => {
    useGameStore.getState().useHint();
    expect(useGameStore.getState().hints).toBe(2);
  });

  test('ne descend jamais sous zéro', () => {
    useGameStore.setState({ hints: 0 });
    useGameStore.getState().useHint();
    expect(useGameStore.getState().hints).toBe(0);
  });
});
describe('gameStore - synchronisation avec le serveur', () => {
  const serverState = (overrides: Partial<api.PlayerState> = {}): api.PlayerState => ({
    profile: { id: 'u1', username: 'Clervie', timezone: 'Europe/Paris' },
    current_day: 3,
    hints: 2,
    progress: [{ day: 1, fragment_won: true, best_score: 900, attempts: 1 }],
    ...overrides,
  });

  test('au lancement, le jour courant et la progression viennent du serveur', async () => {
    mockedApi.fetchPlayerState.mockResolvedValueOnce(serverState());
    await useGameStore.getState().init();
    const state = useGameStore.getState();
    expect(mockedApi.ensureSession).toHaveBeenCalled();
    expect(state.status).toBe('ready');
    expect(state.currentDay).toBe(3);
    expect(state.hints).toBe(2);
    expect(state.username).toBe('Clervie');
    expect(state.days).toEqual({ 1: { fragmentWon: true, bestScore: 900, attempts: 1 } });
  });

  test('sans profil, on demande un pseudo', async () => {
    mockedApi.fetchPlayerState.mockResolvedValueOnce(serverState({ profile: null }));
    await useGameStore.getState().init();
    expect(useGameStore.getState().status).toBe('needs_profile');
  });

  test('serveur injoignable : écran d’erreur, pas de plantage', async () => {
    mockedApi.fetchPlayerState.mockRejectedValueOnce(new Error('Network request failed'));
    await useGameStore.getState().init();
    expect(useGameStore.getState().status).toBe('error');
    expect(useGameStore.getState().errorMessage).toContain('Network');
  });

  test('l’inscription envoie le pseudo et le fuseau du téléphone', async () => {
    mockedApi.createProfile.mockResolvedValueOnce(serverState());
    await useGameStore.getState().register('Clervie');
    expect(mockedApi.createProfile).toHaveBeenCalledWith('Clervie', 'Europe/Paris');
    expect(useGameStore.getState().status).toBe('ready');
  });

  test('une partie est envoyée au serveur et sa réponse fait foi', async () => {
    mockedApi.submitAttempt.mockResolvedValueOnce({
      progress: { day: 5, fragment_won: true, best_score: 700, attempts: 3 },
      hints: 4,
      current_day: 5,
    });
    useGameStore.getState().finishAttempt(5, 700, true);
    expect(mockedApi.submitAttempt).toHaveBeenCalledWith(5, 700, true);
    await flush();
    expect(useGameStore.getState().days[5]).toEqual({ fragmentWon: true, bestScore: 700, attempts: 3 });
    expect(useGameStore.getState().hints).toBe(4);
  });

  test('hors ligne : la partie est gardée pour être renvoyée plus tard', async () => {
    mockedApi.submitAttempt.mockRejectedValueOnce(new mockedApi.ApiError('network', 'Network request failed'));
    useGameStore.getState().finishAttempt(5, 700, true);
    await flush();
    await flush();
    expect(mockedPending.savePendingAttempts).toHaveBeenCalledWith([{ day: 5, score: 700, success: true }]);
    expect(useGameStore.getState().days[5].fragmentWon).toBe(true); // le joueur voit quand même son résultat
  });

  test('au lancement suivant, les parties en attente sont renvoyées avant de charger l’état', async () => {
    mockedPending.loadPendingAttempts.mockResolvedValueOnce([{ day: 2, score: 400, success: true }]);
    mockedApi.submitAttempt.mockResolvedValueOnce({
      progress: { day: 2, fragment_won: true, best_score: 400, attempts: 1 },
      hints: 2,
      current_day: 2,
    });
    mockedApi.fetchPlayerState.mockResolvedValueOnce(serverState());
    await useGameStore.getState().init();
    expect(mockedApi.submitAttempt).toHaveBeenCalledWith(2, 400, true);
    expect(mockedPending.savePendingAttempts).toHaveBeenLastCalledWith([]);
  });

  test('partie refusée par le serveur (minuit est passé) : on se recale sur son état', async () => {
    mockedApi.submitAttempt.mockRejectedValueOnce(new mockedApi.ApiError('day_not_playable', 'day_not_playable'));
    mockedApi.fetchPlayerState.mockResolvedValueOnce(serverState({ current_day: 6, progress: [] }));
    useGameStore.getState().finishAttempt(5, 700, true);
    await flush();
    await flush();
    expect(useGameStore.getState().currentDay).toBe(6);
    expect(useGameStore.getState().days[5]).toBeUndefined();
  });

  test('un hint utilisé est décompté par le serveur', async () => {
    mockedApi.consumeHint.mockResolvedValueOnce(1);
    useGameStore.getState().useHint();
    expect(useGameStore.getState().hints).toBe(2); // tout de suite côté app
    await flush();
    expect(useGameStore.getState().hints).toBe(1); // puis la valeur du serveur
  });
});
