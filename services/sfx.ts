// Bruitages de l'app et des mini-jeux React Native (les jeux Phaser ont leur propre synthé, voir PhaserGameWrapper).
// Sons générés par `npm run generate:audio` dans assets/sounds. Respecte le bouton 🔊/🔇 et le mode silencieux.
import { AudioPlayer, createAudioPlayer } from 'expo-audio';
import { useSettingsStore } from '../store/settingsStore';

const SOURCES = {
  open: require('../assets/sounds/open.wav'),
  victory: require('../assets/sounds/victory.wav'),
  failure: require('../assets/sounds/failure.wav'),
  fragment: require('../assets/sounds/fragment.wav'),
  correct: require('../assets/sounds/correct.wav'),
  wrong: require('../assets/sounds/wrong.wav'),
  tap: require('../assets/sounds/tap.wav'),
  place: require('../assets/sounds/place.wav'),
  rotate: require('../assets/sounds/rotate.wav'),
  bump: require('../assets/sounds/bump.wav'),
  draw: require('../assets/sounds/draw.wav'),
  eat: require('../assets/sounds/eat.wav'),
  card: require('../assets/sounds/card.wav'),
  note0: require('../assets/sounds/note0.wav'),
  note1: require('../assets/sounds/note1.wav'),
  note2: require('../assets/sounds/note2.wav'),
  note3: require('../assets/sounds/note3.wav'),
};

export type SoundName = keyof typeof SOURCES;

// Un lecteur par son, créé à la première utilisation puis réutilisé
const players = new Map<SoundName, AudioPlayer>();

export function playSfx(name: SoundName): void {
  if (useSettingsStore.getState().muted) return;
  try {
    let player = players.get(name);
    if (!player) {
      player = createAudioPlayer(SOURCES[name]);
      players.set(name, player);
    }
    const current = player;
    // expo-audio ne revient pas au début tout seul après une lecture
    if (current.currentTime > 0) {
      current
        .seekTo(0)
        .then(() => current.play())
        .catch(() => {});
    } else {
      current.play();
    }
  } catch {
    // Un bruitage ne doit jamais faire planter un jeu
  }
}
