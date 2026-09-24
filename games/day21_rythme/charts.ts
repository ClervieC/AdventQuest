import { Chart, ChartNote, Lane } from './logic';

// Une partition = une liste de [temps en battements, couloir].
// LEAD_IN laisse le temps à la première note de descendre avant d'atteindre la ligne.
const LEAD_IN_MS = 2500;

function buildChart(name: string, bpm: number, approachMs: number, beats: [number, Lane][]): Chart {
  const msPerBeat = 60000 / bpm;
  const notes: ChartNote[] = beats
    .map(([beat, lane]) => ({ time: Math.round(LEAD_IN_MS + beat * msPerBeat), lane }))
    .sort((a, b) => a.time - b.time || a.lane - b.lane);
  return { name, bpm, approachMs, notes };
}

// Répète un motif `times` fois, chaque répétition décalée de `lengthInBeats`
function repeat(pattern: [number, Lane][], times: number, lengthInBeats: number, startBeat = 0): [number, Lane][] {
  const out: [number, Lane][] = [];
  for (let i = 0; i < times; i++) {
    for (const [beat, lane] of pattern) out.push([startBeat + i * lengthInBeats + beat, lane]);
  }
  return out;
}

/** Carillon de Noël — 100 BPM, une note par temps puis quelques croches : accessible */
const CARILLON_BEATS: [number, Lane][] = [
  // Couplet façon "Vive le vent" : mi mi mi / mi mi mi / mi sol do ré mi
  ...repeat([[0, 1], [1, 1], [2, 1], [4, 1], [5, 1], [6, 1], [8, 1], [9, 3], [10, 0], [11, 2], [12, 1]], 2, 16),
  // Pont : montée et descente sur les 4 couloirs
  ...repeat([[0, 0], [1, 1], [2, 2], [3, 3], [4, 2], [5, 1], [6, 0]], 2, 8, 32),
  // Final : croches + accord de fin
  [48, 3], [48.5, 2], [49, 1], [49.5, 0], [50, 1], [51, 2], [52, 0], [52, 3],
];

/** Valse des flocons — 138 BPM en 3 temps, doubles notes et contretemps : exigeant */
const VALSE_BEATS: [number, Lane][] = [
  // Intro : temps fort à gauche, deux temps faibles à droite
  ...repeat([[0, 0], [1, 2], [2, 3]], 4, 3),
  // Thème : accords (2 couloirs à la fois) sur le temps fort
  ...repeat([[0, 0], [0, 2], [1, 1], [2, 3], [2.5, 1]], 4, 3, 12),
  // Tourbillon de croches
  ...repeat([[0, 0], [0.5, 1], [1, 2], [1.5, 3], [2, 2], [2.5, 1]], 4, 3, 24),
  // Reprise du thème en miroir
  ...repeat([[0, 3], [0, 0], [1, 2], [2, 1], [2.5, 2]], 4, 3, 36),
  // Final
  [48, 0], [48, 3], [49, 1], [49, 2], [50.5, 0], [50.5, 3],
];

export const CHART_CARILLON: Chart = buildChart('Carillon de Noël', 100, 1800, CARILLON_BEATS);
export const CHART_VALSE: Chart = buildChart('Valse des flocons', 138, 1300, VALSE_BEATS);

export function getChart(difficulty: 'easy' | 'medium' | 'hard' | 'very_hard' = 'easy'): Chart {
  return difficulty === 'hard' || difficulty === 'very_hard' ? CHART_VALSE : CHART_CARILLON;
}
