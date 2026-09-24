/// <reference types="jest" />
import { applyStageResult, continueMarathon, initialMarathonState, isFinished, totalScore } from './logic';

describe('Marathon - enchaînement des épreuves', () => {
  test('commence à la première épreuve, en cours de jeu', () => {
    const state = initialMarathonState();
    expect(state.stageIndex).toBe(0);
    expect(state.status).toBe('playing');
    expect(totalScore(state)).toBe(0);
  });

  test("réussir une épreuve qui n'est pas la dernière mène à l'entracte", () => {
    const state = applyStageResult(initialMarathonState(), { success: true, score: 500 }, 2);
    expect(state.status).toBe('interlude');
    expect(state.stageIndex).toBe(0);
    expect(totalScore(state)).toBe(500);
  });

  test("continuer après l'entracte passe à l'épreuve suivante", () => {
    let state = applyStageResult(initialMarathonState(), { success: true, score: 500 }, 2);
    state = continueMarathon(state);
    expect(state.status).toBe('playing');
    expect(state.stageIndex).toBe(1);
  });

  test('réussir toutes les épreuves gagne le marathon avec le score cumulé', () => {
    let state = applyStageResult(initialMarathonState(), { success: true, score: 500 }, 2);
    state = continueMarathon(state);
    state = applyStageResult(state, { success: true, score: 300 }, 2);
    expect(state.status).toBe('won');
    expect(totalScore(state)).toBe(800);
    expect(isFinished(state)).toBe(true);
  });

  test('un échec à la première épreuve arrête tout le marathon', () => {
    const state = applyStageResult(initialMarathonState(), { success: false, score: 120 }, 2);
    expect(state.status).toBe('lost');
    expect(totalScore(state)).toBe(120);
    expect(isFinished(state)).toBe(true);
  });

  test('un échec à la dernière épreuve perd le marathon mais garde les points gagnés', () => {
    let state = applyStageResult(initialMarathonState(), { success: true, score: 500 }, 2);
    state = continueMarathon(state);
    state = applyStageResult(state, { success: false, score: 40 }, 2);
    expect(state.status).toBe('lost');
    expect(totalScore(state)).toBe(540);
  });

  test("un résultat reçu pendant l'entracte est ignoré (pas de double comptage)", () => {
    const interlude = applyStageResult(initialMarathonState(), { success: true, score: 500 }, 2);
    const after = applyStageResult(interlude, { success: true, score: 999 }, 2);
    expect(after).toBe(interlude);
  });

  test("continuer n'a aucun effet si on n'est pas à l'entracte", () => {
    const playing = initialMarathonState();
    expect(continueMarathon(playing)).toBe(playing);
    const lost = applyStageResult(playing, { success: false, score: 0 }, 2);
    expect(continueMarathon(lost)).toBe(lost);
  });

  test('marathon à 3 épreuves (boss) : il faut les 3', () => {
    let state = initialMarathonState();
    for (let i = 0; i < 2; i++) {
      state = applyStageResult(state, { success: true, score: 100 }, 3);
      expect(state.status).toBe('interlude');
      state = continueMarathon(state);
    }
    state = applyStageResult(state, { success: true, score: 100 }, 3);
    expect(state.status).toBe('won');
    expect(totalScore(state)).toBe(300);
  });
});
