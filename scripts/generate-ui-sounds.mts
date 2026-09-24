// Génère les sons d'interface (assets/sounds) : ouverture de case, victoire, échec, fragment obtenu.
// Usage : npm run generate:audio
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bell, createBuffer, NOTES, SAMPLE_RATE, soft, sparkle, toWav } from './lib/synth.mts';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sounds');

/** Ouverture d'une case du calendrier : petit scintillement montant, très court */
function openSound() {
  const buffer = createBuffer(0.55);
  [NOTES.C6, NOTES.E6, NOTES.G6].forEach((freq, i) => sparkle(buffer, i * 55, freq, 0.22));
  return buffer;
}

/** Victoire (entraînement réussi) : arpège majeur montant do-mi-sol-do */
function victorySound() {
  const buffer = createBuffer(1.5);
  [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6].forEach((freq, i) => bell(buffer, i * 110, freq, 0.3));
  return buffer;
}

/** Échec : deux notes qui descendent, douces, pour ne pas punir trop fort */
function failureSound() {
  const buffer = createBuffer(1.1);
  soft(buffer, 0, NOTES.Eb5, 0.3, 0.5);
  soft(buffer, 220, NOTES.C5, 0.3, 0.5);
  soft(buffer, 440, NOTES.Ab4, 0.28, 0.7);
  return buffer;
}

/** Fragment obtenu : accord de clochettes + pluie d'étincelles aiguës */
function fragmentSound() {
  const buffer = createBuffer(2.0);
  [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6].forEach((freq, i) => bell(buffer, i * 70, freq, 0.28));
  bell(buffer, 420, NOTES.E6, 0.22);
  [NOTES.G6, NOTES.C7, NOTES.E6, NOTES.G6, NOTES.C7].forEach((freq, i) => sparkle(buffer, 480 + i * 90, freq, 0.12));
  return buffer;
}

mkdirSync(OUT_DIR, { recursive: true });
const outputs: [string, Float32Array][] = [
  ['open.wav', openSound()],
  ['victory.wav', victorySound()],
  ['failure.wav', failureSound()],
  ['fragment.wav', fragmentSound()],
];
for (const [file, samples] of outputs) {
  // Sons d'interface un peu moins forts que la musique du jeu de rythme
  const wav = toWav(samples, 0.7);
  writeFileSync(join(OUT_DIR, file), wav);
  console.log(`sounds/${file} : ${(samples.length / SAMPLE_RATE).toFixed(2)} s, ${(wav.length / 1024).toFixed(0)} Ko`);
}
