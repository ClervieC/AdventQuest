// Jeu de rythme : des notes descendent dans 4 couloirs, on tape le couloir quand la note atteint la ligne.
// Tous les temps sont en millisecondes depuis le début du morceau.

export type Lane = 0 | 1 | 2 | 3;
export const LANE_COUNT = 4;

export interface ChartNote {
  time: number;
  lane: Lane;
}

export interface Chart {
  name: string;
  bpm: number;
  approachMs: number; // temps de descente d'une note, du haut jusqu'à la ligne
  notes: ChartNote[];
}

export type Judgement = 'perfect' | 'good' | 'miss';

export interface NoteState {
  note: ChartNote;
  result: Judgement | null; // null = pas encore jouée
}

export const PERFECT_WINDOW_MS = 70;
export const GOOD_WINDOW_MS = 140;
export const PASS_ACCURACY = 0.7; // 70 % des notes touchées pour gagner

const BASE_POINTS: Record<Judgement, number> = { perfect: 100, good: 50, miss: 0 };

export function createNoteStates(chart: Chart): NoteState[] {
  return chart.notes.map((note) => ({ note, result: null }));
}

/** Jugement d'un tap selon l'écart avec la note ; null si trop loin pour compter */
export function judge(deltaMs: number, windowScale = 1): Judgement | null {
  const distance = Math.abs(deltaMs);
  if (distance <= PERFECT_WINDOW_MS * windowScale) return 'perfect';
  if (distance <= GOOD_WINDOW_MS * windowScale) return 'good';
  return null;
}

/** Index de la plus ancienne note non jouée du couloir qui est à portée du tap, sinon -1 */
export function findHittableNote(states: NoteState[], lane: Lane, now: number, windowScale = 1): number {
  const window = GOOD_WINDOW_MS * windowScale;
  return states.findIndex((s) => s.result === null && s.note.lane === lane && Math.abs(s.note.time - now) <= window);
}

/**
 * Applique un tap. Renvoie les nouveaux états et le jugement ;
 * 'empty' si aucune note n'était à portée (casse le combo : empêche de taper au hasard en continu).
 */
export function applyTap(
  states: NoteState[],
  lane: Lane,
  now: number,
  windowScale = 1
): { states: NoteState[]; judgement: Judgement | 'empty' } {
  const index = findHittableNote(states, lane, now, windowScale);
  if (index === -1) return { states, judgement: 'empty' };

  const judgement = judge(now - states[index].note.time, windowScale) as Judgement;
  const next = states.slice();
  next[index] = { ...next[index], result: judgement };
  return { states: next, judgement };
}

/** Marque "ratées" les notes dépassées sans avoir été jouées. Renvoie les états et le nombre de nouvelles notes ratées */
export function expireMissedNotes(states: NoteState[], now: number, windowScale = 1): { states: NoteState[]; missed: number } {
  const window = GOOD_WINDOW_MS * windowScale;
  let missed = 0;
  const next = states.map((s) => {
    if (s.result === null && now - s.note.time > window) {
      missed++;
      return { ...s, result: 'miss' as Judgement };
    }
    return s;
  });
  return { states: missed > 0 ? next : states, missed };
}

/** Multiplicateur de combo : ×1, puis +1 toutes les 10 notes enchaînées, plafonné à ×4 */
export function comboMultiplier(combo: number): number {
  return 1 + Math.min(3, Math.floor(combo / 10));
}

/** Points gagnés pour un jugement, avec le combo AVANT cette note */
export function pointsFor(judgement: Judgement, comboBefore: number): number {
  return BASE_POINTS[judgement] * comboMultiplier(comboBefore);
}

export interface RhythmSummary {
  perfect: number;
  good: number;
  miss: number;
  total: number;
  accuracy: number; // part des notes touchées (perfect + good), entre 0 et 1
}

export function summarize(states: NoteState[]): RhythmSummary {
  const perfect = states.filter((s) => s.result === 'perfect').length;
  const good = states.filter((s) => s.result === 'good').length;
  const miss = states.filter((s) => s.result === 'miss').length;
  const total = states.length;
  return { perfect, good, miss, total, accuracy: total === 0 ? 0 : (perfect + good) / total };
}

export function isChartFinished(states: NoteState[]): boolean {
  return states.every((s) => s.result !== null);
}

export function hasPassed(states: NoteState[]): boolean {
  return summarize(states).accuracy >= PASS_ACCURACY;
}

/** Position verticale d'une note (0 = haut, 1 = sur la ligne), ou null si elle n'est pas encore/plus visible */
export function noteProgress(noteTime: number, now: number, approachMs: number): number | null {
  const progress = 1 - (noteTime - now) / approachMs;
  if (progress < 0 || progress > 1.15) return null;
  return progress;
}
