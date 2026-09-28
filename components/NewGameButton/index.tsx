import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

const CONFIRM_WINDOW_MS = 3000;

/**
 * « Nouvelle partie » en deux temps : un premier appui demande confirmation (la partie en cours sera perdue),
 * un second appui dans les 3 secondes lance la nouvelle partie.
 */
export function NewGameButton({ onConfirm }: { onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const handlePress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (confirming) {
      setConfirming(false);
      onConfirm();
      return;
    }
    setConfirming(true);
    timerRef.current = setTimeout(() => setConfirming(false), CONFIRM_WINDOW_MS);
  };

  return (
    <Pressable
      style={[styles.button, confirming && styles.buttonConfirm]}
      onPress={handlePress}
      accessibilityLabel={confirming ? 'Confirmer : abandonner cette partie et en commencer une nouvelle' : 'Nouvelle partie'}
    >
      <Text style={[styles.text, confirming && styles.textConfirm]}>
        {confirming ? '⚠️ Touche encore pour abandonner cette partie' : '🔄 Nouvelle partie'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a5a82',
    backgroundColor: '#16233a',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  buttonConfirm: {
    borderColor: '#f87171',
    backgroundColor: '#3a1414',
  },
  text: {
    color: '#b7c8da',
    fontSize: 12,
    fontWeight: '600',
  },
  textConfirm: {
    color: '#fca5a5',
  },
});
