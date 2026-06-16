/// <reference types="jest" />
import { useGameStore } from './gameStore';

// Réinitialise le store avant chaque test pour éviter les interférences
beforeEach(() => {
  useGameStore.setState({
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