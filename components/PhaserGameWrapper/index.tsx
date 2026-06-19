import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { GameComponentProps } from '../GameWrapper/types';

interface PhaserGameWrapperProps extends GameComponentProps {
  htmlSource: any; // résultat de require('../../games/dayXX_nom/game.html')
}

export function PhaserGameWrapper({ onGameEnd, hintsAvailable, onUseHint, htmlSource, difficulty }: PhaserGameWrapperProps) {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        if (data.type === 'GAME_OVER') {
          onGameEnd({ success: data.success, score: data.score });
        }

        if (data.type === 'GAME_READY') {
          setIsLoading(false);
          // on transmet la difficulté au jeu Phaser dès qu'il est prêt
          sendMessageToGame({ type: 'INIT', difficulty: difficulty ?? 'easy' });
        }

        if (data.type === 'REQUEST_HINT_USE') {
          // le jeu Phaser demande confirmation qu'un hint peut être consommé
          onUseHint();
        }
      } catch (error) {
        console.warn('Message WebView invalide reçu:', event.nativeEvent.data);
      }
    },
    [onGameEnd, onUseHint, difficulty]
  );

  const sendMessageToGame = (message: object) => {
    webViewRef.current?.postMessage(JSON.stringify(message));
  };

  // Expose la possibilité d'envoyer un hint depuis l'extérieur si besoin plus tard
  // (actuellement le hint est géré côté Phaser qui appelle REQUEST_HINT_USE lui-même)

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