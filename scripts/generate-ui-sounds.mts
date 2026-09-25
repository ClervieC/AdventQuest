// Génère les sons d'interface (assets/sounds) : ouverture de case, victoire, échec, fragment obtenu.
// Usage : npm run generate:audio
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { addTone, bell, createBuffer, NOTES, SAMPLE_RATE, soft, sparkle, toWav } from './lib/synth.mts';

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

// ---------- Bruitages des mini-jeux React Native ----------

const blip = (buffer: Float32Array, ms: number, freq: number, amp: number, decay: number, length: number) =>
  addTone(buffer, ms, freq, { amp, decay, length, partials: [[1, 1], [2, 0.2]] });

/** Bonne réponse : deux clochettes qui montent */
function correctSound() {
  const buffer = createBuffer(0.6);
  bell(buffer, 0, NOTES.E6, 0.25);
  bell(buffer, 90, NOTES.G6, 0.25);
  return buffer;
}

/** Mauvaise réponse : deux notes graves un peu dissonantes, courtes */
function wrongSound() {
  const buffer = createBuffer(0.4);
  soft(buffer, 0, 196, 0.3, 0.3);
  soft(buffer, 0, 185, 0.25, 0.3);
  return buffer;
}

const tapSound = () => { const b = createBuffer(0.08); blip(b, 0, 1320, 0.25, 45, 0.08); return b; };
const placeSound = () => { const b = createBuffer(0.16); blip(b, 0, 660, 0.3, 22, 0.16); return b; };
const rotateSound = () => { const b = createBuffer(0.07); blip(b, 0, 900, 0.25, 55, 0.07); return b; };
const bumpSound = () => { const b = createBuffer(0.15); blip(b, 0, 110, 0.45, 25, 0.15); return b; };
const drawSound = () => { const b = createBuffer(0.1); blip(b, 0, 760, 0.22, 35, 0.1); return b; };

/** Manger (Snake) : petit "pop" qui monte */
function eatSound() {
  const b = createBuffer(0.16);
  blip(b, 0, 523.25, 0.25, 30, 0.08);
  blip(b, 50, 783.99, 0.25, 25, 0.1);
  return b;
}

/** Carte posée (Solitaire) : claquement sec */
function cardSound() {
  const b = createBuffer(0.1);
  blip(b, 0, 1800, 0.15, 70, 0.05);
  blip(b, 10, 420, 0.25, 40, 0.08);
  return b;
}

/** Les 4 couleurs du Memory : notes du Simon (mi, la, do#, mi) */
const noteSound = (freq: number) => () => { const b = createBuffer(0.4); soft(b, 0, freq, 0.35, 0.4); return b; };

mkdirSync(OUT_DIR, { recursive: true });
const outputs: [string, Float32Array][] = [
  ['open.wav', openSound()],
  ['victory.wav', victorySound()],
  ['failure.wav', failureSound()],
  ['fragment.wav', fragmentSound()],
  ['correct.wav', correctSound()],
  ['wrong.wav', wrongSound()],
  ['tap.wav', tapSound()],
  ['place.wav', placeSound()],
  ['rotate.wav', rotateSound()],
  ['bump.wav', bumpSound()],
  ['draw.wav', drawSound()],
  ['eat.wav', eatSound()],
  ['card.wav', cardSound()],
  ['note0.wav', noteSound(329.63)()],
  ['note1.wav', noteSound(440)()],
  ['note2.wav', noteSound(554.37)()],
  ['note3.wav', noteSound(659.25)()],
];
for (const [file, samples] of outputs) {
  // Sons d'interface un peu moins forts que la musique du jeu de rythme
  const wav = toWav(samples, 0.7);
  writeFileSync(join(OUT_DIR, file), wav);
  console.log(`sounds/${file} : ${(samples.length / SAMPLE_RATE).toFixed(2)} s, ${(wav.length / 1024).toFixed(0)} Ko`);
}
