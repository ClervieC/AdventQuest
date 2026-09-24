import { GameResult } from '../GameWrapper/types';

// Un marathon enchaîne plusieurs jeux : il faut TOUS les réussir, un échec arrête tout.
export type MarathonStatus = 'playing' | 'interlude' | 'won' | 'lost';

export interface MarathonState {
  stageIndex: number;
  stageScores: number[];
  status: MarathonStatus;
}

export function initialMarathonState(): MarathonState {
  return { stageIndex: 0, stageScores: [], status: 'playing' };
}

export function applyStageResult(state: MarathonState, result: GameResult, stageCount: number): MarathonState {
  if (state.status !== 'playing') return state; // résultat en double ou tardif : ignoré

  const stageScores = [...state.stageScores, result.score];
  if (!result.success) return { ...state, stageScores, status: 'lost' };

  const isLastStage = state.stageIndex >= stageCount - 1;
  return { ...state, stageScores, status: isLastStage ? 'won' : 'interlude' };
}

export function continueMarathon(state: MarathonState): MarathonState {
  if (state.status !== 'interlude') return state;
  return { ...state, stageIndex: state.stageIndex + 1, status: 'playing' };
}

export function totalScore(state: MarathonState): number {
  return state.stageScores.reduce((sum, score) => sum + score, 0);
}

export function isFinished(state: MarathonState): boolean {
  return state.status === 'won' || state.status === 'lost';
}
