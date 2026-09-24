import { AudioSource, useAudioPlayer } from 'expo-audio';
import { useCallback } from 'react';

/**
 * Son court d'interface (assets/sounds, générés par `npm run generate:audio`).
 * Renvoie une fonction qui rejoue le son depuis le début à chaque appel.
 * Respecte le mode silencieux du téléphone (réglage audio par défaut).
 */
export function useSoundEffect(source: AudioSource) {
  const player = useAudioPlayer(source);

  return useCallback(() => {
    try {
      // expo-audio ne revient pas au début tout seul après une lecture
      if (player.currentTime > 0) {
        player
          .seekTo(0)
          .then(() => player.play())
          .catch(() => {});
      } else {
        player.play();
      }
    } catch {
      // Un son d'interface ne doit jamais faire planter l'écran
    }
  }, [player]);
}
