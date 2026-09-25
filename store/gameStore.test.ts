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
    hasProtectedAccount: jest.fn(() => Promise.resolve(false)),
    protectAccount: jest.fn(() => Promise.resolve()),
    loginWithUsername: jest.fn(() => Promise.resolve()),
    logout: jest.fn(() => Promise.resolve()),
    deleteMyAccount: jest.fn(() => Promise.resolve()),
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

  test('l’inscription crée le profil (pseudo + fuseau) puis enregistre le mot de passe', async () => {
    mockedApi.createProfile.mockResolvedValueOnce(serverState());
    await useGameStore.getState().register('Clervie', 'secret123');
    expect(mockedApi.createProfile).toHaveBeenCalledWith('Clervie', 'Europe/Paris');
    expect(mockedApi.protectAccount).toHaveBeenCalledWith('Clervie', 'secret123');
    const state = useGameStore.getState();
    expect(state.status).toBe('ready');
    expect(state.hasAccount).toBe(true);
    expect(state.passwordSetupFailed).toBe(false);
  });

  test('pseudo déjà pris : l’erreur remonte à l’écran, aucun mot de passe enregistré', async () => {
    useGameStore.setState({ status: 'needs_profile' });
    mockedApi.createProfile.mockRejectedValueOnce(new mockedApi.ApiError('username_taken', 'username_taken'));
    await expect(useGameStore.getState().register('Clervie', 'secret123')).rejects.toThrow();
    expect(mockedApi.protectAccount).not.toHaveBeenCalled();
    expect(useGameStore.getState().status).toBe('needs_profile');
  });

  test('mot de passe non enregistré (serveur mal réglé) : on joue quand même, le Profil le redemandera', async () => {
    mockedApi.createProfile.mockResolvedValueOnce(serverState());
    mockedApi.protectAccount.mockRejectedValueOnce(new mockedApi.ApiError('email_confirmation_enabled', 'confirm'));
    await useGameStore.getState().register('Clervie', 'secret123');
    const state = useGameStore.getState();
    expect(state.status).toBe('ready');
    expect(state.hasAccount).toBe(false);
    expect(state.passwordSetupFailed).toBe(true);
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

describe('gameStore - compte multi-appareils', () => {
  const serverState = (overrides: Partial<api.PlayerState> = {}): api.PlayerState => ({
    profile: { id: 'u1', username: 'Clervie', timezone: 'Europe/Paris' },
    current_day: 3,
    hints: 2,
    progress: [],
    ...overrides,
  });

  test('au lancement, on sait si le compte est protégé par un mot de passe', async () => {
    mockedApi.fetchPlayerState.mockResolvedValueOnce(serverState());
    mockedApi.hasProtectedAccount.mockResolvedValueOnce(true);
    await useGameStore.getState().init();
    expect(useGameStore.getState().hasAccount).toBe(true);
  });

  test('protéger son compte ajoute un mot de passe au joueur actuel (même pseudo)', async () => {
    useGameStore.setState({ username: 'Clervie', hasAccount: false });
    await useGameStore.getState().protectAccount('secret123');
    expect(mockedApi.protectAccount).toHaveBeenCalledWith('Clervie', 'secret123');
    expect(useGameStore.getState().hasAccount).toBe(true);
  });

  test('une erreur de protection remonte à l’écran et le compte reste non protégé', async () => {
    useGameStore.setState({ username: 'Clervie', hasAccount: false });
    mockedApi.protectAccount.mockRejectedValueOnce(new mockedApi.ApiError('weak_password', 'weak'));
    await expect(useGameStore.getState().protectAccount('123')).rejects.toThrow();
    expect(useGameStore.getState().hasAccount).toBe(false);
  });

  test('se connecter sur un autre appareil recharge la progression du compte', async () => {
    mockedApi.fetchPlayerState.mockResolvedValueOnce(
      serverState({ progress: [{ day: 1, fragment_won: true, best_score: 800, attempts: 1 }] })
    );
    mockedApi.hasProtectedAccount.mockResolvedValueOnce(true);
    await useGameStore.getState().login('Clervie', 'secret123');
    expect(mockedApi.loginWithUsername).toHaveBeenCalledWith('Clervie', 'secret123');
    expect(useGameStore.getState().days[1].bestScore).toBe(800);
    expect(useGameStore.getState().hasAccount).toBe(true);
  });

  test('mauvais mot de passe : l’erreur remonte, rien n’est chargé', async () => {
    mockedApi.loginWithUsername.mockRejectedValueOnce(new mockedApi.ApiError('invalid_credentials', 'bad'));
    await expect(useGameStore.getState().login('Clervie', 'faux')).rejects.toThrow();
    expect(mockedApi.fetchPlayerState).not.toHaveBeenCalled();
  });

  test('se déconnecter vide la progression locale et repart sur un nouveau joueur', async () => {
    useGameStore.setState({ username: 'Clervie', hasAccount: true });
    mockedApi.fetchPlayerState.mockResolvedValueOnce(serverState({ profile: null }));
    await useGameStore.getState().logout();
    expect(mockedApi.logout).toHaveBeenCalled();
    const state = useGameStore.getState();
    expect(state.days).toEqual({});
    expect(state.username).toBeNull();
    expect(state.status).toBe('needs_profile');
  });
});

describe('gameStore - rôles et suppression de compte', () => {
  const serverState = (overrides: Partial<api.PlayerState> = {}): api.PlayerState => ({
    profile: { id: 'u1', username: 'Clervie', timezone: 'Europe/Paris', role: 'player', tester_days: [] },
    current_day: 3,
    hints: 2,
    progress: [],
    ...overrides,
  });

  test('le rôle et les jours de test viennent du serveur', async () => {
    mockedApi.fetchPlayerState.mockResolvedValueOnce(
      serverState({ profile: { id: 'u1', username: 'Bob', timezone: 'Europe/Paris', role: 'tester', tester_days: [7, 12] } })
    );
    await useGameStore.getState().init();
    expect(useGameStore.getState().role).toBe('tester');
    expect(useGameStore.getState().testerDays).toEqual([7, 12]);
  });

  test('un joueur ne peut rien tester en avance', () => {
    useGameStore.setState({ role: 'player', testerDays: [7] });
    expect(useGameStore.getState().canTest(7)).toBe(false);
  });

  test('un testeur peut ouvrir uniquement les jours que l’admin lui a donnés', () => {
    useGameStore.setState({ role: 'tester', testerDays: [7, 12] });
    expect(useGameStore.getState().canTest(7)).toBe(true);
    expect(useGameStore.getState().canTest(8)).toBe(false);
  });

  test('un testeur enregistre ses parties sur ses jours de test (pour le classement)', () => {
    useGameStore.setState({ role: 'tester', testerDays: [12], currentDay: 9 });
    useGameStore.getState().finishAttempt(12, 800, true);
    expect(mockedApi.submitAttempt).toHaveBeenCalledWith(12, 800, true);
    expect(useGameStore.getState().days[12]).toEqual({ fragmentWon: true, bestScore: 800, attempts: 1 });
  });

  test('… mais pas sur un jour qui ne lui a pas été ouvert', () => {
    useGameStore.setState({ role: 'tester', testerDays: [12], currentDay: 9 });
    useGameStore.getState().finishAttempt(13, 800, true);
    expect(mockedApi.submitAttempt).not.toHaveBeenCalled();
  });

  test('un admin peut tester tous les jours', () => {
    useGameStore.setState({ role: 'admin', testerDays: [] });
    expect(useGameStore.getState().canTest(24)).toBe(true);
  });

  test('supprimer son compte efface tout localement et revient à l’inscription', async () => {
    useGameStore.setState({ username: 'Clervie', role: 'admin', hasAccount: true, days: { 1: { fragmentWon: true, bestScore: 10, attempts: 1 } } });
    mockedApi.fetchPlayerState.mockResolvedValueOnce(serverState({ profile: null }));
    await useGameStore.getState().deleteAccount();
    expect(mockedApi.deleteMyAccount).toHaveBeenCalled();
    const state = useGameStore.getState();
    expect(state.days).toEqual({});
    expect(state.role).toBe('player');
    expect(state.status).toBe('needs_profile');
  });
});
