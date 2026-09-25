import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSettingsStore } from '../../store/settingsStore';
import { GameComponentProps } from '../GameWrapper/types';
import { GAME_SOUNDS_SCRIPT } from './gameSounds';

interface PhaserGameWrapperProps extends GameComponentProps {
  htmlSource: any; // résultat de require('../../games/dayXX_nom/game.html')
  isStarted: boolean;
}

export function PhaserGameWrapper({ onGameEnd, hintsAvailable, onUseHint, htmlSource, difficulty, isStarted }: PhaserGameWrapperProps) {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isReadyRef = useRef(false);
  // Ref et pas dépendance : utiliser un hint ne doit pas renvoyer INIT (ça relancerait la partie)
  const hintsRef = useRef(hintsAvailable);
  hintsRef.current = hintsAvailable;
  const muted = useSettingsStore((state) => state.muted);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const sendMessageToGame = (message: object) => {
    webViewRef.current?.postMessage(JSON.stringify(message));
  };

  // Bouton 🔊/🔇 : le jeu est prévenu tout de suite
  useEffect(() => {
    if (isReadyRef.current) sendMessageToGame({ type: 'SET_MUTED', muted });
  }, [muted]);

  // Quand le jeu est prêt ET que l'utilisateur a appuyé sur Jouer → envoyer INIT
  useEffect(() => {
    if (isStarted && isReadyRef.current) {
      sendMessageToGame({ type: 'INIT', difficulty: difficulty ?? 'easy', hintsAvailable: hintsRef.current, muted: mutedRef.current });
    }
  }, [isStarted, difficulty]);

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        // Un jeu ne peut pas se terminer avant que le joueur ait appuyé sur Jouer
        if (data.type === 'GAME_OVER' && isStarted) {
          onGameEnd({ success: data.success, score: data.score });
        }

        if (data.type === 'GAME_READY') {
          isReadyRef.current = true;
          setIsLoading(false);
          sendMessageToGame({ type: 'SET_MUTED', muted: mutedRef.current });
          // Envoyer INIT seulement si l'utilisateur a déjà appuyé sur Jouer
          if (isStarted) {
            sendMessageToGame({ type: 'INIT', difficulty: difficulty ?? 'easy', hintsAvailable: hintsRef.current, muted: mutedRef.current });
          }
        }

        if (data.type === 'REQUEST_HINT_USE') {
          onUseHint();
        }
      } catch (error) {
        console.warn('Message WebView invalide reçu:', event.nativeEvent.data);
      }
    },
    [onGameEnd, onUseHint, difficulty, isStarted]
  );

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#7c3aed" />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={htmlSource}
        onMessage={handleMessage}
        injectedJavaScriptBeforeContentLoaded={GAME_SOUNDS_SCRIPT}
        mediaPlaybackRequiresUserAction={false}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
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