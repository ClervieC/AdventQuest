// Génère les musiques du jeu de rythme (jour 21) à partir des partitions du jeu.
// Chaque note de la partition devient un coup de clochette au temps exact : audio et notes sont donc
// synchronisés par construction. Un accompagnement (décompte + basse) aide à sentir le tempo.
//
// Usage : npm run generate:audio   (à relancer après toute modification de games/day21_rythme/charts.ts)
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHART_CARILLON, CHART_VALSE, LEAD_IN_MS } from '../games/day21_rythme/charts.ts';
import type { Chart } from '../games/day21_rythme/logic.ts';
import { bass, bell, NOTES, SAMPLE_RATE, tick, toWav } from './lib/synth.mts';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'games', 'day21_rythme', 'audio');

// Une note par couloir (do, mi, ré, sol) : sur le Carillon, la mélodie de "Vive le vent" tombe juste
const LANE_FREQUENCIES = [NOTES.C5, NOTES.E5, NOTES.D5, NOTES.G5];

function renderChart(chart: Chart, beatsPerBar: number, bassLine: number[]): Float32Array {
  const msPerBeat = 60000 / chart.bpm;
  const lastNote = chart.notes[chart.notes.length - 1].time;
  const buffer = new Float32Array(Math.ceil(((lastNote + 2500) / 1000) * SAMPLE_RATE));

  // Décompte pendant l'intro (une mesure avant la première note), puis basse sur les temps
  const firstBeat = -Math.floor(LEAD_IN_MS / msPerBeat);
  const lastBeat = Math.ceil((lastNote - LEAD_IN_MS) / msPerBeat) + 1;
  for (let beat = firstBeat; beat <= lastBeat; beat++) {
    const ms = LEAD_IN_MS + beat * msPerBeat;
    const positionInBar = ((beat % beatsPerBar) + beatsPerBar) % beatsPerBar;
    if (beat < 0) {
      if (beat >= -beatsPerBar) tick(buffer, ms, positionInBar === 0);
      continue;
    }
    const bar = Math.floor(beat / beatsPerBar);
    const root = bassLine[bar % bassLine.length];
    if (positionInBar === 0) bass(buffer, ms, root);
    else bass(buffer, ms, root * 2, 0.12); // temps faibles plus discrets
  }

  for (const note of chart.notes) bell(buffer, note.time, LANE_FREQUENCIES[note.lane]);
  return buffer;
}

mkdirSync(OUT_DIR, { recursive: true });
const outputs: [string, Float32Array][] = [
  ['carillon.wav', renderChart(CHART_CARILLON, 4, [NOTES.C3, NOTES.C3, NOTES.G2, NOTES.C3])],
  ['valse.wav', renderChart(CHART_VALSE, 3, [NOTES.C3, NOTES.G2, NOTES.F2, NOTES.G2])],
];
for (const [file, samples] of outputs) {
  const wav = toWav(samples);
  writeFileSync(join(OUT_DIR, file), wav);
  console.log(`rythme/${file} : ${(samples.length / SAMPLE_RATE).toFixed(1)} s, ${(wav.length / 1024).toFixed(0)} Ko`);
}
