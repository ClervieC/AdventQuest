import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GameComponentProps } from '../GameWrapper/types';

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

  useEffect(() => {
    let cancelled = false;
    fetch(resolveHtmlUri(htmlSource))
      .then((response) => response.text())
      .then((html) => {
        if (!cancelled) setSrcDoc(html.replace(/<head>/i, '<head>' + BRIDGE_SCRIPT));
      })
      .catch((error) => console.warn('Chargement du jeu Phaser impossible:', error));
    return () => {
      cancelled = true;
    };
  }, [htmlSource]);

  const sendMessageToGame = (message: object) => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify(message), '*');
  };

  const sendInit = () => {
    sendMessageToGame({ type: 'INIT', difficulty: difficulty ?? 'easy', hintsAvailable: hintsRef.current });
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

        if (data.type === 'GAME_OVER') {
          onGameEnd({ success: data.success, score: data.score });
        }

        if (data.type === 'GAME_READY') {
          isReadyRef.current = true;
          setIsLoading(false);
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0c1521',
    zIndex: 10,
  },
});
