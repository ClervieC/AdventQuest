// Petite synthèse audio partagée par les générateurs de sons (npm run generate:audio)
export const SAMPLE_RATE = 22050;

export const NOTES = {
  C3: 130.81, G2: 98.0, F2: 87.31,
  A4: 440.0, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
  C6: 1046.5, E6: 1318.51, G6: 1567.98, C7: 2093.0,
  Eb5: 622.25, Ab4: 415.3,
};

export interface ToneOptions {
  amp: number;
  decay: number; // plus c'est grand, plus le son s'éteint vite
  length: number; // en secondes
  partials: [number, number][]; // [multiple de la fréquence, volume]
}

export function createBuffer(seconds: number): Float32Array {
  return new Float32Array(Math.ceil(seconds * SAMPLE_RATE));
}

export function addTone(buffer: Float32Array, startMs: number, freq: number, opts: ToneOptions) {
  const start = Math.round((startMs / 1000) * SAMPLE_RATE);
  const length = Math.round(opts.length * SAMPLE_RATE);
  const attack = Math.round(0.004 * SAMPLE_RATE);
  for (let i = 0; i < length && start + i < buffer.length; i++) {
    if (start + i < 0) continue;
    const t = i / SAMPLE_RATE;
    const envelope = Math.min(1, i / attack) * Math.exp(-t * opts.decay);
    let sample = 0;
    for (const [ratio, amp] of opts.partials) sample += amp * Math.sin(2 * Math.PI * freq * ratio * t);
    buffer[start + i] += opts.amp * envelope * sample;
  }
}

// Timbres
export const bell = (buffer: Float32Array, ms: number, freq: number, amp = 0.32) =>
  addTone(buffer, ms, freq, { amp, decay: 3.2, length: 1.4, partials: [[1, 1], [2, 0.45], [3.01, 0.22], [4.2, 0.1]] });
export const bass = (buffer: Float32Array, ms: number, freq: number, amp = 0.35) =>
  addTone(buffer, ms, freq, { amp, decay: 5, length: 0.6, partials: [[1, 1], [2, 0.3]] });
export const tick = (buffer: Float32Array, ms: number, accent: boolean) =>
  addTone(buffer, ms, accent ? 1760 : 1320, { amp: 0.18, decay: 40, length: 0.08, partials: [[1, 1]] });
export const sparkle = (buffer: Float32Array, ms: number, freq: number, amp = 0.2) =>
  addTone(buffer, ms, freq, { amp, decay: 9, length: 0.5, partials: [[1, 1], [2.76, 0.3]] });
export const soft = (buffer: Float32Array, ms: number, freq: number, amp = 0.3, length = 0.5) =>
  addTone(buffer, ms, freq, { amp, decay: 4, length, partials: [[1, 1], [2, 0.15], [3, 0.05]] });

/** Encode en WAV PCM 16 bits mono, normalisé à `peakLevel` */
export function toWav(samples: Float32Array, peakLevel = 0.9): Buffer {
  const peak = samples.reduce((max, s) => Math.max(max, Math.abs(s)), 0) || 1;
  const gain = peakLevel / peak;
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s * gain)) * 32767), i * 2));

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // taille du bloc fmt
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28); // octets par seconde
  header.writeUInt16LE(2, 32); // octets par échantillon
  header.writeUInt16LE(16, 34); // bits par échantillon
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}
