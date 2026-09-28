import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSettingsStore } from '../../store/settingsStore';
import { GameComponentProps } from '../GameWrapper/types';
import { GAME_SOUNDS_SCRIPT } from './gameSounds';

// Version web : react-native-webview ne marche pas dans le navigateur, on utilise une <iframe>.
// Un faux window.ReactNativeWebView est injecté dans le game.html pour garder le même protocole de messages.

interface PhaserGameWrapperProps extends GameComponentProps {
  htmlSource: any; // résultat de require('../../games/dayXX_nom/game.html')
  isStarted: boolean;
}

const BRIDGE_SCRIPT = `<script>
  window.ReactNativeWebView = {
    postMessage: function (data) { window.parent.postMessage({ __phaserBridge: true, data: data }, '*'); }
  };
</script>`;

function resolveHtmlUri(htmlSource: any): string {
  if (typeof htmlSource === 'string') return htmlSource;
  if (htmlSource && typeof htmlSource.uri === 'string') return htmlSource.uri;
  if (htmlSource && typeof htmlSource.default === 'string') return htmlSource.default;
  throw new Error('Source HTML Phaser non reconnue sur le web');
}

export function PhaserGameWrapper({ onGameEnd, hintsAvailable, onUseHint, htmlSource, difficulty, isStarted }: PhaserGameWrapperProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [srcDoc, setSrcDoc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isReadyRef = useRef(false);
  // Ref et pas dépendance : utiliser un hint ne doit pas renvoyer INIT (ça relancerait la partie)
  const hintsRef = useRef(hintsAvailable);
  hintsRef.current = hintsAvailable;
  const muted = useSettingsStore((state) => state.muted);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  useEffect(() => {
    let cancelled = false;
    fetch(resolveHtmlUri(htmlSource))
      .then((response) => response.text())
      .then((html) => {
        if (!cancelled) setSrcDoc(html.replace(/<head>/i, '<head>' + BRIDGE_SCRIPT + '<script>' + GAME_SOUNDS_SCRIPT + '</script>'));
      })
      .catch((error) => console.warn('Chargement du jeu Phaser impossible:', error));
    return () => {
      cancelled = true;
    };
  }, [htmlSource]);

  const sendMessageToGame = (message: object) => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify(message), '*');
  };

  // Bouton 🔊/🔇 : le jeu est prévenu tout de suite
  useEffect(() => {
    if (isReadyRef.current) sendMessageToGame({ type: 'SET_MUTED', muted });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muted]);

  const sendInit = () => {
    sendMessageToGame({ type: 'INIT', difficulty: difficulty ?? 'easy', hintsAvailable: hintsRef.current, muted: mutedRef.current });
  };

  // Quand le jeu est prêt ET que l'utilisateur a appuyé sur Jouer → envoyer INIT
  useEffect(() => {
    if (isStarted && isReadyRef.current) sendInit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStarted, difficulty]);

  const handleMessage = useCallback(
    (raw: string) => {
      try {
        const data = JSON.parse(raw);

        // Un jeu ne peut pas se terminer avant que le joueur ait appuyé sur Jouer
        if (data.type === 'GAME_OVER' && isStarted) {
          onGameEnd({ success: data.success, score: data.score });
        }

        if (data.type === 'GAME_READY') {
          isReadyRef.current = true;
          setIsLoading(false);
          sendMessageToGame({ type: 'SET_MUTED', muted: mutedRef.current });
          if (isStarted) sendInit();
        }

        if (data.type === 'REQUEST_HINT_USE') {
          onUseHint();
        }
      } catch {
        console.warn('Message iframe invalide reçu:', raw);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onGameEnd, onUseHint, difficulty, isStarted]
  );

  // Clavier sur ordi : après le clic sur « Jouer », c'est la page qui a le focus, pas l'iframe du jeu.
  // On recopie donc les touches vers le jeu (s'il a lui-même le focus, il les reçoit déjà directement).
  useEffect(() => {
    if (!isStarted) return;
    const forward = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      const gameWindow = iframeRef.current?.contentWindow as (Window & typeof globalThis) | null | undefined;
      if (!gameWindow) return;
      // Flèches et Espace ne doivent pas faire défiler la page pendant la partie
      if (GAME_KEYS.has(event.key)) event.preventDefault();
      const copy = new gameWindow.KeyboardEvent(event.type, {
        key: event.key,
        code: event.code,
        repeat: event.repeat,
        bubbles: true,
        cancelable: true,
      });
      // Phaser lit encore keyCode, que le constructeur ne permet pas de fixer
      Object.defineProperty(copy, 'keyCode', { get: () => event.keyCode });
      Object.defineProperty(copy, 'which', { get: () => event.which });
      gameWindow.dispatchEvent(copy);
    };
    window.addEventListener('keydown', forward);
    window.addEventListener('keyup', forward);
    return () => {
      window.removeEventListener('keydown', forward);
      window.removeEventListener('keyup', forward);
    };
  }, [isStarted]);

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data && event.data.__phaserBridge) handleMessage(event.data.data);
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [handleMessage]);

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#7c3aed" />
        </View>
      )}
      {srcDoc && (
        <iframe
          ref={iframeRef}
          srcDoc={srcDoc}
          title="phaser-game"
          style={{ flex: 1, width: '100%', height: '100%', border: 'none', backgroundColor: 'transparent' }}
        />
      )}
    </View>
  );
}

const GAME_AREA_BACKGROUND = '#111e31';
const GAME_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ']);

const styles = StyleSheet.create({
  // Zone de jeu encadrée et un peu plus claire que la page : on voit où l'écran de jeu s'arrête
  container: {
    flex: 1,
    backgroundColor: GAME_AREA_BACKGROUND,
    borderWidth: 2,
    borderColor: '#3a5a82',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: GAME_AREA_BACKGROUND,
    zIndex: 10,
  },
});
